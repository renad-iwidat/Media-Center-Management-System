import { ContentModel } from '../../models/content/Content';
import { ShootingModel } from '../../models/management/Shooting';
import { TaskAutomationService } from './TaskAutomationService';
import { Content, CreateContentDTO, UpdateContentDTO, CreateContentFromShootingDTO } from '../../types/content';
import pool from '../../config/database';

export class ContentService {

  // ============ CRUD ============

  async createContent(data: CreateContentDTO): Promise<Content> {
    this.validateContentData(data);

    const content = await ContentModel.create({
      title: data.title,
      content_type_id: data.content_type_id,
      owner_type: data.owner_type,
      owner_id: data.owner_id,
      status_id: data.status_id,
      media_unit_id: data.media_unit_id,
      created_by: data.created_by,
      tags: data.tags,
      task_id: data.task_id,
      cloud_url: data.cloud_url,
      file_size: data.file_size,
      duration: data.duration,
    });

    if (data.task_id) {
      await TaskAutomationService.handleContentUpload(
        content.id, data.task_id, data.created_by, 'output'
      );
    }

    return content;
  }

  async getContent(id: bigint): Promise<Content> {
    const content = await ContentModel.findById(id);
    if (!content) throw new Error('Content not found: ' + id);
    return content;
  }

  async getAllContent(limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findAll(limit, offset);
  }

  async updateContent(id: bigint, data: UpdateContentDTO): Promise<Content> {
    await this.getContent(id);
    const updated = await ContentModel.update(id, data as Partial<Content>);
    if (!updated) throw new Error('Failed to update content: ' + id);

    if (data.is_final === true) {
      await ContentModel.update(id, { is_archived: true, archived_at: new Date() });
    }

    return updated;
  }

  async deleteContent(id: bigint): Promise<boolean> {
    await this.getContent(id);
    return ContentModel.delete(id);
  }

  // ============ Pipeline: Shooting → Content ============

  async createContentFromShooting(data: CreateContentFromShootingDTO): Promise<Content> {
    const shooting = await ShootingModel.findById(data.shooting_id);
    if (!shooting) throw new Error('Shooting not found: ' + data.shooting_id);

    const content = await ContentModel.create({
      title: data.title,
      content_type_id: data.content_type_id,
      owner_type: 'shooting',
      owner_id: data.shooting_id,
      created_by: data.created_by,
      task_id: shooting.task_id,
      cloud_url: data.cloud_url,
      file_size: data.file_size,
      duration: data.duration,
      tags: data.tags,
    });

    if (shooting.task_id) {
      await TaskAutomationService.handleContentUpload(
        content.id, shooting.task_id, data.created_by, data.output_type
      );
    }

    return content;
  }

  async createMultipleFromShooting(
    shootingId: bigint,
    items: Array<{ title: string; content_type_id: bigint; output_type: 'report' | 'social' | 'video' | 'archive'; cloud_url?: string; file_size?: number; duration?: number; tags?: string[] }>,
    createdBy: bigint
  ): Promise<Content[]> {
    const results: Content[] = [];
    for (const item of items) {
      const content = await this.createContentFromShooting({
        shooting_id: shootingId,
        title: item.title,
        content_type_id: item.content_type_id,
        created_by: createdBy,
        cloud_url: item.cloud_url,
        file_size: item.file_size,
        duration: item.duration,
        tags: item.tags,
        output_type: item.output_type,
      });
      results.push(content);
    }
    return results;
  }

  // ============ Unified Search & Filter ============

  async searchContent(query: {
    keyword?: string;
    content_type_id?: bigint;
    status_id?: bigint;
    media_unit_id?: bigint;
    created_by?: bigint;
    from_date?: Date;
    to_date?: Date;
    is_archived?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Content[]> {
    const conds: string[] = [];
    const vals: any[] = [];
    let p = 1;

    if (query.keyword) { conds.push('(title ILIKE $' + p + ' OR tags::text ILIKE $' + p + ')'); vals.push('%' + query.keyword + '%'); p++; }
    if (query.content_type_id) { conds.push('content_type_id = $' + p); vals.push(query.content_type_id); p++; }
    if (query.status_id) { conds.push('status_id = $' + p); vals.push(query.status_id); p++; }
    if (query.media_unit_id) { conds.push('media_unit_id = $' + p); vals.push(query.media_unit_id); p++; }
    if (query.created_by) { conds.push('created_by = $' + p); vals.push(query.created_by); p++; }
    if (query.from_date) { conds.push('created_at >= $' + p); vals.push(query.from_date); p++; }
    if (query.to_date) { conds.push('created_at <= $' + p); vals.push(query.to_date); p++; }
    if (query.is_archived !== undefined) { conds.push('is_archived = $' + p); vals.push(query.is_archived); p++; }

    const where = conds.length > 0 ? 'WHERE ' + conds.join(' AND ') : '';
    vals.push(query.limit || 10, query.offset || 0);

    const sql = 'SELECT * FROM content ' + where + ' ORDER BY created_at DESC LIMIT $' + p + ' OFFSET $' + (p + 1);
    const result = await pool.query(sql, vals);
    return result.rows;
  }

  // ============ Tags ============

  async addTag(contentId: bigint, tagId: bigint): Promise<void> {
    await this.getContent(contentId);
    await ContentModel.addTag({ content_id: contentId, tag_id: tagId });
  }

  async removeTag(contentId: bigint, tagId: bigint): Promise<boolean> {
    return ContentModel.removeTag(contentId, tagId);
  }

  // ============ Reuse (إعادة الاستخدام) ============

  async reuseContent(contentId: bigint, taskId: bigint, reusedBy: bigint): Promise<void> {
    await this.getContent(contentId);
    await TaskAutomationService.handleContentLinking(contentId, taskId, 'reuse', reusedBy);
  }

  async linkToTask(contentId: bigint, taskId: bigint, linkedBy: bigint, usageType: string = 'reference'): Promise<void> {
    await this.getContent(contentId);
    await TaskAutomationService.handleContentLinking(contentId, taskId, usageType, linkedBy);
  }

  async unlinkFromTask(contentId: bigint, taskId: bigint): Promise<boolean> {
    return ContentModel.unlinkTask(contentId, taskId);
  }

  async getReuseCount(contentId: bigint): Promise<number> {
    const result = await pool.query(
      "SELECT COUNT(*) as count FROM content_tasks WHERE content_id = $1 AND usage_type = 'reuse'",
      [contentId]
    );
    return parseInt(result.rows[0].count) || 0;
  }

  async getMostReusedContent(limit: number = 10): Promise<any[]> {
    const result = await pool.query(
      "SELECT c.id, c.title, c.content_type_id, ct.name as type_name, c.created_at, " +
      "COUNT(cta.task_id) as reuse_count " +
      "FROM content c " +
      "INNER JOIN content_tasks cta ON c.id = cta.content_id AND cta.usage_type = 'reuse' " +
      "LEFT JOIN content_types ct ON c.content_type_id = ct.id " +
      "GROUP BY c.id, c.title, c.content_type_id, ct.name, c.created_at " +
      "ORDER BY reuse_count DESC " +
      "LIMIT $1",
      [limit]
    );
    return result.rows;
  }

  async getContentReuseHistory(contentId: bigint): Promise<any[]> {
    const result = await pool.query(
      "SELECT cta.task_id, cta.linked_at, cta.linked_by, " +
      "t.title as task_title, t.order_id, u.name as reused_by_name " +
      "FROM content_tasks cta " +
      "INNER JOIN tasks t ON cta.task_id = t.id " +
      "LEFT JOIN users u ON cta.linked_by = u.id " +
      "WHERE cta.content_id = $1 AND cta.usage_type = 'reuse' " +
      "ORDER BY cta.linked_at DESC",
      [contentId]
    );
    return result.rows;
  }

  // ============ Archive ============

  async archiveContent(id: bigint, archivedBy: bigint): Promise<void> {
    await this.getContent(id);
    await TaskAutomationService.handleContentArchive(id, archivedBy);
  }

  // ============ Metadata ============

  async getContentTypes(): Promise<any[]> { return ContentModel.getTypes(); }
  async getContentStatuses(): Promise<any[]> { return ContentModel.getStatuses(); }

  // ============ Validation ============

  private validateContentData(data: CreateContentDTO): void {
    const errors: string[] = [];
    if (!data.title || data.title.trim().length < 2) errors.push('Title is required (min 2 characters)');
    if (!data.content_type_id) errors.push('Content type is required');
    if (!data.created_by) errors.push('Created by is required');
    if (errors.length > 0) throw new Error('Validation errors: ' + errors.join(', '));
  }
}
