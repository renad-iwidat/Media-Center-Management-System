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
   * الحصول على جميع المصادر مع آخر وقت سحب
   */
  static async getAll(): Promise<Source[]> {
    const result = await query(
      `SELECT s.id, s.source_type_id, s.url, s.name, s.is_active, s.created_at, s.default_category_id, s.last_fetched_at, st.name as source_type_name 
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
      `SELECT id, source_type_id, url, name, is_active, created_at, default_category_id, last_fetched_at 
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

  /**
   * تحديث آخر وقت سحب للمصدر
   */
  static async updateLastFetched(id: number): Promise<Source | null> {
    const result = await query(
      `UPDATE sources SET last_fetched_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * البحث عن مصدر بالـ slug — أو إنشاؤه إذا ما كان موجود
   * يُستخدم لربط الأخبار القادمة من NewsDesk API بمصادرها
   */
  static async findOrCreateBySlug(slug: string, name: string, baseUrl: string): Promise<Source> {
    // أولاً: البحث بالـ slug
    const existing = await query(
      `SELECT * FROM sources WHERE slug = $1 LIMIT 1`,
      [slug]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0];
    }

    // ثانياً: البحث بالاسم (للمصادر القديمة بدون slug)
    const byName = await query(
      `SELECT * FROM sources WHERE LOWER(TRIM(name)) = LOWER(TRIM($1)) LIMIT 1`,
      [name]
    );
    if (byName.rows.length > 0) {
      // تحديث الـ slug للمصدر الموجود
      await query(`UPDATE sources SET slug = $1 WHERE id = $2`, [slug, byName.rows[0].id]);
      return { ...byName.rows[0], slug };
    }

    // ثالثاً: البحث بالـ URL (لتجنب duplicate key على url)
    const byUrl = await query(
      `SELECT * FROM sources WHERE url = $1 LIMIT 1`,
      [baseUrl]
    );
    if (byUrl.rows.length > 0) {
      // تحديث الـ slug للمصدر الموجود
      if (!byUrl.rows[0].slug) {
        await query(`UPDATE sources SET slug = $1 WHERE id = $2`, [slug, byUrl.rows[0].id]);
      }
      return { ...byUrl.rows[0], slug: byUrl.rows[0].slug || slug };
    }

    // رابعاً: ضمان وجود source_type_id = 2 (API) في source_types
    await query(
      `INSERT INTO source_types (id, name) VALUES (2, 'API') ON CONFLICT (id) DO NOTHING`
    );

    // خامساً: إنشاء مصدر جديد
    // إذا الـ URL فاضي، نستخدم slug كـ URL مؤقت لتجنب conflict على URL فاضي
    const effectiveUrl = baseUrl && baseUrl.trim() ? baseUrl.trim() : `api://${slug}`;
    
    const result = await query(
      `INSERT INTO sources (source_type_id, url, name, slug, is_active, created_at) 
       VALUES ($1, $2, $3, $4, true, NOW()) 
       ON CONFLICT (url) DO UPDATE SET slug = COALESCE(sources.slug, EXCLUDED.slug)
       RETURNING *`,
      [2, effectiveUrl, name, slug] // source_type_id = 2 (API)
    );
    return result.rows[0];
  }

  /**
   * البحث عن مصدر بالـ slug
   */
  static async getBySlug(slug: string): Promise<Source | null> {
    const result = await query('SELECT * FROM sources WHERE slug = $1', [slug]);
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
   * يستخدم Upsert — إذا المقالة موجودة (بالـ newsdesk_article_id) يتم تحديثها بدل الخطأ
   */
  static async create(data: Omit<RawData, 'id' | 'fetched_at'>): Promise<RawData> {
    // إذا عندنا newsdesk_article_id — نستخدم upsert لتجنب duplicate
    if (data.newsdesk_article_id) {
      const existing = await query(
        `SELECT id FROM raw_data WHERE newsdesk_article_id = $1 LIMIT 1`,
        [data.newsdesk_article_id]
      );
      if (existing.rows.length > 0) {
        // تحديث المقالة الموجودة (content, title, etc.)
        const updated = await query(
          `UPDATE raw_data SET
            title = $1, content = $2, image_url = $3, summary = $4,
            category_id = COALESCE($5, category_id),
            geo_scope_id = COALESCE($6, geo_scope_id),
            media_unit_id = COALESCE($7, media_unit_id),
            category_slug = COALESCE(NULLIF($8, ''), category_slug),
            geo_scope_slug = COALESCE(NULLIF($9, ''), geo_scope_slug)
          WHERE id = $10 RETURNING *`,
          [
            data.title, data.content, data.image_url, data.summary || '',
            data.category_id, data.geo_scope_id || null, data.media_unit_id || null,
            data.category_slug || '', data.geo_scope_slug || '',
            existing.rows[0].id,
          ]
        );
        return updated.rows[0];
      }
    }

    const result = await query(
      `INSERT INTO raw_data 
       (source_id, source_type_id, category_id, geo_scope_id, media_unit_id, url, title, content, image_url, tags, fetch_status, pub_date,
        summary, authors, language, source_slug, geo_scope_slug, ai_confidence, newsdesk_article_id, category_slug,
        fetched_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW()) 
       RETURNING *`,
      [
        data.source_id || null,
        data.source_type_id,
        data.category_id,
        data.geo_scope_id || null,
        data.media_unit_id || null,
        data.url,
        data.title,
        data.content,
        data.image_url,
        data.tags,
        data.fetch_status || 'pending',
        data.pub_date || null,
        data.summary || '',
        data.authors || '',
        data.language || 'ar',
        data.source_slug || '',
        data.geo_scope_slug || '',
        data.ai_confidence || null,
        data.newsdesk_article_id || null,
        data.category_slug || '',
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
   * جلب id الخبر بالـ URL (أو null إذا غير موجود)
   */
  static async getIdByUrl(url: string): Promise<number | null> {
    const result = await query(
      'SELECT id FROM raw_data WHERE url = $1 LIMIT 1',
      [url]
    );
    return result.rows[0]?.id ?? null;
  }

  /**
   * جلب id الخبر بـ newsdesk_article_id (أو null إذا غير موجود)
   */
  static async getIdByNewsDeskId(newsDeskId: number): Promise<number | null> {
    const result = await query(
      'SELECT id FROM raw_data WHERE newsdesk_article_id = $1 LIMIT 1',
      [newsDeskId]
    );
    return result.rows[0]?.id ?? null;
  }

  /**
   * التحقق من وجود خبر بـ newsdesk_article_id
   */
  static async existsByNewsDeskId(newsDeskId: number): Promise<boolean> {
    const result = await query(
      'SELECT id FROM raw_data WHERE newsdesk_article_id = $1 LIMIT 1',
      [newsDeskId]
    );
    return result.rows.length > 0;
  }

  /**
   * التحقق من وجود خبر مكرر بناءً على العنوان والمحتوى
   * يستخدم exact match على العنوان (case-insensitive + trimmed)
   * أو أول 200 حرف من المحتوى
   */
  static async existsBySimilarity(title: string, content: string): Promise<boolean> {
    try {
      // تطبيع النصوص: إزالة المسافات الزائدة وتحويل لأحرف صغيرة
      const normalizedTitle = title.trim().toLowerCase();
      
      if (!normalizedTitle) return false;

      // البحث عن أخبار بنفس العنوان تماماً (الطريقة الأكثر فعالية)
      const exactMatch = await query(
        `SELECT id FROM raw_data 
         WHERE LOWER(TRIM(title)) = $1 
         LIMIT 1`,
        [normalizedTitle]
      );

      if (exactMatch.rows.length > 0) {
        return true;
      }

      // البحث عن أخبار بعنوان مشابه جداً (أول 50 حرف) — لمعالجة حالات الاختلاف البسيط
      if (normalizedTitle.length > 30) {
        const partialMatch = await query(
          `SELECT id FROM raw_data 
           WHERE LOWER(TRIM(SUBSTRING(title, 1, 50))) = $1 
           LIMIT 1`,
          [normalizedTitle.substring(0, 50)]
        );

        if (partialMatch.rows.length > 0) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ خطأ في التحقق من التشابه:', error);
      return false;
    }
  }

  /**
   * تحديث تصنيف الخبر
   */
  static async updateCategory(id: number, category_id: number | null): Promise<RawData | null> {
    const result = await query(
      'UPDATE raw_data SET category_id = $1 WHERE id = $2 RETURNING *',
      [category_id, id]
    );
    return result.rows[0] || null;
  }
}

/**
 * GeoScope Service
 * خدمة النطاقات الجغرافية
 */
export class GeoScopeService {
  /**
   * جلب كل النطاقات الجغرافية
   */
  static async getAll(): Promise<any[]> {
    const result = await query('SELECT * FROM geographic_scopes WHERE is_active = true ORDER BY sort_order');
    return result.rows;
  }

  /**
   * البحث بالـ slug
   */
  static async getBySlug(slug: string): Promise<any | null> {
    const result = await query('SELECT * FROM geographic_scopes WHERE slug = $1', [slug]);
    return result.rows[0] || null;
  }

  /**
   * البحث بالـ ID
   */
  static async getById(id: number): Promise<any | null> {
    const result = await query('SELECT * FROM geographic_scopes WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * فلترة حسب scope_level
   */
  static async getByLevel(level: string): Promise<any[]> {
    const result = await query('SELECT * FROM geographic_scopes WHERE scope_level = $1 AND is_active = true ORDER BY sort_order', [level]);
    return result.rows;
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
   * التحقق من وجود خبر في الطابور (غير مرفوض)
   */
  static async existsInQueue(
    raw_data_id: number,
    media_unit_id: number
  ): Promise<boolean> {
    const result = await query(
      `SELECT id FROM editorial_queue 
       WHERE raw_data_id = $1 AND media_unit_id = $2 AND status != 'rejected'
       LIMIT 1`,
      [raw_data_id, media_unit_id]
    );
    return result.rows.length > 0;
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
