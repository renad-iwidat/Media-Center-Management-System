/**
 * Auto-Publish Service
 * الخدمة الرئيسية للنشر التلقائي — تنسيق العمليات بين الموديولات
 *
 * المسؤوليات:
 * - publishAll(): النشر التلقائي من السكيدولر (مع الحد اليومي)
 * - publishOneManually(): النشر اليدوي من المحرر
 * - retryFailed(): إعادة محاولة الأخبار الفاشلة
 * - publishOneToTarget(): إرسال خبر واحد لموقع خارجي
 */

import { query } from '../../../config/database';
import { SystemSettingsService } from '../../database/system-settings.service';
import { targetRepository } from './target-repository';
import { publishLogger } from './publish-logger';
import { resolveExternalCategory } from './category-resolver';
import { prepareTagsString } from './tag-generator';
import { prepareContentForPublish, prepareTitleForPublish } from './content-formatter';
import {
  AutoPublishTarget,
  AutoPublishArticle,
  AutoPublishResult,
  PublishResponse,
  PublishOverrides,
} from './types';

// ── Constants ────────────────────────────────────────────────────────────────

const DELAY_BETWEEN_REQUESTS_MS = 5000;
const MAX_RETRIES = 2;
const IMAGE_TIMEOUT_MS = 15000;
const DEFAULT_FETCH_LIMIT = 20;

// ══════════════════════════════════════════════════════════════════════════════
// Service Class
// ══════════════════════════════════════════════════════════════════════════════

class AutoPublishService {

  // ════════════════════════════════════════════════════════════════════════════
  // النشر التلقائي (من السكيدولر)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * نشر جميع الأخبار الجاهزة على جميع الأهداف المفعّلة
   * تُستدعى من الـ scheduler — تحترم الحد اليومي لكل هدف
   */
  async publishAll(): Promise<AutoPublishResult> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) {
      console.log('⏸️  النشر التلقائي متوقف (auto_publish_enabled = false)');
      return this.emptyResult();
    }

    const enabledTargets = await targetRepository.getEnabledForAutoPublish();
    if (enabledTargets.length === 0) {
      console.log('⚠️  لا يوجد أهداف نشر مفعّلة');
      return this.emptyResult();
    }

    const result: AutoPublishResult = this.emptyResult();

    for (const target of enabledTargets) {
      console.log(`\n📤 النشر على: ${target.name} (${target.media_unit_name})`);

      // فحص الحد اليومي
      const remainingQuota = await this.getRemainingQuota(target);
      if (remainingQuota === 0) {
        console.log(`   🚫 تم الوصول للحد اليومي (${target.daily_auto_limit} خبر) — تخطي`);
        continue;
      }

      const fetchLimit = remainingQuota === Infinity
        ? DEFAULT_FETCH_LIMIT
        : Math.min(DEFAULT_FETCH_LIMIT, remainingQuota);

      const articles = await targetRepository.getUnpublishedArticles(
        target.id, target.media_unit_id, fetchLimit
      );

      if (articles.length === 0) {
        console.log(`   ✅ لا يوجد أخبار جديدة للنشر`);
        continue;
      }

      console.log(`   📰 ${articles.length} خبر جاهز للنشر`);

      let publishedInThisRun = 0;
      for (const article of articles) {
        if (remainingQuota !== Infinity && publishedInThisRun >= remainingQuota) {
          console.log(`   🚫 تم الوصول للحد اليومي أثناء النشر — توقف`);
          break;
        }

        result.total++;

        if (!article.title || !article.content) {
          result.skipped++;
          result.details.push({
            articleId: article.id, targetId: target.id, targetName: target.name,
            title: article.title || '(بدون عنوان)', status: 'skipped', error: 'عنوان أو محتوى فارغ',
          });
          continue;
        }

        const publishResult = await this.publishOneToTarget(article, target);

        if (publishResult.success) {
          result.success++;
          publishedInThisRun++;
          result.details.push({
            articleId: article.id, targetId: target.id, targetName: target.name,
            title: article.title, status: 'success', responseCode: publishResult.responseCode,
          });
          console.log(`   ✅ ${article.title.substring(0, 50)}...`);
        } else {
          result.failed++;
          result.details.push({
            articleId: article.id, targetId: target.id, targetName: target.name,
            title: article.title, status: 'failed', responseCode: publishResult.responseCode, error: publishResult.error,
          });
          console.log(`   ❌ ${article.title.substring(0, 50)}... — ${publishResult.error}`);
        }

        await this.delay(DELAY_BETWEEN_REQUESTS_MS);
      }
    }

    if (result.total > 0) {
      console.log(`\n📊 نتيجة النشر: ✅ ${result.success} | ❌ ${result.failed} | ⏭️ ${result.skipped}`);
    }

    return result;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // النشر اليدوي (من المحرر)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * نشر خبر واحد يدوياً — المحرر يختار الخبر والهدف والإعدادات
   * لا يتأثر بالحد اليومي
   */
  async publishOneManually(rawDataId: number, targetId: number, overrides?: PublishOverrides): Promise<PublishResponse> {
    const target = await targetRepository.getById(targetId);
    if (!target) return { success: false, error: 'هدف النشر غير موجود' };
    if (!target.is_enabled && !target.manual_enabled) return { success: false, error: 'النشر اليدوي متوقف لهذا الهدف' };

    const article = await targetRepository.getArticleForManualPublish(rawDataId);
    if (!article) return { success: false, error: 'الخبر غير موجود' };
    article.media_unit_id = target.media_unit_id;

    const alreadyPublished = await targetRepository.isAlreadyPublished(targetId, rawDataId);
    if (alreadyPublished) return { success: false, error: 'الخبر منشور مسبقاً على هذا الهدف' };

    return this.publishOneToTarget(article, target, { ...overrides, isManual: true });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // إعادة المحاولة (Retry)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * إعادة محاولة نشر الأخبار الفاشلة (حد أقصى 3 محاولات)
   */
  async retryFailed(): Promise<AutoPublishResult> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);
    if (!masterEnabled) return this.emptyResult();

    const failedResult = await query(
      `SELECT apl.target_id, apl.raw_data_id,
              rd.title, rd.content, rd.image_url, rd.tags, rd.category_id,
              c.slug as category_slug,
              apt.media_unit_id, apt.name as target_name,
              apt.api_url, apt.api_token, apt.auth_type,
              apt.default_category_id, apt.category_mappings,
              apt.default_auto_publish, apt.default_pin, apt.categories_api_url,
              apt.daily_auto_limit
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       JOIN raw_data rd ON rd.id = apl.raw_data_id
       LEFT JOIN categories c ON c.id = rd.category_id
       WHERE apl.status = 'failed'
         AND apl.retry_count < 3
         AND apt.auto_enabled = true
         AND apl.created_at >= CURRENT_DATE
       ORDER BY apl.updated_at ASC
       LIMIT 10`
    );

    if (failedResult.rows.length === 0) return this.emptyResult();

    console.log(`🔄 إعادة محاولة نشر ${failedResult.rows.length} خبر فاشل...`);

    const result: AutoPublishResult = { ...this.emptyResult(), total: failedResult.rows.length };

    for (const row of failedResult.rows) {
      const article = this.rowToArticle(row);
      const target = this.rowToTarget(row);

      const publishResult = await this.publishOneToTarget(article, target);

      if (publishResult.success) {
        result.success++;
        result.details.push({
          articleId: article.id, targetId: target.id, targetName: target.name,
          title: article.title, status: 'success', responseCode: publishResult.responseCode,
        });
      } else {
        result.failed++;
        result.details.push({
          articleId: article.id, targetId: target.id, targetName: target.name,
          title: article.title, status: 'failed', error: publishResult.error,
        });
      }

      await this.delay(DELAY_BETWEEN_REQUESTS_MS);
    }

    return result;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // النشر الفعلي (إرسال الخبر للموقع الخارجي)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * نشر خبر واحد على هدف معين
   * يبني الـ multipart/form-data ويرسل مع retry
   */
  async publishOneToTarget(
    article: AutoPublishArticle,
    target: AutoPublishTarget,
    overrides?: PublishOverrides
  ): Promise<PublishResponse> {
    try {
      // تحديد الإعدادات
      const externalCategoryId = overrides?.category_id ?? resolveExternalCategory(article.category_id, target);
      const autoPublish = overrides?.auto_publish ?? target.default_auto_publish;
      const pinValue = overrides?.pin ?? target.default_pin;
      const isManual = overrides?.isManual ?? false;

      // تجهيز الـ tags
      const tagsString = await prepareTagsString(article.tags, article.id, article.title, article.content);

      console.log(`   📡 Sending to: ${target.api_url}`);
      console.log(`   📦 cat=${externalCategoryId} auto_publish=${autoPublish} pin=${pinValue} auth=${target.auth_type}`);

      // تحميل الصورة
      const image = await this.downloadImage(article.image_url);

      // تجهيز المحتوى
      const cleanTitle = prepareTitleForPublish(article.title);
      const cleanContent = prepareContentForPublish(article.content);

      // إرسال مع retry
      const { response, responseBody } = await this.sendRequest(target, {
        title: cleanTitle,
        content: cleanContent,
        categoryId: externalCategoryId,
        tags: tagsString,
        autoPublish,
        pin: pinValue,
        image,
      });

      console.log(`   📋 Response [${response.status}]: ${responseBody.substring(0, 300)}`);

      if (response.ok) {
        const { externalId, externalUrl } = this.parseSuccessResponse(responseBody, target, article.title);
        console.log(`   🔗 External URL: ${externalUrl || '(لم يُرجع رابط)'}`);

        await publishLogger.log({
          targetId: target.id, rawDataId: article.id,
          status: 'success', responseCode: response.status, responseBody,
          externalUrl, externalId, isManual,
        });

        await query(
          `UPDATE raw_data
             SET publish_status = CASE WHEN publish_status NOT IN ('archived') THEN 'published_external' ELSE publish_status END,
                 archived_at = COALESCE(archived_at, NOW())
           WHERE id = $1`,
          [article.id]
        );

        return { success: true, responseCode: response.status, responseBody, externalUrl, externalId };
      } else {
        await publishLogger.log({
          targetId: target.id, rawDataId: article.id,
          status: 'failed', responseCode: response.status, responseBody,
          errorMessage: `HTTP ${response.status}`, isManual,
        });
        return { success: false, responseCode: response.status, error: `HTTP ${response.status}: ${responseBody.substring(0, 200)}` };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      await publishLogger.log({
        targetId: target.id, rawDataId: article.id,
        status: 'failed', errorMessage: errorMsg, isManual: overrides?.isManual ?? false,
      });
      return { success: false, error: errorMsg };
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Delegate Methods (تمرير للموديولات)
  // ════════════════════════════════════════════════════════════════════════════

  // Targets
  getAllTargets = () => targetRepository.getAll();
  getTargetsByMediaUnit = (id: number) => targetRepository.getByMediaUnit(id);
  getTargetById = (id: number) => targetRepository.getById(id);
  createTarget = (data: any) => targetRepository.create(data);
  updateTarget = (id: number, data: any) => targetRepository.update(id, data);
  deleteTarget = (id: number) => targetRepository.delete(id);
  toggleTarget = (id: number, enabled: boolean) => targetRepository.update(id, { manual_enabled: enabled, auto_enabled: enabled });
  toggleManualEnabled = (id: number, enabled: boolean) => targetRepository.update(id, { manual_enabled: enabled });
  toggleAutoEnabled = (id: number, enabled: boolean) => targetRepository.update(id, { auto_enabled: enabled });
  fetchExternalCategories = (id: number) => targetRepository.fetchExternalCategories(id);
  getUnpublishedForTarget = (targetId: number, mediaUnitId: number, limit?: number) => targetRepository.getUnpublishedArticles(targetId, mediaUnitId, limit);

  // Logs & Stats
  getLog = (options?: any) => publishLogger.getLog(options);
  getExternalLinks = (rawDataId: number) => publishLogger.getExternalLinks(rawDataId);
  getExternalLinksForArticles = (ids: number[]) => publishLogger.getExternalLinksForArticles(ids);
  getStats = () => targetRepository.getStats();

  // ════════════════════════════════════════════════════════════════════════════
  // Private Helpers
  // ════════════════════════════════════════════════════════════════════════════

  private emptyResult(): AutoPublishResult {
    return { total: 0, success: 0, failed: 0, skipped: 0, details: [] };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * حساب الكمية المتبقية من الحد اليومي
   */
  private async getRemainingQuota(target: AutoPublishTarget): Promise<number> {
    if (target.daily_auto_limit === null || target.daily_auto_limit <= 0) {
      return Infinity;
    }
    const todayCount = await publishLogger.getTodayAutoCount(target.id);
    const remaining = Math.max(0, target.daily_auto_limit - todayCount);
    if (remaining > 0 && remaining < Infinity) {
      console.log(`   📊 الحد اليومي: ${target.daily_auto_limit} | تلقائي اليوم: ${todayCount} | متبقي: ${remaining}`);
    }
    return remaining;
  }

  /**
   * تحميل صورة الخبر وتحويلها لـ Buffer
   */
  private async downloadImage(imageUrl: string | null): Promise<{ buffer: Buffer; contentType: string; fileName: string } | null> {
    if (!imageUrl) return null;

    try {
      const imgResponse = await fetch(imageUrl, { signal: AbortSignal.timeout(IMAGE_TIMEOUT_MS) });
      if (!imgResponse.ok) {
        console.log(`   ⚠️ فشل تحميل الصورة (${imgResponse.status})`);
        return null;
      }

      const buffer = Buffer.from(await imgResponse.arrayBuffer());
      const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';

      // استخراج اسم الملف
      let fileName = 'image.jpg';
      try {
        const urlPath = new URL(imageUrl).pathname;
        const name = urlPath.split('/').pop();
        if (name && /\.(jpg|jpeg|png|gif|webp)$/i.test(name)) {
          fileName = name;
        } else {
          fileName = `image.${contentType.split('/')[1] || 'jpg'}`;
        }
      } catch { /* ignore */ }

      return { buffer, contentType, fileName };
    } catch (err) {
      console.log(`   ⚠️ خطأ في تحميل الصورة: ${err instanceof Error ? err.message : 'unknown'}`);
      return null;
    }
  }

  /**
   * بناء وإرسال الـ HTTP request (multipart/form-data)
   */
  private async sendRequest(
    target: AutoPublishTarget,
    payload: {
      title: string;
      content: string;
      categoryId: number;
      tags: string;
      autoPublish: boolean;
      pin: number;
      image: { buffer: Buffer; contentType: string; fileName: string } | null;
    }
  ): Promise<{ response: Response; responseBody: string }> {
    const authHeader = target.auth_type === 'token'
      ? `Token ${target.api_token}`
      : `Bearer ${target.api_token}`;

    const supportsAutoPublish = target.auth_type === 'token' || target.api_url.includes('nn.najah.edu');

    let response!: Response;
    let responseBody = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const boundary = `----FormBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
      const CRLF = '\r\n';
      const parts: (string | Buffer)[] = [];

      const addField = (name: string, value: string) => {
        parts.push(
          `--${boundary}${CRLF}Content-Disposition: form-data; name="${name}"${CRLF}${CRLF}${value}${CRLF}`
        );
      };

      addField('title', payload.title);
      addField('content', payload.content);
      addField('category_id', String(payload.categoryId));
      addField('keywords', payload.tags);

      if (supportsAutoPublish) {
        addField('auto_publish', payload.autoPublish ? 'true' : 'false');
        addField('pin', String(payload.pin));
        addField('image_caption', payload.title.substring(0, 100));
        addField('content_format', 'html');
      }

      // الصورة
      if (payload.image) {
        if (target.auth_type === 'token') {
          parts.push(
            `--${boundary}${CRLF}` +
            `Content-Disposition: form-data; name="image"; filename="${payload.image.fileName}"${CRLF}` +
            `Content-Type: ${payload.image.contentType}${CRLF}${CRLF}`
          );
          parts.push(payload.image.buffer);
          parts.push(CRLF);
        } else {
          const imageBase64 = `data:${payload.image.contentType};base64,${payload.image.buffer.toString('base64')}`;
          addField('image_base64', imageBase64);
        }
      }

      parts.push(`--${boundary}--${CRLF}`);

      const bodyParts = parts.map(p => typeof p === 'string' ? Buffer.from(p, 'utf-8') : p);
      const bodyBuffer = Buffer.concat(bodyParts);

      response = await fetch(target.api_url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': authHeader,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: bodyBuffer,
      });

      responseBody = await response.text();

      if (response.status !== 500 || attempt === MAX_RETRIES) break;

      const waitTime = (attempt + 1) * 5000;
      console.log(`   🔄 Retry ${attempt + 1}/${MAX_RETRIES} after ${waitTime / 1000}s...`);
      await this.delay(waitTime);
    }

    return { response, responseBody };
  }

  /**
   * استخراج external ID و URL من response ناجح
   */
  private parseSuccessResponse(
    responseBody: string,
    target: AutoPublishTarget,
    title: string
  ): { externalId?: number; externalUrl?: string } {
    try {
      const parsed = JSON.parse(responseBody);
      const externalId = parsed?.data?.id || parsed?.id;
      let externalUrl = parsed?.data?.url || parsed?.url;

      if (!externalUrl && title) {
        const baseUrl = target.api_url.replace(/\/api\/.*$/, '');
        const slug = title.trim()
          .replace(/[^\u0600-\u06FF\u0750-\u077Fa-zA-Z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        externalUrl = `${baseUrl}/article/${encodeURIComponent(slug)}`;
      }

      return { externalId, externalUrl };
    } catch {
      return {};
    }
  }

  /**
   * تحويل row من DB لـ AutoPublishArticle
   */
  private rowToArticle(row: any): AutoPublishArticle {
    return {
      id: row.raw_data_id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: row.media_unit_id,
    };
  }

  /**
   * تحويل row من DB لـ AutoPublishTarget
   */
  private rowToTarget(row: any): AutoPublishTarget {
    return {
      id: row.target_id,
      media_unit_id: row.media_unit_id,
      name: row.target_name,
      api_url: row.api_url,
      api_token: row.api_token,
      auth_type: row.auth_type || 'bearer',
      default_category_id: row.default_category_id,
      category_mappings: row.category_mappings || {},
      default_auto_publish: row.default_auto_publish ?? true,
      default_pin: row.default_pin ?? 0,
      categories_api_url: row.categories_api_url || null,
      publish_mode: row.publish_mode || 'automated',
      manual_enabled: row.manual_enabled ?? false,
      auto_enabled: row.auto_enabled ?? true,
      is_enabled: true,
      daily_auto_limit: row.daily_auto_limit ?? null,
      created_at: '',
      updated_at: '',
    };
  }
}

export const autoPublishService = new AutoPublishService();
