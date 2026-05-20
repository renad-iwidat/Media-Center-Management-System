/**
 * Auto-Publish Service
 * خدمة النشر التلقائي على المواقع الخارجية
 *
 * كل وحدة إعلامية (media_unit) ممكن يكون عندها هدف نشر واحد أو أكثر
 * (auto_publish_targets) — مثلاً: وحدة "هنا غزة" تنشر على موقع hgaza.nn.ps
 *
 * الفلو:
 * 1. الخبر ينشر محلياً (published_items) لوحدة إعلامية معينة
 * 2. هالسيرفس يفحص إذا الوحدة عندها أهداف نشر خارجية مفعّلة
 * 3. ينشر الخبر على كل هدف مفعّل لم يُنشر عليه بعد
 */

import { query } from '../../config/database';
import { SystemSettingsService } from '../database/system-settings.service';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface AutoPublishTarget {
  id: number;
  media_unit_id: number;
  name: string;
  api_url: string;
  api_token: string;
  default_category_id: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
  media_unit_name?: string;
}

export interface AutoPublishArticle {
  id: number;              // raw_data_id
  title: string;
  content: string;
  image_url: string | null;
  tags: string[];
  category_id: number | null;
  category_slug: string | null;
  media_unit_id: number;
}

export interface AutoPublishResult {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  details: {
    articleId: number;
    targetId: number;
    targetName: string;
    title: string;
    status: 'success' | 'failed' | 'skipped';
    responseCode?: number;
    error?: string;
  }[];
}

// ── Category Mapping ────────────────────────────────────────────────────────
// ربط تصنيفات النظام المحلي بتصنيفات موقع هنا غزة
//
// المحلي:                          هنا غزة:
// 1  محلي (editorial)         →    1  الأخبار المحلية
// 2  دولي (editorial)         →    4  الأخبار الدولية
// 3  اقتصاد (automated)       →    6  الاقتصاد
// 4  رياضة (automated)        →    7  الرياضة
// 5  صحة (automated)          →    2  الصحة
// 6  علوم وتكنولوجيا (automated) → 8  تكنولوجيا
// 7  فن و ثقافة (automated)   →    9  الثقافة
// 9  بيئة (automated)         →    10 اجتماعي (أقرب تصنيف)
// 10 غذاء (automated)         →    13 أخبار عامة
// 11 سياسي (editorial)        →    5  السياسة
//
const LOCAL_TO_HGAZA_CATEGORY: Record<number, number> = {
  1:  1,   // محلي → الأخبار المحلية
  2:  4,   // دولي → الأخبار الدولية
  3:  6,   // اقتصاد → الاقتصاد
  4:  7,   // رياضة → الرياضة
  5:  2,   // صحة → الصحة
  6:  8,   // علوم وتكنولوجيا → تكنولوجيا
  7:  9,   // فن و ثقافة → الثقافة
  9:  10,  // بيئة → اجتماعي
  10: 13,  // غذاء → أخبار عامة
  11: 5,   // سياسي → السياسة
};

// ── Service Class ───────────────────────────────────────────────────────────

class AutoPublishService {

  // ════════════════════════════════════════════════════════════════════════════
  // إدارة الأهداف (Targets CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * جلب جميع أهداف النشر
   */
  async getAllTargets(): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       ORDER BY apt.media_unit_id, apt.name`
    );
    return result.rows;
  }

  /**
   * جلب أهداف النشر لوحدة إعلامية معينة
   */
  async getTargetsByMediaUnit(mediaUnitId: number): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.media_unit_id = $1
       ORDER BY apt.name`,
      [mediaUnitId]
    );
    return result.rows;
  }

  /**
   * جلب هدف واحد بالـ ID
   */
  async getTargetById(targetId: number): Promise<AutoPublishTarget | null> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.id = $1`,
      [targetId]
    );
    return result.rows[0] || null;
  }

  /**
   * إنشاء هدف نشر جديد
   */
  async createTarget(data: {
    media_unit_id: number;
    name: string;
    api_url: string;
    api_token: string;
    default_category_id?: number;
    is_enabled?: boolean;
  }): Promise<AutoPublishTarget> {
    const result = await query(
      `INSERT INTO auto_publish_targets (media_unit_id, name, api_url, api_token, default_category_id, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.media_unit_id,
        data.name,
        data.api_url,
        data.api_token,
        data.default_category_id || 1,
        data.is_enabled ?? false,
      ]
    );
    return result.rows[0];
  }

  /**
   * تحديث هدف نشر
   */
  async updateTarget(targetId: number, data: Partial<{
    name: string;
    api_url: string;
    api_token: string;
    default_category_id: number;
    is_enabled: boolean;
  }>): Promise<AutoPublishTarget | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.api_url !== undefined) {
      fields.push(`api_url = $${paramIndex++}`);
      values.push(data.api_url);
    }
    if (data.api_token !== undefined) {
      fields.push(`api_token = $${paramIndex++}`);
      values.push(data.api_token);
    }
    if (data.default_category_id !== undefined) {
      fields.push(`default_category_id = $${paramIndex++}`);
      values.push(data.default_category_id);
    }
    if (data.is_enabled !== undefined) {
      fields.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(targetId);

    const result = await query(
      `UPDATE auto_publish_targets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * حذف هدف نشر
   */
  async deleteTarget(targetId: number): Promise<boolean> {
    // حذف السجلات المرتبطة أولاً
    await query('DELETE FROM auto_publish_log WHERE target_id = $1', [targetId]);
    const result = await query('DELETE FROM auto_publish_targets WHERE id = $1', [targetId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * تفعيل/إيقاف هدف نشر
   */
  async toggleTarget(targetId: number, enabled: boolean): Promise<AutoPublishTarget | null> {
    return this.updateTarget(targetId, { is_enabled: enabled });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // النشر التلقائي
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * جلب الأخبار المنشورة محلياً لوحدة إعلامية معينة
   * التي لم تُنشر بعد على هدف معين
   * 
   * ⚠️ قواعد النشر التلقائي:
   * - الأخبار الأوتوماتيكية (flow = automated) → تنشر تلقائياً
   * - الأخبار التحريرية (محلي، سياسي، دولي) → المحرر ينشرها يدوياً من استديو التحرير
   */
  async getUnpublishedForTarget(targetId: number, mediaUnitId: number, limit: number = 20): Promise<AutoPublishArticle[]> {
    const result = await query(
      `SELECT rd.id, rd.title, rd.content, rd.image_url, rd.tags, rd.category_id,
              c.slug as category_slug, pi.media_unit_id
       FROM published_items pi
       JOIN raw_data rd ON rd.id = pi.raw_data_id
       LEFT JOIN categories c ON c.id = rd.category_id
       WHERE pi.media_unit_id = $1
         AND pi.is_active = true
         AND c.flow = 'automated'
         AND rd.id NOT IN (
           SELECT raw_data_id FROM auto_publish_log 
           WHERE target_id = $2 AND status = 'success'
         )
       ORDER BY pi.published_at DESC
       LIMIT $3`,
      [mediaUnitId, targetId, limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: row.media_unit_id,
    }));
  }

  /**
   * نشر خبر واحد على هدف معين
   */
  async publishOneToTarget(
    article: AutoPublishArticle,
    target: AutoPublishTarget
  ): Promise<{ success: boolean; responseCode?: number; error?: string; responseBody?: string; externalUrl?: string; externalId?: number }> {
    try {
      // تحديد التصنيف الخارجي
      const externalCategoryId = article.category_id
        ? (LOCAL_TO_HGAZA_CATEGORY[article.category_id] || target.default_category_id)
        : target.default_category_id;

      // تجهيز الـ tags و keywords
      const tagsString = Array.isArray(article.tags) ? article.tags.join(',') : '';

      // بناء multipart/form-data
      const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
      let body = '';

      const addField = (name: string, value: string) => {
        body += `--${boundary}\r\n`;
        body += `Content-Disposition: form-data; name="${name}"\r\n\r\n`;
        body += `${value}\r\n`;
      };

      addField('title', article.title);
      addField('content', article.content);
      addField('category_id', String(externalCategoryId));
      addField('tags', tagsString);
      addField('keywords', tagsString);

      // إضافة الصورة كـ URL إذا موجودة
      if (article.image_url) {
        addField('image_url', article.image_url);
      }

      body += `--${boundary}--\r\n`;

      // إرسال الطلب
      const response = await fetch(target.api_url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${target.api_token}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      const responseBody = await response.text();

      if (response.ok) {
        // استخراج ID الخبر المنشور ورابطه من الـ response
        let externalId: number | undefined;
        let externalUrl: string | undefined;
        try {
          const parsed = JSON.parse(responseBody);
          externalId = parsed?.data?.id;
          // أولاً: استخدم الـ url المرجع مباشرة من الـ API
          if (parsed?.data?.url) {
            externalUrl = parsed.data.url;
          }
          // fallback: بناء الرابط من الـ ID
          if (!externalUrl && externalId) {
            const baseUrl = target.api_url.replace('/api/v1/automation/news', '');
            externalUrl = `${baseUrl}/news/${externalId}`;
          }
        } catch { /* تجاهل */ }

        await this.logPublish(target.id, article.id, 'success', response.status, responseBody, undefined, externalUrl, externalId);
        return { success: true, responseCode: response.status, responseBody, externalUrl, externalId };
      } else {
        await this.logPublish(target.id, article.id, 'failed', response.status, responseBody, `HTTP ${response.status}`);
        return { success: false, responseCode: response.status, error: `HTTP ${response.status}: ${responseBody}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await this.logPublish(target.id, article.id, 'failed', undefined, undefined, errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * تسجيل عملية النشر في الـ log
   */
  private async logPublish(
    targetId: number,
    rawDataId: number,
    status: 'success' | 'failed' | 'pending',
    responseCode?: number,
    responseBody?: string,
    errorMessage?: string,
    externalUrl?: string,
    externalId?: number
  ): Promise<void> {
    try {
      const existing = await query(
        'SELECT id, retry_count FROM auto_publish_log WHERE target_id = $1 AND raw_data_id = $2 ORDER BY created_at DESC LIMIT 1',
        [targetId, rawDataId]
      );

      if (existing.rows.length > 0 && status === 'failed') {
        await query(
          `UPDATE auto_publish_log 
           SET status = $1, response_code = $2, response_body = $3, 
               error_message = $4, retry_count = retry_count + 1, updated_at = NOW()
           WHERE id = $5`,
          [status, responseCode || null, responseBody || null, errorMessage || null, existing.rows[0].id]
        );
      } else {
        await query(
          `INSERT INTO auto_publish_log (target_id, raw_data_id, status, response_code, response_body, error_message, external_url, external_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [targetId, rawDataId, status, responseCode || null, responseBody || null, errorMessage || null, externalUrl || null, externalId || null]
        );
      }
    } catch (err) {
      console.error('❌ خطأ في تسجيل عملية النشر:', err);
    }
  }

  /**
   * نشر جميع الأخبار المعتمدة على جميع الأهداف المفعّلة
   * هذه الدالة تُستدعى من الـ scheduler
   */
  async publishAll(): Promise<AutoPublishResult> {
    // فحص الـ master switch
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) {
      console.log('⏸️  النشر التلقائي متوقف (auto_publish_enabled = false)');
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    // جلب جميع الأهداف المفعّلة
    const targetsResult = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.is_enabled = true`
    );
    const enabledTargets: AutoPublishTarget[] = targetsResult.rows;

    if (enabledTargets.length === 0) {
      console.log('⚠️  لا يوجد أهداف نشر مفعّلة');
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    const result: AutoPublishResult = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    // لكل هدف مفعّل — جلب الأخبار غير المنشورة ونشرها
    for (const target of enabledTargets) {
      console.log(`\n📤 النشر على: ${target.name} (${target.media_unit_name})`);

      const articles = await this.getUnpublishedForTarget(target.id, target.media_unit_id, 20);

      if (articles.length === 0) {
        console.log(`   ✅ لا يوجد أخبار جديدة للنشر`);
        continue;
      }

      console.log(`   📰 ${articles.length} خبر جاهز للنشر`);

      for (const article of articles) {
        result.total++;

        // تخطي المقالات بدون عنوان أو محتوى
        if (!article.title || !article.content) {
          result.skipped++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title || '(بدون عنوان)',
            status: 'skipped',
            error: 'عنوان أو محتوى فارغ',
          });
          continue;
        }

        const publishResult = await this.publishOneToTarget(article, target);

        if (publishResult.success) {
          result.success++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title,
            status: 'success',
            responseCode: publishResult.responseCode,
          });
          console.log(`   ✅ ${article.title.substring(0, 50)}...`);
        } else {
          result.failed++;
          result.details.push({
            articleId: article.id,
            targetId: target.id,
            targetName: target.name,
            title: article.title,
            status: 'failed',
            responseCode: publishResult.responseCode,
            error: publishResult.error,
          });
          console.log(`   ❌ ${article.title.substring(0, 50)}... — ${publishResult.error}`);
        }

        // تأخير بين كل طلب (500ms) لتجنب rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (result.total > 0) {
      console.log(`\n📊 نتيجة النشر التلقائي: ✅ ${result.success} | ❌ ${result.failed} | ⏭️ ${result.skipped}`);
    }

    return result;
  }

  /**
   * إعادة محاولة نشر المقالات الفاشلة (حد أقصى 3 محاولات)
   */
  async retryFailed(): Promise<AutoPublishResult> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) {
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    // جلب المقالات الفاشلة مع أهدافها
    const failedResult = await query(
      `SELECT apl.target_id, apl.raw_data_id,
              rd.title, rd.content, rd.image_url, rd.tags, rd.category_id,
              c.slug as category_slug,
              apt.media_unit_id, apt.name as target_name, apt.api_url, apt.api_token, apt.default_category_id
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       JOIN raw_data rd ON rd.id = apl.raw_data_id
       LEFT JOIN categories c ON c.id = rd.category_id
       WHERE apl.status = 'failed' 
         AND apl.retry_count < 3
         AND apt.is_enabled = true
       ORDER BY apl.updated_at ASC
       LIMIT 10`
    );

    if (failedResult.rows.length === 0) {
      return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
    }

    console.log(`🔄 إعادة محاولة نشر ${failedResult.rows.length} خبر فاشل...`);

    const result: AutoPublishResult = {
      total: failedResult.rows.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    for (const row of failedResult.rows) {
      const article: AutoPublishArticle = {
        id: row.raw_data_id,
        title: row.title,
        content: row.content,
        image_url: row.image_url || null,
        tags: row.tags || [],
        category_id: row.category_id,
        category_slug: row.category_slug,
        media_unit_id: row.media_unit_id,
      };

      const target: AutoPublishTarget = {
        id: row.target_id,
        media_unit_id: row.media_unit_id,
        name: row.target_name,
        api_url: row.api_url,
        api_token: row.api_token,
        default_category_id: row.default_category_id,
        is_enabled: true,
        created_at: '',
        updated_at: '',
      };

      const publishResult = await this.publishOneToTarget(article, target);

      if (publishResult.success) {
        result.success++;
        result.details.push({
          articleId: article.id,
          targetId: target.id,
          targetName: target.name,
          title: article.title,
          status: 'success',
          responseCode: publishResult.responseCode,
        });
      } else {
        result.failed++;
        result.details.push({
          articleId: article.id,
          targetId: target.id,
          targetName: target.name,
          title: article.title,
          status: 'failed',
          error: publishResult.error,
        });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return result;
  }

  /**
   * جلب سجل النشر التلقائي
   */
  async getLog(options: { targetId?: number; limit?: number } = {}): Promise<any[]> {
    const { targetId, limit = 50 } = options;

    let sql = `
      SELECT apl.*, apl.external_url, apl.external_id,
             rd.title as article_title, apt.name as target_name, mu.name as media_unit_name
      FROM auto_publish_log apl
      JOIN auto_publish_targets apt ON apt.id = apl.target_id
      JOIN media_units mu ON mu.id = apt.media_unit_id
      LEFT JOIN raw_data rd ON rd.id = apl.raw_data_id
    `;
    const params: any[] = [];

    if (targetId) {
      sql += ` WHERE apl.target_id = $1`;
      params.push(targetId);
    }

    sql += ` ORDER BY apl.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * نشر خبر واحد يدوياً (للمحرر) على هدف معين
   * يُستخدم للأخبار التحريرية — المحرر يكبس زر وينشر
   */
  async publishOneManually(rawDataId: number, targetId: number): Promise<{
    success: boolean;
    responseCode?: number;
    error?: string;
    externalUrl?: string;
    externalId?: number;
  }> {
    // جلب الهدف
    const target = await this.getTargetById(targetId);
    if (!target) {
      return { success: false, error: 'هدف النشر غير موجود' };
    }
    if (!target.is_enabled) {
      return { success: false, error: 'هدف النشر متوقف' };
    }

    // جلب بيانات الخبر
    const articleResult = await query(
      `SELECT rd.id, rd.title, rd.content, rd.image_url, rd.tags, rd.category_id,
              c.slug as category_slug
       FROM raw_data rd
       LEFT JOIN categories c ON c.id = rd.category_id
       WHERE rd.id = $1`,
      [rawDataId]
    );

    if (articleResult.rows.length === 0) {
      return { success: false, error: 'الخبر غير موجود' };
    }

    const row = articleResult.rows[0];
    const article: AutoPublishArticle = {
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: target.media_unit_id,
    };

    // فحص إذا تم نشره مسبقاً
    const alreadyPublished = await query(
      `SELECT id FROM auto_publish_log WHERE target_id = $1 AND raw_data_id = $2 AND status = 'success'`,
      [targetId, rawDataId]
    );
    if (alreadyPublished.rows.length > 0) {
      return { success: false, error: 'الخبر منشور مسبقاً على هذا الهدف' };
    }

    return this.publishOneToTarget(article, target);
  }

  /**
   * جلب رابط النشر الخارجي لخبر معين
   * يُستخدم في الأرشيف لعرض رابط الخبر على الموقع الخارجي
   */
  async getExternalLinks(rawDataId: number): Promise<{ targetName: string; externalUrl: string; publishedAt: string }[]> {
    const result = await query(
      `SELECT apt.name as target_name, apl.external_url, apl.published_at
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = $1 AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataId]
    );
    return result.rows.map((row: any) => ({
      targetName: row.target_name,
      externalUrl: row.external_url,
      publishedAt: row.published_at,
    }));
  }

  /**
   * جلب روابط النشر الخارجي لمجموعة أخبار (batch)
   * يُستخدم في الأرشيف لعرض الروابط بجانب كل خبر
   */
  async getExternalLinksForArticles(rawDataIds: number[]): Promise<Record<number, { targetName: string; externalUrl: string }[]>> {
    if (rawDataIds.length === 0) return {};

    const result = await query(
      `SELECT apl.raw_data_id, apt.name as target_name, apl.external_url
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = ANY($1) AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataIds]
    );

    const map: Record<number, { targetName: string; externalUrl: string }[]> = {};
    for (const row of result.rows) {
      if (!map[row.raw_data_id]) map[row.raw_data_id] = [];
      map[row.raw_data_id].push({ targetName: row.target_name, externalUrl: row.external_url });
    }
    return map;
  }

  /**
   * إحصائيات النشر التلقائي
   */
  async getStats(): Promise<{
    masterEnabled: boolean;
    targets: {
      id: number;
      name: string;
      mediaUnitName: string;
      isEnabled: boolean;
      totalPublished: number;
      totalFailed: number;
      publishedToday: number;
      lastPublishedAt: string | null;
    }[];
  }> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);

    const result = await query(
      `SELECT 
         apt.id, apt.name, apt.is_enabled, mu.name as media_unit_name,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success') as total_published,
         COUNT(apl.id) FILTER (WHERE apl.status = 'failed') as total_failed,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success' AND apl.published_at > NOW() - INTERVAL '24 hours') as published_today,
         MAX(CASE WHEN apl.status = 'success' THEN apl.published_at END) as last_published_at
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       LEFT JOIN auto_publish_log apl ON apl.target_id = apt.id
       GROUP BY apt.id, apt.name, apt.is_enabled, mu.name
       ORDER BY apt.media_unit_id, apt.name`
    );

    return {
      masterEnabled,
      targets: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        mediaUnitName: row.media_unit_name,
        isEnabled: row.is_enabled,
        totalPublished: parseInt(row.total_published) || 0,
        totalFailed: parseInt(row.total_failed) || 0,
        publishedToday: parseInt(row.published_today) || 0,
        lastPublishedAt: row.last_published_at || null,
      })),
    };
  }
}

// تصدير instance واحد
export const autoPublishService = new AutoPublishService();
