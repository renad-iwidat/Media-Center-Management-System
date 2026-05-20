import { query } from '../../config/database';

/**
 * BulletinsService
 * إدارة الموجزات والنشرات المحفوظة
 */

export interface GeneratedBulletin {
  id: number;
  media_unit_id: number;
  type: 'summary' | 'bulletin';
  time_of_day: 'morning' | 'evening';
  title: string;
  original_content: string;
  edited_content: string | null;
  status: 'draft' | 'published' | 'archived';
  news_count: number;
  word_count: number;
  created_by: number | null;
  updated_by: number | null;
  audio_generated: boolean;
  created_at: string;
  updated_at: string;
  media_unit_name?: string;
}

export class BulletinsService {

  /**
   * إنشاء الجدول إذا لم يكن موجوداً
   */
  async ensureTable(): Promise<void> {
    await query(`
      CREATE TABLE IF NOT EXISTS generated_bulletins (
        id                  SERIAL PRIMARY KEY,
        media_unit_id       INTEGER NOT NULL,
        type                VARCHAR(20) NOT NULL DEFAULT 'summary',
        time_of_day         VARCHAR(20) NOT NULL DEFAULT 'morning',
        title               VARCHAR(500) NOT NULL DEFAULT '',
        original_content    TEXT NOT NULL,
        edited_content      TEXT,
        status              VARCHAR(20) NOT NULL DEFAULT 'draft',
        news_count          INTEGER DEFAULT 0,
        word_count          INTEGER DEFAULT 0,
        created_by          INTEGER,
        updated_by          INTEGER,
        audio_generated     BOOLEAN DEFAULT false,
        created_at          TIMESTAMP DEFAULT NOW(),
        updated_at          TIMESTAMP DEFAULT NOW()
      )
    `);
  }

  /**
   * حفظ موجز/نشرة جديدة
   */
  async create(data: {
    media_unit_id: number;
    type: 'summary' | 'bulletin';
    time_of_day: 'morning' | 'evening';
    title: string;
    original_content: string;
    edited_content?: string;
    news_count?: number;
    created_by?: number;
  }): Promise<GeneratedBulletin> {
    await this.ensureTable();

    const content = data.edited_content || data.original_content;
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    const result = await query(
      `INSERT INTO generated_bulletins 
        (media_unit_id, type, time_of_day, title, original_content, edited_content, news_count, word_count, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        data.media_unit_id,
        data.type,
        data.time_of_day,
        data.title,
        data.original_content,
        data.edited_content || null,
        data.news_count || 0,
        wordCount,
        data.created_by || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * تحديث محتوى موجز/نشرة (تعديل المحرر)
   */
  async update(id: number, data: {
    edited_content?: string;
    title?: string;
    status?: 'draft' | 'published' | 'archived';
    updated_by?: number;
  }): Promise<GeneratedBulletin | null> {
    const updates: string[] = [];
    const params: any[] = [id];
    let paramIdx = 2;

    if (data.edited_content !== undefined) {
      updates.push(`edited_content = $${paramIdx}`);
      params.push(data.edited_content);
      paramIdx++;

      // تحديث عدد الكلمات
      const wordCount = data.edited_content.trim().split(/\s+/).filter(Boolean).length;
      updates.push(`word_count = $${paramIdx}`);
      params.push(wordCount);
      paramIdx++;
    }

    if (data.title !== undefined) {
      updates.push(`title = $${paramIdx}`);
      params.push(data.title);
      paramIdx++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIdx}`);
      params.push(data.status);
      paramIdx++;
    }

    if (data.updated_by !== undefined) {
      updates.push(`updated_by = $${paramIdx}`);
      params.push(data.updated_by);
      paramIdx++;
    }

    updates.push('updated_at = NOW()');

    if (updates.length === 1) return null; // فقط updated_at

    const result = await query(
      `UPDATE generated_bulletins SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      params
    );

    return result.rows[0] || null;
  }

  /**
   * جلب جميع الموجزات/النشرات لوحدة إعلامية
   */
  async getAll(mediaUnitId?: number, limit: number = 50): Promise<GeneratedBulletin[]> {
    await this.ensureTable();

    let sql = `
      SELECT gb.*, mu.name as media_unit_name
      FROM generated_bulletins gb
      LEFT JOIN media_units mu ON gb.media_unit_id = mu.id
    `;
    const params: any[] = [];

    if (mediaUnitId) {
      sql += ` WHERE gb.media_unit_id = $1`;
      params.push(mediaUnitId);
    }

    sql += ` ORDER BY gb.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * جلب موجز/نشرة بالـ ID
   */
  async getById(id: number): Promise<GeneratedBulletin | null> {
    await this.ensureTable();

    const result = await query(
      `SELECT gb.*, mu.name as media_unit_name
       FROM generated_bulletins gb
       LEFT JOIN media_units mu ON gb.media_unit_id = mu.id
       WHERE gb.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * حذف موجز/نشرة
   */
  async delete(id: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM generated_bulletins WHERE id = $1 RETURNING id`,
      [id]
    );
    return result.rows.length > 0;
  }

  /**
   * تحديث حالة الصوت
   */
  async markAudioGenerated(id: number): Promise<void> {
    await query(
      `UPDATE generated_bulletins SET audio_generated = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

export default new BulletinsService();
