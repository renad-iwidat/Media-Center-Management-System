/**
 * Publishing Service (v2)
 * الخدمة الرئيسية لنظام النشر المتعدد المنصات
 * 
 * التحسينات عن v1:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Race Condition Prevention:
 *    - pg_advisory_xact_lock لمنع طلبين متزامنين
 *    - حالة "publishing" حقيقية في DB (يمنع double-click)
 * 
 * 2. Retry Strategy:
 *    - retry_count + exponential backoff
 *    - max 3 محاولات — بعدها dead-letter
 *    - endpoint مخصص لإعادة المحاولة
 * 
 * 3. Source of Truth:
 *    - publishing_status = الحالة الحالية (آخر state)
 *    - publishing_logs = history فقط (audit trail)
 * 
 * 4. Archive = Business Rule:
 *    - الأرشفة لا تحصل تلقائياً
 *    - فقط عبر endpoint مخصص أو قاعدة business محددة
 * 
 * 5. Platform Constraints:
 *    - فحص قيود المنصة قبل محاولة النشر
 *    - Instagram: يتطلب صورة + business account
 * ─────────────────────────────────────────────────────────────────────
 */

import { query, getClient } from '../../config/database';
import { getProvider, isPlatformSupported, getSupportedPlatforms } from './providers';
import {
  PublishingPlatform,
  ArticlePublishStatus,
  PublishStatusValue,
  PublishLogStatus,
  PlatformConfig,
  PublishingStatus,
  PublishingLog,
  PublishResult,
  ArticleForPublishing,
  DEFAULT_RETRY_CONFIG,
  PLATFORM_CONSTRAINTS,
} from './types';

class PublishingService {

  // ════════════════════════════════════════════════════════════════════════════
  // النشر الرئيسي — مع حماية من Race Conditions
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * نشر مقال على منصة معينة
   * 
   * يستخدم PostgreSQL Advisory Lock لمنع race conditions:
   * - لو طلبين وصلوا بنفس اللحظة، واحد فقط يمر
   * - الثاني ينتظر أو يفشل
   */
  async publishToPlatform(
    articleId: number,
    platformConfigId: number,
    customContent?: string
  ): Promise<{ success: boolean; message: string; data?: PublishResult }> {
    // 1. جلب إعدادات المنصة
    const config = await this.getPlatformConfig(platformConfigId);
    if (!config) {
      return { success: false, message: 'إعدادات المنصة غير موجودة' };
    }
    if (!config.is_enabled) {
      return { success: false, message: 'المنصة متوقفة — فعّلها أولاً' };
    }

    // 2. فحص قيود المنصة (Platform Constraints)
    const constraintError = await this.checkPlatformConstraints(articleId, config);
    if (constraintError) {
      return { success: false, message: constraintError };
    }

    // 3. استخدام Transaction + Advisory Lock لمنع race conditions
    const client = await getClient();
    try {
      await client.query('BEGIN');

      // Advisory lock بناءً على article_id + platform_config_id
      // هذا يمنع طلبين متزامنين لنفس المقال على نفس المنصة
      const lockKey = articleId * 10000 + platformConfigId;
      await client.query('SELECT pg_advisory_xact_lock($1)', [lockKey]);

      // 4. التحقق من التكرار (داخل الـ transaction)
      const existingStatus = await client.query(
        `SELECT id, status FROM publishing_status 
         WHERE article_id = $1 AND platform_config_id = $2`,
        [articleId, platformConfigId]
      );

      if (existingStatus.rows.length > 0) {
        const current = existingStatus.rows[0];
        if (current.status === 'success') {
          await client.query('COMMIT');
          return {
            success: false,
            message: `المقال منشور مسبقاً على "${config.name}" (${config.platform})`,
          };
        }
        if (current.status === 'publishing') {
          await client.query('COMMIT');
          return {
            success: false,
            message: `المقال قيد النشر حالياً على "${config.name}" — انتظر`,
          };
        }
        // status === 'failed' → نسمح بإعادة المحاولة
      }

      // 5. تسجيل حالة "publishing" (lock state)
      await client.query(
        `INSERT INTO publishing_status (article_id, platform, platform_config_id, status)
         VALUES ($1, $2, $3, 'publishing')
         ON CONFLICT (article_id, platform_config_id) 
         DO UPDATE SET status = 'publishing', updated_at = NOW(), error_message = NULL`,
        [articleId, config.platform, config.id]
      );

      // 6. تحديث حالة المقال إلى "publishing"
      await client.query(
        `UPDATE raw_data SET publish_status = 'publishing' WHERE id = $1 AND publish_status != 'archived'`,
        [articleId]
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // 7. جلب بيانات المقال
    const article = await this.getArticleForPublishing(articleId);
    if (!article) {
      await this.updateStatusToFailed(articleId, platformConfigId, 'المقال غير موجود');
      return { success: false, message: 'المقال غير موجود' };
    }

    // إذا في محتوى مخصص (من SocialPostCreator) — نستخدمه بدل المحتوى الأصلي
    if (customContent) {
      article.content = customContent;
      article.isCustomContent = true;
    }

    // 8. الحصول على المزود (provider)
    const provider = getProvider(config.platform as PublishingPlatform);
    if (!provider) {
      await this.updateStatusToFailed(articleId, platformConfigId, 'المنصة غير مدعومة');
      return { success: false, message: `المنصة "${config.platform}" غير مدعومة` };
    }

    // 9. تسجيل المحاولة في logs
    const retryCount = await this.getRetryCount(articleId, platformConfigId);
    const logId = await this.createPublishLog(articleId, config, 'processing', retryCount);

    // 10. تنفيذ النشر
    const result = await provider.publish(article, config);

    // 11. تحديث بناءً على النتيجة
    if (result.success) {
      await this.updateStatusToSuccess(articleId, platformConfigId, result);
      await this.completePublishLog(logId, 'success', result);
      await this.updateArticleLifecycle(articleId, config.platform as PublishingPlatform);

      // 12. تخزين المحتوى المنشور — تحديث published_items بآخر نسخة منشورة
      if (customContent) {
        try {
          await query(
            `UPDATE published_items 
             SET content = $1
             WHERE raw_data_id = $2 AND is_active = true`,
            [customContent, articleId]
          );
          console.log(`💾 تم تحديث published_items بالمحتوى المنشور للمقال #${articleId}`);
        } catch (updateErr) {
          // لا نوقف العملية — النشر نجح
          console.warn(`⚠️ فشل تحديث published_items بالمحتوى المنشور:`, updateErr);
        }
      }

      return {
        success: true,
        message: `تم النشر بنجاح على "${config.name}"`,
        data: result,
      };
    } else {
      await this.updateStatusToFailed(articleId, platformConfigId, result.error || 'Unknown error', retryCount + 1);
      await this.completePublishLog(logId, 'failed', result);

      return {
        success: false,
        message: `فشل النشر على "${config.name}": ${result.error}`,
        data: result,
      };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Retry Strategy — Exponential Backoff
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * إعادة محاولة نشر المقالات الفاشلة
   * - حد أقصى 3 محاولات (configurable)
   * - exponential backoff: 2s → 4s → 8s
   * - بعد 3 محاولات → dead-letter (يبقى failed)
   */
  async retryFailed(options: { limit?: number } = {}): Promise<{
    total: number;
    retried: number;
    dead_letter: number;
    results: Array<{ article_id: number; platform: string; success: boolean; error?: string }>;
  }> {
    const { limit = 10 } = options;
    const { max_retries, base_delay_ms, max_delay_ms } = DEFAULT_RETRY_CONFIG;

    // جلب المقالات الفاشلة القابلة لإعادة المحاولة
    const failedResult = await query(
      `SELECT ps.article_id, ps.platform_config_id, ps.retry_count, pc.name as platform_name
       FROM publishing_status ps
       JOIN platform_configs pc ON pc.id = ps.platform_config_id
       WHERE ps.status = 'failed' 
         AND ps.retry_count < $1
         AND pc.is_enabled = true
       ORDER BY ps.updated_at ASC
       LIMIT $2`,
      [max_retries, limit]
    );

    const results: Array<{ article_id: number; platform: string; success: boolean; error?: string }> = [];
    let retried = 0;
    let deadLetter = 0;

    for (const row of failedResult.rows) {
      // Exponential backoff delay
      const delay = Math.min(base_delay_ms * Math.pow(2, row.retry_count), max_delay_ms);
      await new Promise(resolve => setTimeout(resolve, delay));

      const publishResult = await this.publishToPlatform(row.article_id, row.platform_config_id);

      if (publishResult.success) {
        retried++;
        results.push({ article_id: row.article_id, platform: row.platform_name, success: true });
      } else {
        // تحقق إذا وصل الحد الأقصى
        const newCount = row.retry_count + 1;
        if (newCount >= max_retries) {
          deadLetter++;
          results.push({
            article_id: row.article_id,
            platform: row.platform_name,
            success: false,
            error: `Dead letter — تجاوز ${max_retries} محاولات`,
          });
        } else {
          results.push({
            article_id: row.article_id,
            platform: row.platform_name,
            success: false,
            error: publishResult.message,
          });
        }
      }
    }

    return {
      total: failedResult.rows.length,
      retried,
      dead_letter: deadLetter,
      results,
    };
  }

  /**
   * جلب المقالات في dead-letter (فشلت أكثر من max_retries)
   */
  async getDeadLetterItems(): Promise<PublishingStatus[]> {
    const result = await query(
      `SELECT ps.*, pc.name as platform_name, pc.platform
       FROM publishing_status ps
       JOIN platform_configs pc ON pc.id = ps.platform_config_id
       WHERE ps.status = 'failed' AND ps.retry_count >= $1
       ORDER BY ps.updated_at DESC`,
      [DEFAULT_RETRY_CONFIG.max_retries]
    );
    return result.rows;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Platform Constraints Check
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * فحص قيود المنصة قبل محاولة النشر
   * يرجع null إذا كل شيء OK، أو رسالة خطأ
   */
  private async checkPlatformConstraints(
    articleId: number,
    config: PlatformConfig
  ): Promise<string | null> {
    const constraints = PLATFORM_CONSTRAINTS[config.platform as PublishingPlatform];
    if (!constraints) return null;

    // فحص الصورة (Instagram)
    if (constraints.requires_image) {
      // نتحقق من الصورة في النسخة المعدّلة (published_items) أو الأصلية (raw_data)
      const result = await query(
        `SELECT COALESCE(pi.image_url, rd.image_url) AS image_url
         FROM raw_data rd
         LEFT JOIN LATERAL (
           SELECT image_url FROM published_items
           WHERE raw_data_id = rd.id AND is_active = true
           ORDER BY published_at DESC LIMIT 1
         ) pi ON TRUE
         WHERE rd.id = $1`,
        [articleId]
      );
      const imageUrl = result.rows[0]?.image_url;
      if (!imageUrl || !imageUrl.trim()) {
        return `المنصة "${config.name}" (${config.platform}) تتطلب صورة — المقال بدون صورة`;
      }
    }

    // فحص Rate Limit — فيسبوك: بوست واحد كل 15 دقيقة
    if (config.platform === 'facebook') {
      const cooldownMinutes = 15;
      const lastPublish = await query(
        `SELECT published_at FROM publishing_status 
         WHERE platform_config_id = $1 AND status = 'success'
         ORDER BY published_at DESC LIMIT 1`,
        [config.id]
      );

      if (lastPublish.rows.length > 0 && lastPublish.rows[0].published_at) {
        const lastTime = new Date(lastPublish.rows[0].published_at).getTime();
        const now = Date.now();
        const elapsedMs = now - lastTime;
        const cooldownMs = cooldownMinutes * 60 * 1000;

        if (elapsedMs < cooldownMs) {
          const remainingMs = cooldownMs - elapsedMs;
          const remainingMin = Math.floor(remainingMs / 60000);
          const remainingSec = Math.ceil((remainingMs % 60000) / 1000);
          return `⏳ يجب الانتظار ${remainingMin} دقيقة و ${remainingSec} ثانية قبل النشر التالي على فيسبوك (حماية من الحظر)`;
        }
      }
    }

    return null;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Duplicate Prevention & Status Queries
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * التحقق إذا المقال منشور مسبقاً أو قيد النشر
   */
  async isAlreadyPublished(articleId: number, platformConfigId: number): Promise<boolean> {
    const result = await query(
      `SELECT id FROM publishing_status 
       WHERE article_id = $1 AND platform_config_id = $2 AND status IN ('success', 'publishing')`,
      [articleId, platformConfigId]
    );
    return result.rows.length > 0;
  }

  /**
   * جلب وقت آخر نشر ناجح على منصة معينة
   */
  async getLastPublishTime(platformConfigId: number): Promise<string | null> {
    const result = await query(
      `SELECT published_at FROM publishing_status 
       WHERE platform_config_id = $1 AND status = 'success'
       ORDER BY published_at DESC LIMIT 1`,
      [platformConfigId]
    );
    return result.rows[0]?.published_at || null;
  }

  /**
   * جلب حالة النشر لمقال على جميع المنصات
   * هذا هو الـ SOURCE OF TRUTH
   */
  async getArticlePublishingStatus(articleId: number): Promise<PublishingStatus[]> {
    const result = await query(
      `SELECT ps.*, pc.name as platform_name, pc.platform
       FROM publishing_status ps
       JOIN platform_configs pc ON pc.id = ps.platform_config_id
       WHERE ps.article_id = $1
       ORDER BY ps.created_at DESC`,
      [articleId]
    );
    return result.rows;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Article Status Lifecycle
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * تحديث حالة المقال بناءً على النشر الناجح
   * ⚠️ الأرشفة لا تحصل تلقائياً — فقط عبر archiveArticle()
   */
  private async updateArticleLifecycle(
    articleId: number,
    platform: PublishingPlatform
  ): Promise<void> {
    let newStatus: ArticlePublishStatus;

    if (platform === 'external_website') {
      newStatus = 'published_external';
    } else {
      newStatus = 'published_social';
    }

    // لا نرجع للخلف ولا نؤرشف تلقائياً
    await query(
      `UPDATE raw_data SET publish_status = $1 
       WHERE id = $2 AND publish_status NOT IN ('archived', 'published_external', 'published_social')`,
      [newStatus, articleId]
    );
  }

  /**
   * تغيير حالة المقال يدوياً
   */
  async setArticleStatus(articleId: number, status: ArticlePublishStatus): Promise<boolean> {
    const result = await query(
      `UPDATE raw_data SET publish_status = $1 WHERE id = $2 RETURNING id`,
      [status, articleId]
    );
    return result.rows.length > 0;
  }

  /**
   * أرشفة مقال — قرار business rule يدوي
   * يُستدعى فقط عندما المحرر يقرر أرشفة المقال
   */
  async archiveArticle(articleId: number): Promise<boolean> {
    // تحقق أنه منشور فعلاً على منصة واحدة على الأقل
    // نفحص publishing_status (سوشال ميديا) + auto_publish_log (مواقع خارجية)
    const published = await query(
      `SELECT (
        (SELECT COUNT(*) FROM publishing_status WHERE article_id = $1 AND status = 'success') +
        (SELECT COUNT(*) FROM auto_publish_log WHERE raw_data_id = $1 AND status = 'success')
      ) as count`,
      [articleId]
    );

    if (parseInt(published.rows[0]?.count) === 0) {
      return false; // لا يمكن أرشفة مقال غير منشور
    }

    // تحديث حالة المقال في raw_data
    const statusUpdated = await this.setArticleStatus(articleId, 'archived');
    
    if (statusUpdated) {
      // إلغاء تفعيل المقال في published_items حتى لا يظهر في قسم النشر
      await query(
        `UPDATE published_items SET is_active = false WHERE raw_data_id = $1`,
        [articleId]
      );
    }
    
    return statusUpdated;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Platform Configs CRUD
  // ════════════════════════════════════════════════════════════════════════════

  async getAllPlatformConfigs(mediaUnitId?: number): Promise<PlatformConfig[]> {
    let sql = `SELECT pc.*, mu.name as media_unit_name
               FROM platform_configs pc
               JOIN media_units mu ON mu.id = pc.media_unit_id`;
    const params: any[] = [];

    if (mediaUnitId) {
      sql += ` WHERE pc.media_unit_id = $1`;
      params.push(mediaUnitId);
    }

    sql += ` ORDER BY pc.platform, pc.name`;
    const result = await query(sql, params);
    return result.rows;
  }

  async getPlatformConfig(configId: number): Promise<PlatformConfig | null> {
    const result = await query(
      `SELECT * FROM platform_configs WHERE id = $1`,
      [configId]
    );
    return result.rows[0] || null;
  }

  async createPlatformConfig(data: {
    platform: PublishingPlatform;
    name: string;
    credentials: Record<string, string>;
    is_enabled?: boolean;
    media_unit_id: number;
  }): Promise<PlatformConfig> {
    if (!isPlatformSupported(data.platform)) {
      throw new Error(`المنصة "${data.platform}" غير مدعومة. المنصات المدعومة: ${getSupportedPlatforms().join(', ')}`);
    }

    const result = await query(
      `INSERT INTO platform_configs (platform, name, credentials, is_enabled, media_unit_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [data.platform, data.name, JSON.stringify(data.credentials), data.is_enabled ?? false, data.media_unit_id]
    );
    return result.rows[0];
  }

  async updatePlatformConfig(
    configId: number,
    data: Partial<{ name: string; credentials: Record<string, string>; is_enabled: boolean }>
  ): Promise<PlatformConfig | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) { fields.push(`name = $${idx++}`); values.push(data.name); }
    if (data.credentials !== undefined) { fields.push(`credentials = $${idx++}`); values.push(JSON.stringify(data.credentials)); }
    if (data.is_enabled !== undefined) { fields.push(`is_enabled = $${idx++}`); values.push(data.is_enabled); }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(configId);

    const result = await query(
      `UPDATE platform_configs SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async deletePlatformConfig(configId: number): Promise<boolean> {
    const result = await query(`DELETE FROM platform_configs WHERE id = $1`, [configId]);
    return (result.rowCount ?? 0) > 0;
  }

  async togglePlatformConfig(configId: number, enabled: boolean): Promise<PlatformConfig | null> {
    return this.updatePlatformConfig(configId, { is_enabled: enabled });
  }

  async validatePlatformCredentials(configId: number): Promise<boolean> {
    const config = await this.getPlatformConfig(configId);
    if (!config) return false;
    const provider = getProvider(config.platform as PublishingPlatform);
    if (!provider) return false;
    return provider.validateCredentials(config);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Publishing Logs (History / Audit Trail)
  // ════════════════════════════════════════════════════════════════════════════

  async getArticleLogs(articleId: number): Promise<PublishingLog[]> {
    const result = await query(
      `SELECT pl.*, pc.name as platform_name, pc.platform
       FROM publishing_logs pl
       JOIN platform_configs pc ON pc.id = pl.platform_config_id
       WHERE pl.article_id = $1
       ORDER BY pl.attempted_at DESC`,
      [articleId]
    );
    return result.rows;
  }

  async getAllLogs(options: {
    platform?: PublishingPlatform;
    status?: PublishLogStatus;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: PublishingLog[]; total: number }> {
    const { platform, status, limit = 50, offset = 0 } = options;
    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (platform) { conditions.push(`pl.platform = $${idx++}`); params.push(platform); }
    if (status) { conditions.push(`pl.status = $${idx++}`); params.push(status); }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) as total FROM publishing_logs pl ${whereClause}`, params
    );

    const dataParams = [...params, limit, offset];
    const result = await query(
      `SELECT pl.*, pc.name as platform_name, pc.platform as platform_type,
              rd.title as article_title
       FROM publishing_logs pl
       JOIN platform_configs pc ON pc.id = pl.platform_config_id
       LEFT JOIN raw_data rd ON rd.id = pl.article_id
       ${whereClause}
       ORDER BY pl.attempted_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      dataParams
    );

    return {
      logs: result.rows,
      total: parseInt(countResult.rows[0]?.total) || 0,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Archive (كل الأخبار المنشورة بنجاح — أوتوماتيكي + يدوي)
  // ════════════════════════════════════════════════════════════════════════════

  async getArchivedArticles(options: {
    platform?: PublishingPlatform;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ articles: any[]; total: number }> {
    const { platform, limit = 50, offset = 0 } = options;

    // الأرشيف = كل مقال منشور بنجاح (أوتوماتيكي أو يدوي)
    // المصادر:
    // 1. publish_status IN ('archived', 'published_external', 'published_social')
    // 2. أو موجود في auto_publish_log بحالة success
    // 3. أو موجود في publishing_status بحالة success

    let platformFilter = '';
    const params: any[] = [];
    let idx = 1;

    if (platform) {
      platformFilter = `AND (ps.platform = $${idx} OR ($${idx} = 'external_website' AND apl.id IS NOT NULL))`;
      params.push(platform);
      idx++;
    }

    const countResult = await query(
      `SELECT COUNT(DISTINCT rd.id) as total 
       FROM raw_data rd
       LEFT JOIN publishing_status ps ON ps.article_id = rd.id AND ps.status = 'success'
       LEFT JOIN auto_publish_log apl ON apl.raw_data_id = rd.id AND apl.status = 'success'
       WHERE (
         rd.publish_status IN ('archived', 'published_external', 'published_social')
         OR ps.id IS NOT NULL
         OR apl.id IS NOT NULL
       ) ${platformFilter}`,
      params
    );

    const dataParams = [...params, limit, offset];
    const result = await query(
      `SELECT DISTINCT ON (rd.id) rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.publish_status, rd.category_id, c.name as category_name, rd.fetched_at,
              (
                SELECT json_agg(json_build_object(
                  'platform', sub.platform, 'status', sub.status,
                  'external_url', sub.external_url, 'published_at', sub.published_at,
                  'platform_name', sub.platform_name
                ))
                FROM (
                  -- من publishing_status (سوشال ميديا)
                  SELECT ps2.platform::text, ps2.status::text, ps2.external_url, 
                         ps2.published_at::text, pc.name as platform_name
                  FROM publishing_status ps2
                  LEFT JOIN platform_configs pc ON pc.id = ps2.platform_config_id
                  WHERE ps2.article_id = rd.id AND ps2.status = 'success'
                  UNION ALL
                  -- من auto_publish_log (مواقع خارجية)
                  SELECT 'external_website'::text as platform, 'success'::text as status,
                         apl2.external_url, apl2.published_at::text,
                         apt.name as platform_name
                  FROM auto_publish_log apl2
                  JOIN auto_publish_targets apt ON apt.id = apl2.target_id
                  WHERE apl2.raw_data_id = rd.id AND apl2.status = 'success' AND apl2.external_url IS NOT NULL
                ) sub
              ) as platforms
       FROM raw_data rd
       LEFT JOIN publishing_status ps ON ps.article_id = rd.id AND ps.status = 'success'
       LEFT JOIN auto_publish_log apl ON apl.raw_data_id = rd.id AND apl.status = 'success'
       LEFT JOIN categories c ON c.id = rd.category_id
       LEFT JOIN LATERAL (
         SELECT title, content, image_url, tags
         FROM published_items
         WHERE raw_data_id = rd.id AND is_active = true
         ORDER BY published_at DESC
         LIMIT 1
       ) pi ON TRUE
       WHERE (
         rd.publish_status IN ('archived', 'published_external', 'published_social')
         OR ps.id IS NOT NULL
         OR apl.id IS NOT NULL
       ) ${platformFilter}
       ORDER BY rd.id, rd.fetched_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      dataParams
    );

    // إعادة ترتيب بالأحدث
    result.rows.sort((a: any, b: any) => new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime());

    return { articles: result.rows, total: parseInt(countResult.rows[0]?.total) || 0 };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Statistics
  // ════════════════════════════════════════════════════════════════════════════

  async getPublishingStats(): Promise<{
    total_published: number;
    by_platform: Record<string, number>;
    by_status: Record<string, number>;
    today_published: number;
    failed_count: number;
    dead_letter_count: number;
    publishing_in_progress: number;
  }> {
    const [totalR, byPlatformR, byStatusR, todayR, failedR, deadR, progressR] = await Promise.all([
      query(`SELECT COUNT(*) as total FROM publishing_status WHERE status = 'success'`),
      query(`SELECT platform, COUNT(*) as count FROM publishing_status WHERE status = 'success' GROUP BY platform`),
      query(`SELECT status, COUNT(*) as count FROM publishing_status GROUP BY status`),
      query(`SELECT COUNT(*) as count FROM publishing_status WHERE status = 'success' AND published_at > NOW() - INTERVAL '24 hours'`),
      query(`SELECT COUNT(*) as count FROM publishing_status WHERE status = 'failed' AND retry_count < $1`, [DEFAULT_RETRY_CONFIG.max_retries]),
      query(`SELECT COUNT(*) as count FROM publishing_status WHERE status = 'failed' AND retry_count >= $1`, [DEFAULT_RETRY_CONFIG.max_retries]),
      query(`SELECT COUNT(*) as count FROM publishing_status WHERE status = 'publishing'`),
    ]);

    const byPlatform: Record<string, number> = {};
    for (const row of byPlatformR.rows) byPlatform[row.platform] = parseInt(row.count);

    const byStatus: Record<string, number> = {};
    for (const row of byStatusR.rows) byStatus[row.status] = parseInt(row.count);

    return {
      total_published: parseInt(totalR.rows[0]?.total) || 0,
      by_platform: byPlatform,
      by_status: byStatus,
      today_published: parseInt(todayR.rows[0]?.count) || 0,
      failed_count: parseInt(failedR.rows[0]?.count) || 0,
      dead_letter_count: parseInt(deadR.rows[0]?.count) || 0,
      publishing_in_progress: parseInt(progressR.rows[0]?.count) || 0,
    };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ════════════════════════════════════════════════════════════════════════════

  private async getArticleForPublishing(articleId: number): Promise<ArticleForPublishing | null> {
    // نُفضّل النسخة المعدّلة من published_items (بعد موافقة المحرر)
    // وإن لم توجد نُرجِع للنسخة الأصلية من raw_data
    const result = await query(
      `SELECT rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.category_id,
              c.name as category_name,
              COALESCE(pi.media_unit_id, 1) as media_unit_id
       FROM raw_data rd
       LEFT JOIN categories c ON c.id = rd.category_id
       LEFT JOIN LATERAL (
         SELECT title, content, image_url, tags, media_unit_id
         FROM published_items
         WHERE raw_data_id = rd.id AND is_active = true
         ORDER BY published_at DESC
         LIMIT 1
       ) pi ON TRUE
       WHERE rd.id = $1
       LIMIT 1`,
      [articleId]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      id: row.id, title: row.title, content: row.content,
      image_url: row.image_url || null, tags: row.tags || [],
      category_id: row.category_id, category_name: row.category_name,
      media_unit_id: row.media_unit_id,
    };
  }

  private async getRetryCount(articleId: number, platformConfigId: number): Promise<number> {
    const result = await query(
      `SELECT retry_count FROM publishing_status WHERE article_id = $1 AND platform_config_id = $2`,
      [articleId, platformConfigId]
    );
    return result.rows[0]?.retry_count || 0;
  }

  private async updateStatusToSuccess(
    articleId: number,
    platformConfigId: number,
    result: PublishResult
  ): Promise<void> {
    await query(
      `UPDATE publishing_status 
       SET status = 'success', external_post_id = $1, external_url = $2, 
           published_at = NOW(), error_message = NULL, metadata = $3, updated_at = NOW()
       WHERE article_id = $4 AND platform_config_id = $5`,
      [
        result.external_post_id || null,
        result.external_url || null,
        result.metadata ? JSON.stringify(result.metadata) : null,
        articleId, platformConfigId,
      ]
    );
  }

  private async updateStatusToFailed(
    articleId: number,
    platformConfigId: number,
    errorMessage: string,
    retryCount?: number
  ): Promise<void> {
    if (retryCount !== undefined) {
      await query(
        `UPDATE publishing_status 
         SET status = 'failed', error_message = $1, retry_count = $2, 
             last_retry_at = NOW(), updated_at = NOW()
         WHERE article_id = $3 AND platform_config_id = $4`,
        [errorMessage, retryCount, articleId, platformConfigId]
      );
    } else {
      await query(
        `UPDATE publishing_status 
         SET status = 'failed', error_message = $1, updated_at = NOW()
         WHERE article_id = $2 AND platform_config_id = $3`,
        [errorMessage, articleId, platformConfigId]
      );
    }

    // إرجاع حالة المقال من "publishing" إلى الحالة السابقة
    await query(
      `UPDATE raw_data SET publish_status = 'ready_for_publish' 
       WHERE id = $1 AND publish_status = 'publishing'`,
      [articleId]
    );
  }

  private async createPublishLog(
    articleId: number,
    config: PlatformConfig,
    status: PublishLogStatus,
    retryAttempt: number
  ): Promise<number> {
    const result = await query(
      `INSERT INTO publishing_logs (article_id, platform, platform_config_id, status, retry_attempt, attempted_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [articleId, config.platform, config.id, status, retryAttempt]
    );
    return result.rows[0].id;
  }

  private async completePublishLog(
    logId: number,
    status: PublishLogStatus,
    result: PublishResult
  ): Promise<void> {
    await query(
      `UPDATE publishing_logs 
       SET status = $1, external_post_id = $2, external_url = $3, 
           error_message = $4, metadata = $5, completed_at = NOW()
       WHERE id = $6`,
      [
        status,
        result.external_post_id || null,
        result.external_url || null,
        result.error || null,
        result.metadata ? JSON.stringify(result.metadata) : null,
        logId,
      ]
    );
  }

  /**
   * تنظيف حالات "publishing" العالقة (أكثر من 5 دقائق)
   * يُستدعى دورياً من scheduler
   */
  async cleanupStalePublishing(): Promise<number> {
    const result = await query(
      `UPDATE publishing_status 
       SET status = 'failed', error_message = 'Timeout — stuck in publishing state', updated_at = NOW()
       WHERE status = 'publishing' AND updated_at < NOW() - INTERVAL '5 minutes'
       RETURNING id`
    );
    return result.rows.length;
  }

  getSupportedPlatforms(): PublishingPlatform[] {
    return getSupportedPlatforms();
  }

  getPlatformConstraints() {
    return PLATFORM_CONSTRAINTS;
  }
}

// تصدير instance واحد (Singleton)
export const publishingService = new PublishingService();
