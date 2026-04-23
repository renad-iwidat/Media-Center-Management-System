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

    // Auto-link to task and update KPI
    if (data.task_id) {
      await TaskAutomationService.handleContentUpload(
        content.id,
        data.task_id,
        data.created_by,
        'output'
      );
    }

    return content;
  }

  async getContent(id: bigint): Promise<Content> {
    const content = await ContentModel.findById(id);
    if (!content) {
      throw new Error(`Content not found: ${id}`);
    }
    return content;
  }

  async getAllContent(limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findAll(limit, offset);
  }

  async updateContent(id: bigint, data: UpdateContentDTO): Promise<Content> {
    await this.getContent(id);

    const updated = await ContentModel.update(id, data as Partial<Content>);
    if (!updated) {
      throw new Error(`Failed to update content: ${id}`);
    }

    // Auto-archive when marked as final
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

  /**
   * إنشاء محتوى من تصوير
   * هاي الـ API الأهم — بتربط الـ Shooting بالـ Content
   */
  async createContentFromShooting(data: CreateContentFromShootingDTO): Promise<Content> {
    // Verify shooting exists
    const shooting = await ShootingModel.findById(data.shooting_id);
    if (!shooting) {
      throw new Error(`Shooting not found: ${data.shooting_id}`);
    }

    // Create content linked to the shooting's order and task
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

    // Auto-link to task and update KPI
    if (shooting.task_id) {
      await TaskAutomationService.handleContentUpload(
        content.id,
        shooting.task_id,
        data.created_by,
        data.output_type
      );
    }

    return content;
  }

  /**
   * إنشاء عدة محتويات من تصوير واحد
   * مثلاً: تصوير واحد → تقرير + سوشال + فيديو
   */
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

  // ============ Filtering ============

  async getContentByType(typeId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findByType(typeId, limit, offset);
  }

  async getContentByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findByStatus(statusId, limit, offset);
  }

  async getContentByCreator(userId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findByCreator(userId, limit, offset);
  }

  async getContentByMediaUnit(mediaUnitId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    return ContentModel.findByMediaUnit(mediaUnitId, limit, offset);
  }

  async getArchivedContent(limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content WHERE is_archived = true ORDER BY archived_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  // ============ Search ============

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
    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (query.keyword) {
      conditions.push(`(title ILIKE $${paramCount} OR tags::text ILIKE $${paramCount})`);
      values.push(`%${query.keyword}%`);
      paramCount++;
    }

    if (query.content_type_id) {
      conditions.push(`content_type_id = $${paramCount}`);
      values.push(query.content_type_id);
      paramCount++;
    }

    if (query.status_id) {
      conditions.push(`status_id = $${paramCount}`);
      values.push(query.status_id);
      paramCount++;
    }

    if (query.media_unit_id) {
      conditions.push(`media_unit_id = $${paramCount}`);
      values.push(query.media_unit_id);
      paramCount++;
    }

    if (query.created_by) {
      conditions.push(`created_by = $${paramCount}`);
      values.push(query.created_by);
      paramCount++;
    }

    if (query.from_date) {
      conditions.push(`created_at >= $${paramCount}`);
      values.push(query.from_date);
      paramCount++;
    }

    if (query.to_date) {
      conditions.push(`created_at <= $${paramCount}`);
      values.push(query.to_date);
      paramCount++;
    }

    if (query.is_archived !== undefined) {
      conditions.push(`is_archived = $${paramCount}`);
      values.push(query.is_archived);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = query.limit || 10;
    const offset = query.offset || 0;

    values.push(limit, offset);

    const result = await pool.query(
      `SELECT * FROM content ${whereClause} ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      values
    );

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

  // ============ Task Linking (Reuse) ============

  async linkToTask(contentId: bigint, taskId: bigint, linkedBy: bigint, usageType: string = 'reference'): Promise<void> {
    await this.getContent(contentId);
    await TaskAutomationService.handleContentLinking(contentId, taskId, usageType, linkedBy);
  }

  async unlinkFromTask(contentId: bigint, taskId: bigint): Promise<boolean> {
    return ContentModel.unlinkTask(contentId, taskId);
  }

  // ============ Archive ============

  async archiveContent(id: bigint, archivedBy: bigint): Promise<void> {
    await this.getContent(id);
    await TaskAutomationService.handleContentArchive(id, archivedBy);
  }

  // ============ Metadata ============

  async getContentTypes(): Promise<any[]> {
    return ContentModel.getTypes();
  }

  async getContentStatuses(): Promise<any[]> {
    return ContentModel.getStatuses();
  }

  // ============ Validation ============

  private validateContentData(data: CreateContentDTO): void {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length < 2) {
      errors.push('Title is required (min 2 characters)');
    }

    if (!data.content_type_id) {
      errors.push('Content type is required');
    }

    if (!data.created_by) {
      errors.push('Created by is required');
    }

    if (errors.length > 0) {
      throw new Error(`Validation errors: ${errors.join(', ')}`);
    }
  }
}
