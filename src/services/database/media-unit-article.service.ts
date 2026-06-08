/**
 * Media Unit Article Service
 * خدمة إدارة النسخ المعالجة من الأخبار لكل وحدة إعلامية
 *
 * الفكرة:
 *   raw_data = الخبر الأصلي (ثابت، يُخزّن مرة وحدة)
 *   media_unit_articles = نسخة مستقلة لكل (خبر + وحدة إعلامية)
 *
 * المسؤوليات:
 *   - createProjection: إنشاء نسخة لخبر لوحدة محددة (بدون تكرار المحتوى)
 *   - fanOut: توزيع خبر على كل الوحدات المرتبطة بمصدره
 *   - applyEdit: تطبيق تعديل خاص بوحدة (عنوان/محتوى/...)
 *   - resetField: إرجاع حقل لقيمته الأصلية من raw_data
 *   - getResolved: جلب النسخة مدموجة مع الأصل (من الـ view)
 */

import { query } from '../../config/database';

export interface MediaUnitArticle {
  id: number;
  raw_data_id: number;
  media_unit_id: number;
  source_id: number | null;
  newsdesk_article_id: number | null;
  title: string | null;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  tags: string[];
  category_id: number | null;
  geo_scope_id: number | null;
  ai_confidence: number | null;
  ai_processed: boolean;
  status: string;
  flow: string | null;
  is_modified: boolean;
  is_incomplete: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectionInput {
  rawDataId: number;
  mediaUnitId: number;
  sourceId?: number | null;
  newsdeskArticleId?: number | null;
  categoryId?: number | null;
  geoScopeId?: number | null;
  aiConfidence?: number | null;
  aiProcessed?: boolean;
  status?: string;
  flow?: 'automated' | 'editorial' | null;
  isIncomplete?: boolean;
}

/** الحقول القابلة للتعديل الخاص بكل وحدة */
type EditableField = 'title' | 'summary' | 'content' | 'image_url' | 'tags' | 'category_id' | 'geo_scope_id';

export class MediaUnitArticleService {
  /**
   * إنشاء (أو إرجاع) نسخة لخبر لوحدة محددة
   * idempotent — لو النسخة موجودة بيرجّعها بدون تكرار
   * المحتوى يبقى NULL (يرث من raw_data) — ما منكرّر النص
   */
  static async createProjection(input: CreateProjectionInput): Promise<MediaUnitArticle> {
    const result = await query(
      `INSERT INTO media_unit_articles
        (raw_data_id, media_unit_id, source_id, newsdesk_article_id,
         category_id, geo_scope_id, ai_confidence, ai_processed,
         status, flow, is_incomplete, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       ON CONFLICT (raw_data_id, media_unit_id)
       DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [
        input.rawDataId,
        input.mediaUnitId,
        input.sourceId ?? null,
        input.newsdeskArticleId ?? null,
        input.categoryId ?? null,
        input.geoScopeId ?? null,
        input.aiConfidence ?? null,
        input.aiProcessed ?? false,
        input.status ?? 'pending',
        input.flow ?? null,
        input.isIncomplete ?? false,
      ]
    );
    return result.rows[0];
  }

  /**
   * توزيع خبر على كل الوحدات الإعلامية المرتبطة بمصدره
   * (مصدر مشترك بين عدة وحدات → نسخة لكل وحدة، بدون تكرار المحتوى)
   *
   * يقبل أيضاً قائمة وحدات صريحة (من media_units[] اللي بترجع من الـ API)
   * لها الأولوية، وإلا بنوزّع حسب media_unit_sources.
   *
   * يرجع عدد النسخ اللي تم إنشاؤها/تأكيدها.
   */
  static async fanOut(params: {
    rawDataId: number;
    sourceId: number | null;
    newsdeskArticleId?: number | null;
    categoryId?: number | null;
    geoScopeId?: number | null;
    aiConfidence?: number | null;
    explicitMediaUnitIds?: number[];
  }): Promise<{ mediaUnitIds: number[]; created: number }> {
    let mediaUnitIds: number[] = [];

    // 1. الوحدات الصريحة (من السحب: media_unit_id) — نضيفها كنقطة بداية
    //    لكن لا نكتفي بها — نكمل دائماً للمصادر المشتركة
    if (params.explicitMediaUnitIds && params.explicitMediaUnitIds.length > 0) {
      mediaUnitIds = [...params.explicitMediaUnitIds];
    }

    // 2. كل الوحدات المرتبطة بالمصدر (مصدر مشترك بين عدة وحدات)
    //    يضمن وصول الخبر لكل وحدة تشترك في هذا المصدر، بغض النظر عن
    //    الوحدة التي سحبت الخبر أصلاً.
    if (params.sourceId) {
      const linked = await query(
        `SELECT DISTINCT mus.media_unit_id
         FROM media_unit_sources mus
         JOIN media_units mu ON mu.id = mus.media_unit_id
         WHERE mus.source_id = $1 AND mus.is_active = true AND mu.is_active = true`,
        [params.sourceId]
      );
      for (const row of linked.rows) {
        if (!mediaUnitIds.includes(row.media_unit_id)) {
          mediaUnitIds.push(row.media_unit_id);
        }
      }
    }

    if (mediaUnitIds.length === 0) {
      return { mediaUnitIds: [], created: 0 };
    }

    // 3. إنشاء نسخة لكل وحدة (المحتوى يرث من raw_data — بدون تكرار)
    let created = 0;
    for (const unitId of mediaUnitIds) {
      await this.createProjection({
        rawDataId: params.rawDataId,
        mediaUnitId: unitId,
        sourceId: params.sourceId,
        newsdeskArticleId: params.newsdeskArticleId,
        categoryId: params.categoryId,
        geoScopeId: params.geoScopeId,
        aiConfidence: params.aiConfidence,
        aiProcessed: params.categoryId != null,
        status: 'pending',
      });
      created++;
    }

    return { mediaUnitIds, created };
  }

  /**
   * هل توجد نسخة لهذا الخبر لهذه الوحدة؟
   */
  static async exists(rawDataId: number, mediaUnitId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM media_unit_articles WHERE raw_data_id = $1 AND media_unit_id = $2 LIMIT 1`,
      [rawDataId, mediaUnitId]
    );
    return result.rows.length > 0;
  }

  /**
   * تطبيق تعديل خاص بوحدة على حقل واحد أو أكثر
   * يضبط is_modified = true (النسخة صارت مختلفة عن الأصل)
   */
  static async applyEdit(
    id: number,
    edits: Partial<Pick<MediaUnitArticle, EditableField>>
  ): Promise<MediaUnitArticle | null> {
    const allowed: EditableField[] = ['title', 'summary', 'content', 'image_url', 'tags', 'category_id', 'geo_scope_id'];
    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const field of allowed) {
      if (field in edits) {
        setParts.push(`${field} = $${idx++}`);
        values.push((edits as any)[field]);
      }
    }

    if (setParts.length === 0) {
      return this.getById(id);
    }

    setParts.push(`is_modified = true`);
    setParts.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE media_unit_articles SET ${setParts.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * إرجاع حقل لقيمته الأصلية (NULL → يرث من raw_data)
   */
  static async resetField(id: number, field: EditableField): Promise<MediaUnitArticle | null> {
    const allowed: EditableField[] = ['title', 'summary', 'content', 'image_url', 'tags', 'category_id', 'geo_scope_id'];
    if (!allowed.includes(field)) {
      throw new Error(`حقل غير مسموح بإرجاعه: ${field}`);
    }
    const defaultVal = field === 'tags' ? `'{}'` : 'NULL';
    const result = await query(
      `UPDATE media_unit_articles
       SET ${field} = ${defaultVal}, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * تحديث حالة النسخة
   */
  static async updateStatus(id: number, status: string): Promise<void> {
    await query(
      `UPDATE media_unit_articles SET status = $1, updated_at = NOW() WHERE id = $2`,
      [status, id]
    );
  }

  /**
   * تحديث التصنيف والفلو للنسخة (تصنيف AI مستقل لكل وحدة)
   */
  static async updateClassification(
    id: number,
    categoryId: number | null,
    flow: 'automated' | 'editorial' | null,
    aiConfidence?: number | null
  ): Promise<void> {
    await query(
      `UPDATE media_unit_articles
       SET category_id = $1, flow = $2, ai_confidence = COALESCE($3, ai_confidence),
           ai_processed = true, updated_at = NOW()
       WHERE id = $4`,
      [categoryId, flow, aiConfidence ?? null, id]
    );
  }

  /**
   * جلب نسخة بالـ id
   */
  static async getById(id: number): Promise<MediaUnitArticle | null> {
    const result = await query(`SELECT * FROM media_unit_articles WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  /**
   * جلب النسخة مدموجة مع الأصل (resolved) من الـ view
   */
  static async getResolved(rawDataId: number, mediaUnitId: number): Promise<any | null> {
    const result = await query(
      `SELECT * FROM v_media_unit_articles WHERE raw_data_id = $1 AND media_unit_id = $2`,
      [rawDataId, mediaUnitId]
    );
    return result.rows[0] || null;
  }

  /**
   * جلب كل نسخ وحدة إعلامية (resolved) حسب الحالة
   */
  static async getByMediaUnit(mediaUnitId: number, status?: string): Promise<any[]> {
    if (status) {
      const result = await query(
        `SELECT * FROM v_media_unit_articles WHERE media_unit_id = $1 AND status = $2 ORDER BY created_at DESC`,
        [mediaUnitId, status]
      );
      return result.rows;
    }
    const result = await query(
      `SELECT * FROM v_media_unit_articles WHERE media_unit_id = $1 ORDER BY created_at DESC`,
      [mediaUnitId]
    );
    return result.rows;
  }

  /**
   * جلب كل النسخ المرتبطة بخبر أصلي واحد (كل الوحدات اللي عندها هالخبر)
   */
  static async getByRawData(rawDataId: number): Promise<MediaUnitArticle[]> {
    const result = await query(
      `SELECT * FROM media_unit_articles WHERE raw_data_id = $1 ORDER BY media_unit_id`,
      [rawDataId]
    );
    return result.rows;
  }
}

export default MediaUnitArticleService;
