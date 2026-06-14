/**
 * Publishing Controller
 * التحكم في نظام النشر المتعدد المنصات
 * 
 * Endpoints:
 * - POST /publish — نشر مقال على منصة
 * - GET /status/:articleId — حالة النشر لمقال
 * - GET /logs — سجل النشر
 * - GET /logs/:articleId — سجل نشر مقال معين
 * - GET /platforms — المنصات المدعومة
 * - CRUD /configs — إعدادات المنصات
 * - GET /archive — المقالات المؤرشفة
 * - GET /stats — إحصائيات النشر
 * - POST /archive/:articleId — أرشفة مقال يدوياً
 * - POST /set-status — تغيير حالة مقال
 */

import { Request, Response } from 'express';
import { publishingService } from '../../services/publishing';
import { PublishingPlatform } from '../../services/publishing/types';

export class PublishingController {

  // ════════════════════════════════════════════════════════════════════════════
  // النشر
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/publishing/publish
   * نشر مقال على منصة معينة
   * Body: { article_id: number, platform_config_id: number }
   */
  static async publish(req: Request, res: Response): Promise<void> {
    try {
      const { article_id, platform_config_id, custom_content } = req.body;

      if (!article_id || !platform_config_id) {
        res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: article_id, platform_config_id',
        });
        return;
      }

      console.log(`📤 طلب نشر: مقال #${article_id} → منصة config #${platform_config_id}${custom_content ? ' (مع محتوى مخصص)' : ''}`);

      const result = await publishingService.publishToPlatform(
        Number(article_id),
        Number(platform_config_id),
        custom_content || undefined
      );

      const statusCode = result.success ? 200 : 409;
      res.status(statusCode).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في عملية النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Rate Limit / Cooldown
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/cooldown/:platformConfigId
   * فحص الوقت المتبقي قبل السماح بالنشر التالي
   */
  static async getCooldown(req: Request, res: Response): Promise<void> {
    try {
      const platformConfigId = Number(req.params.platformConfigId);
      const cooldownMinutes = 15;

      const result = await publishingService.getLastPublishTime(platformConfigId);

      if (!result) {
        res.status(200).json({ canPublish: true, remainingMs: 0, remainingFormatted: '' });
        return;
      }

      const lastTime = new Date(result).getTime();
      const now = Date.now();
      const elapsedMs = now - lastTime;
      const cooldownMs = cooldownMinutes * 60 * 1000;

      if (elapsedMs >= cooldownMs) {
        res.status(200).json({ canPublish: true, remainingMs: 0, remainingFormatted: '' });
      } else {
        const remainingMs = cooldownMs - elapsedMs;
        const remainingMin = Math.floor(remainingMs / 60000);
        const remainingSec = Math.ceil((remainingMs % 60000) / 1000);
        res.status(200).json({
          canPublish: false,
          remainingMs,
          remainingFormatted: `${remainingMin}:${remainingSec.toString().padStart(2, '0')}`,
          message: `⏳ انتظر ${remainingMin} دقيقة و ${remainingSec} ثانية قبل النشر التالي`,
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في فحص الـ cooldown',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // حالة النشر
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/status/:articleId
   * حالة النشر لمقال على جميع المنصات
   */
  static async getArticleStatus(req: Request, res: Response): Promise<void> {
    try {
      const articleId = Number(req.params.articleId);
      const statuses = await publishingService.getArticlePublishingStatus(articleId);

      res.status(200).json({
        success: true,
        data: statuses,
        total: statuses.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب حالة النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // سجل النشر (Logs)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/logs
   * سجل النشر العام
   * Query: ?platform=facebook&status=success&limit=50&offset=0
   */
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const platform = req.query.platform as PublishingPlatform | undefined;
      const status = req.query.status as any;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await publishingService.getAllLogs({ platform, status, limit, offset });

      res.status(200).json({
        success: true,
        data: result.logs,
        total: result.total,
        limit,
        offset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب سجل النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/publishing/logs/:articleId
   * سجل نشر مقال معين
   */
  static async getArticleLogs(req: Request, res: Response): Promise<void> {
    try {
      const articleId = Number(req.params.articleId);
      const logs = await publishingService.getArticleLogs(articleId);

      res.status(200).json({
        success: true,
        data: logs,
        total: logs.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب سجل نشر المقال',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // المنصات المدعومة
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/platforms
   * المنصات المدعومة
   */
  static async getPlatforms(req: Request, res: Response): Promise<void> {
    try {
      const platforms = publishingService.getSupportedPlatforms();
      res.status(200).json({
        success: true,
        data: platforms,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المنصات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // إعدادات المنصات (Platform Configs CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/configs
   * جلب جميع إعدادات المنصات
   * Query: ?media_unit_id=1
   */
  static async getConfigs(req: Request, res: Response): Promise<void> {
    try {
      const mediaUnitId = req.query.media_unit_id
        ? Number(req.query.media_unit_id)
        : undefined;

      const configs = await publishingService.getAllPlatformConfigs(mediaUnitId);

      // إخفاء الاعتمادات الحساسة
      const safeConfigs = configs.map(c => ({
        ...c,
        credentials: PublishingController.maskCredentials(c.credentials),
      }));

      res.status(200).json({
        success: true,
        data: safeConfigs,
        total: safeConfigs.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إعدادات المنصات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/publishing/configs/:id
   * جلب إعداد منصة واحد
   */
  static async getConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await publishingService.getPlatformConfig(Number(req.params.id));

      if (!config) {
        res.status(404).json({ success: false, message: 'الإعداد غير موجود' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...config,
          credentials: PublishingController.maskCredentials(config.credentials),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/configs
   * إنشاء إعداد منصة جديد
   * Body: { platform, name, credentials, is_enabled?, media_unit_id }
   */
  static async createConfig(req: Request, res: Response): Promise<void> {
    try {
      const { platform, name, credentials, is_enabled, media_unit_id } = req.body;

      if (!platform || !name || !credentials || !media_unit_id) {
        res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: platform, name, credentials, media_unit_id',
        });
        return;
      }

      const config = await publishingService.createPlatformConfig({
        platform,
        name,
        credentials,
        is_enabled,
        media_unit_id,
      });

      console.log(`➕ إعداد منصة جديد: ${name} (${platform})`);

      res.status(201).json({
        success: true,
        message: `تم إنشاء إعداد المنصة "${name}"`,
        data: {
          ...config,
          credentials: PublishingController.maskCredentials(config.credentials),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء إعداد المنصة',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/publishing/configs/:id
   * تحديث إعداد منصة
   */
  static async updateConfig(req: Request, res: Response): Promise<void> {
    try {
      const configId = Number(req.params.id);
      const { name, credentials, is_enabled } = req.body;

      const updated = await publishingService.updatePlatformConfig(configId, {
        name,
        credentials,
        is_enabled,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'الإعداد غير موجود' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `تم تحديث إعداد المنصة "${updated.name}"`,
        data: {
          ...updated,
          credentials: PublishingController.maskCredentials(updated.credentials),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث إعداد المنصة',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/publishing/configs/:id
   * حذف إعداد منصة
   */
  static async deleteConfig(req: Request, res: Response): Promise<void> {
    try {
      const configId = Number(req.params.id);
      const deleted = await publishingService.deletePlatformConfig(configId);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'الإعداد غير موجود' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'تم حذف إعداد المنصة',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف إعداد المنصة',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/configs/:id/toggle
   * تفعيل/إيقاف منصة
   * Body: { enabled: boolean }
   */
  static async toggleConfig(req: Request, res: Response): Promise<void> {
    try {
      const configId = Number(req.params.id);
      const { enabled } = req.body;

      if (enabled === undefined) {
        res.status(400).json({ success: false, message: 'الحقل enabled مطلوب' });
        return;
      }

      const updated = await publishingService.togglePlatformConfig(configId, Boolean(enabled));

      if (!updated) {
        res.status(404).json({ success: false, message: 'الإعداد غير موجود' });
        return;
      }

      const status = enabled ? 'مفعّل ✅' : 'متوقف ⏸️';
      res.status(200).json({
        success: true,
        message: `المنصة "${updated.name}" الآن ${status}`,
        data: { id: configId, is_enabled: Boolean(enabled) },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تبديل حالة المنصة',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/configs/:id/validate
   * التحقق من صلاحية اعتمادات منصة
   */
  static async validateConfig(req: Request, res: Response): Promise<void> {
    try {
      const configId = Number(req.params.id);
      const isValid = await publishingService.validatePlatformCredentials(configId);

      res.status(200).json({
        success: true,
        data: { valid: isValid },
        message: isValid ? 'الاعتمادات صالحة ✅' : 'الاعتمادات غير صالحة ❌',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الاعتمادات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // الأرشيف والإحصائيات
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/publishing/archive
   * المقالات المؤرشفة (المنشورة بنجاح)
   * Query: ?platform=facebook&media_unit_id=1&limit=50&offset=0
   */
  static async getArchive(req: Request, res: Response): Promise<void> {
    try {
      const platform = req.query.platform as PublishingPlatform | undefined;
      const media_unit_id = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await publishingService.getArchivedArticles({ platform, media_unit_id, limit, offset });

      res.status(200).json({
        success: true,
        data: result.articles,
        total: result.total,
        limit,
        offset,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الأرشيف',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/archive/:articleId
   * أرشفة مقال يدوياً
   */
  static async archiveArticle(req: Request, res: Response): Promise<void> {
    try {
      const articleId = Number(req.params.articleId);
      const success = await publishingService.archiveArticle(articleId);

      if (!success) {
        res.status(400).json({ success: false, message: 'لا يمكن أرشفة المقال — تأكد أنه منشور على منصة واحدة على الأقل (موقع خارجي أو سوشال ميديا)' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'تم أرشفة المقال بنجاح',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في أرشفة المقال',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/set-status
   * تغيير حالة مقال يدوياً
   * Body: { article_id: number, status: ArticlePublishStatus }
   */
  static async setArticleStatus(req: Request, res: Response): Promise<void> {
    try {
      const { article_id, status } = req.body;
      const validStatuses = ['draft', 'ready_for_publish', 'published_social', 'published_external', 'archived'];

      if (!article_id || !status) {
        res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: article_id, status',
        });
        return;
      }

      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          message: `الحالة غير صالحة. الحالات المتاحة: ${validStatuses.join(', ')}`,
        });
        return;
      }

      const success = await publishingService.setArticleStatus(Number(article_id), status);

      if (!success) {
        res.status(404).json({ success: false, message: 'المقال غير موجود' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `تم تحديث حالة المقال إلى "${status}"`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث حالة المقال',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/publishing/stats
   * إحصائيات النشر
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await publishingService.getPublishingStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Retry & Dead Letter
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/publishing/retry
   * إعادة محاولة نشر المقالات الفاشلة (exponential backoff)
   * Query: ?limit=10
   */
  static async retryFailed(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const result = await publishingService.retryFailed({ limit });

      res.status(200).json({
        success: true,
        message: `إعادة المحاولة: ✅ ${result.retried} | ❌ dead-letter: ${result.dead_letter}`,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إعادة محاولة النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/publishing/dead-letter
   * المقالات التي فشلت أكثر من الحد الأقصى (dead-letter queue)
   */
  static async getDeadLetter(req: Request, res: Response): Promise<void> {
    try {
      const items = await publishingService.getDeadLetterItems();
      res.status(200).json({
        success: true,
        data: items,
        total: items.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب dead-letter',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/publishing/constraints
   * قيود كل منصة (ما تتطلبه)
   */
  static async getConstraints(req: Request, res: Response): Promise<void> {
    try {
      const constraints = publishingService.getPlatformConstraints();
      res.status(200).json({ success: true, data: constraints });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب قيود المنصات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/publishing/cleanup
   * تنظيف حالات "publishing" العالقة (أكثر من 5 دقائق)
   */
  static async cleanupStale(req: Request, res: Response): Promise<void> {
    try {
      const cleaned = await publishingService.cleanupStalePublishing();
      res.status(200).json({
        success: true,
        message: `تم تنظيف ${cleaned} عملية عالقة`,
        data: { cleaned },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في التنظيف',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // Helpers
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * إخفاء الاعتمادات الحساسة (tokens, secrets)
   */
  private static maskCredentials(credentials: Record<string, any>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(credentials)) {
      if (typeof value === 'string' && value.length > 8) {
        masked[key] = `***${value.slice(-6)}`;
      } else {
        masked[key] = '***';
      }
    }
    return masked;
  }
}
