/**
 * Database Service
 * خدمة التعامل مع قاعدة البيانات
 */

import { query } from '../../config/database';
import {
  SourceType,
  Source,
  Category,
  RawData,
  EditorialPolicy,
  EditorialQueue,
  PublishedItem,
} from '../../models/database/database.models';

/**
 * SourceType Service
 */
export class SourceTypeService {
  /**
   * الحصول على جميع أنواع المصادر
   */
  static async getAll(): Promise<SourceType[]> {
    const result = await query('SELECT * FROM source_types ORDER BY id');
    return result.rows;
  }

  /**
   * الحصول على نوع مصدر بالـ ID
   */
  static async getById(id: number): Promise<SourceType | null> {
    const result = await query('SELECT * FROM source_types WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * الحصول على نوع مصدر بالاسم
   */
  static async getByName(name: string): Promise<SourceType | null> {
    const result = await query('SELECT * FROM source_types WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  /**
   * إنشاء نوع مصدر جديد
   */
  static async create(name: string): Promise<SourceType> {
    const result = await query(
      'INSERT INTO source_types (name) VALUES ($1) RETURNING *',
      [name]
    );
    return result.rows[0];
  }
}

/**
 * Source Service
 */
export class SourceService {
  /**
   * الحصول على جميع المصادر
   */
  static async getAll(): Promise<Source[]> {
    const result = await query(
      `SELECT s.*, st.name as source_type_name 
       FROM sources s 
       LEFT JOIN source_types st ON s.source_type_id = st.id 
       ORDER BY s.id`
    );
    return result.rows;
  }

  /**
   * الحصول على مصدر بالـ ID
   */
  static async getById(id: number): Promise<Source | null> {
    const result = await query('SELECT * FROM sources WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * الحصول على المصادر النشطة
   */
  static async getActive(): Promise<Source[]> {
    const result = await query(
      `SELECT id, source_type_id, url, name, is_active, created_at, default_category_id 
       FROM sources 
       WHERE is_active = true 
       ORDER BY id`
    );
    return result.rows;
  }

  /**
   * إنشاء مصدر جديد
   */
  static async create(
    source_type_id: number,
    url: string,
    name: string,
    is_active: boolean = true
  ): Promise<Source> {
    const result = await query(
      `INSERT INTO sources (source_type_id, url, name, is_active, created_at) 
       VALUES ($1, $2, $3, $4, NOW()) 
       RETURNING *`,
      [source_type_id, url, name, is_active]
    );
    return result.rows[0];
  }

  /**
   * تحديث مصدر
   */
  static async update(
    id: number,
    data: Partial<Source>
  ): Promise<Source | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${paramCount++}`);
      values.push(data.is_active);
    }
    if (data.url !== undefined) {
      fields.push(`url = $${paramCount++}`);
      values.push(data.url);
    }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    const result = await query(
      `UPDATE sources SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
}

/**
 * RawData Service
 */
export class RawDataService {
  /**
   * الحصول على جميع البيانات الخام
   */
  static async getAll(): Promise<RawData[]> {
    const result = await query('SELECT * FROM raw_data ORDER BY fetched_at DESC');
    return result.rows;
  }

  /**
   * الحصول على بيانات خام بالـ ID
   */
  static async getById(id: number): Promise<RawData | null> {
    const result = await query('SELECT * FROM raw_data WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * إنشاء بيانات خام جديدة
   */
  static async create(data: Omit<RawData, 'id' | 'fetched_at'>): Promise<RawData> {
    const result = await query(
      `INSERT INTO raw_data 
       (source_id, source_type_id, category_id, url, title, content, image_url, tags, fetch_status, fetched_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
       RETURNING *`,
      [
        data.source_id,
        data.source_type_id,
        data.category_id,
        data.url,
        data.title,
        data.content,
        data.image_url,
        data.tags,
        data.fetch_status || 'pending',
      ]
    );
    return result.rows[0];
  }

  /**
   * الحصول على البيانات الخام حسب المصدر
   */
  static async getBySourceId(source_id: number): Promise<RawData[]> {
    const result = await query(
      'SELECT * FROM raw_data WHERE source_id = $1 ORDER BY fetched_at DESC',
      [source_id]
    );
    return result.rows;
  }

  /**
   * التحقق من وجود خبر بالـ URL
   */
  static async existsByUrl(url: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM raw_data WHERE url = $1 LIMIT 1',
      [url]
    );
    return result.rows.length > 0;
  }

  /**
   * تحديث تصنيف الخبر
   */
  static async updateCategory(id: number, category_id: number): Promise<RawData | null> {
    const result = await query(
      'UPDATE raw_data SET category_id = $1 WHERE id = $2 RETURNING *',
      [category_id, id]
    );
    return result.rows[0] || null;
  }
}

/**
 * Category Service
 */
export class CategoryService {
  /**
   * الحصول على جميع التصنيفات
   */
  static async getAll(): Promise<Category[]> {
    const result = await query('SELECT * FROM categories WHERE is_active = true ORDER BY name');
    return result.rows;
  }

  /**
   * الحصول على تصنيف بالـ ID
   */
  static async getById(id: number): Promise<Category | null> {
    const result = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * الحصول على تصنيف بالـ slug
   */
  static async getBySlug(slug: string): Promise<Category | null> {
    const result = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  /**
   * إنشاء تصنيف جديد
   */
  static async create(
    name: string,
    slug: string,
    flow: string,
    is_active: boolean = true
  ): Promise<Category> {
    const result = await query(
      `INSERT INTO categories (name, slug, flow, is_active) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, slug, flow, is_active]
    );
    return result.rows[0];
  }
}

/**
 * EditorialQueue Service
 */
export class EditorialQueueService {
  /**
   * الحصول على طابور التحرير
   */
  static async getAll(): Promise<EditorialQueue[]> {
    const result = await query(
      'SELECT * FROM editorial_queue ORDER BY created_at DESC'
    );
    return result.rows;
  }

  /**
   * الحصول على عناصر الطابور حسب الحالة
   */
  static async getByStatus(status: string): Promise<EditorialQueue[]> {
    const result = await query(
      'SELECT * FROM editorial_queue WHERE status = $1 ORDER BY created_at DESC',
      [status]
    );
    return result.rows;
  }

  /**
   * إضافة عنصر جديد للطابور
   */
  static async create(
    media_unit_id: number,
    raw_data_id: number,
    policy_id: number,
    status: string = 'pending'
  ): Promise<EditorialQueue> {
    const result = await query(
      `INSERT INTO editorial_queue 
       (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING *`,
      [media_unit_id, raw_data_id, policy_id, status]
    );
    return result.rows[0];
  }
}

/**
 * PublishedItem Service
 */
export class PublishedItemService {
  /**
   * الحصول على المحتوى المنشور
   */
  static async getAll(): Promise<PublishedItem[]> {
    const result = await query(
      'SELECT * FROM published_items WHERE is_active = true ORDER BY published_at DESC'
    );
    return result.rows;
  }

  /**
   * الحصول على محتوى منشور بالـ ID
   */
  static async getById(id: number): Promise<PublishedItem | null> {
    const result = await query('SELECT * FROM published_items WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * إنشاء محتوى منشور جديد
   */
  static async create(data: Omit<PublishedItem, 'id' | 'published_at'>): Promise<PublishedItem> {
    const result = await query(
      `INSERT INTO published_items 
       (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) 
       RETURNING *`,
      [
        data.media_unit_id,
        data.raw_data_id,
        data.queue_id,
        data.content_type_id,
        data.title,
        data.content,
        data.tags,
        data.is_active || true,
      ]
    );
    return result.rows[0];
  }
}
