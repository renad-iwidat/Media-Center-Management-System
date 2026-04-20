import pool from '../../config/database';
import { Content, ContentType, ContentStatus, ContentSource, ContentTag, ContentTask, PublishedItem } from '../../types/content';

export class ContentModel {
  static async findById(id: bigint): Promise<Content | null> {
    const result = await pool.query('SELECT * FROM content WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByCreator(userId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content WHERE created_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async findByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content WHERE status_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [statusId, limit, offset]
    );
    return result.rows;
  }

  static async findByType(typeId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content WHERE content_type_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [typeId, limit, offset]
    );
    return result.rows;
  }

  static async findByMediaUnit(mediaUnitId: bigint, limit: number = 10, offset: number = 0): Promise<Content[]> {
    const result = await pool.query(
      'SELECT * FROM content WHERE media_unit_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [mediaUnitId, limit, offset]
    );
    return result.rows;
  }

  static async create(content: Omit<Content, 'id' | 'created_at'>): Promise<Content> {
    const result = await pool.query(
      `INSERT INTO content (title, content_type_id, owner_type, owner_id, status_id, is_final, sequence_order, media_unit_id, created_by, tags, task_id, cloud_url, file_size, duration, version, is_archived, archived_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [content.title, content.content_type_id, content.owner_type, content.owner_id, content.status_id, content.is_final, content.sequence_order, content.media_unit_id, content.created_by, content.tags, content.task_id, content.cloud_url, content.file_size, content.duration, content.version, content.is_archived, content.archived_at]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Content>): Promise<Content | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Content]);
    values.push(id);

    const result = await pool.query(
      `UPDATE content SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM content WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async getTypes(): Promise<ContentType[]> {
    const result = await pool.query('SELECT * FROM content_types');
    return result.rows;
  }

  static async getStatuses(): Promise<ContentStatus[]> {
    const result = await pool.query('SELECT * FROM content_statuses');
    return result.rows;
  }

  static async getTags(contentId: bigint): Promise<ContentTag[]> {
    const result = await pool.query(
      'SELECT * FROM content_tags WHERE content_id = $1',
      [contentId]
    );
    return result.rows;
  }

  static async addTag(tag: Omit<ContentTag, 'id'>): Promise<ContentTag> {
    const result = await pool.query(
      `INSERT INTO content_tags (content_id, tag_id)
       VALUES ($1, $2)
       RETURNING *`,
      [tag.content_id, tag.tag_id]
    );
    return result.rows[0];
  }

  static async removeTag(contentId: bigint, tagId: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM content_tags WHERE content_id = $1 AND tag_id = $2',
      [contentId, tagId]
    );
    return result.rowCount! > 0;
  }

  static async getSources(contentId: bigint): Promise<ContentSource[]> {
    const result = await pool.query(
      'SELECT * FROM content_source WHERE content_id = $1',
      [contentId]
    );
    return result.rows;
  }

  static async addSource(source: Omit<ContentSource, 'id'>): Promise<ContentSource> {
    const result = await pool.query(
      `INSERT INTO content_source (content_id, published_item_id)
       VALUES ($1, $2)
       RETURNING *`,
      [source.content_id, source.published_item_id]
    );
    return result.rows[0];
  }

  static async getRelatedTasks(contentId: bigint): Promise<ContentTask[]> {
    const result = await pool.query(
      'SELECT * FROM content_tasks WHERE content_id = $1',
      [contentId]
    );
    return result.rows;
  }

  static async linkTask(link: Omit<ContentTask, 'id'>): Promise<ContentTask> {
    const result = await pool.query(
      `INSERT INTO content_tasks (task_id, content_id)
       VALUES ($1, $2)
       RETURNING *`,
      [link.task_id, link.content_id]
    );
    return result.rows[0];
  }

  static async unlinkTask(contentId: bigint, taskId: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM content_tasks WHERE content_id = $1 AND task_id = $2',
      [contentId, taskId]
    );
    return result.rowCount! > 0;
  }
}
