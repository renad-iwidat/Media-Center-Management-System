/**
 * Auto-Publish Controller
 * التحكم في النشر التلقائي على المواقع الخارجية
 * 
 * كل وحدة إعلامية (media_unit) ممكن يكون عندها أهداف نشر خارجية
 * مثلاً: وحدة "هنا غزة" → موقع hgaza.nn.ps
 */

import { Request, Response } from 'express';
import { autoPublishService } from '../../services/news/auto-publish.service';
import { SystemSettingsService } from '../../services/database/system-settings.service';

export class AutoPublishController {

  // ════════════════════════════════════════════════════════════════════════════
  // Master Switch + Status
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/auto-publish/status
   * حالة النشر التلقائي (ملخص + إحصائيات)
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const stats = await autoPublishService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب حالة النشر التلقائي',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/toggle
   * تفعيل/إيقاف النشر التلقائي (master switch)
   * Body: { enabled: boolean }
   */
  static async toggleMaster(req: Request, res: Response): Promise<void> {
    try {
      const { enabled } = req.body;

      if (enabled === undefined) {
        res.status(400).json({ success: false, message: 'الحقل enabled مطلوب' });
        return;
      }

      await SystemSettingsService.setBoolean('auto_publish_enabled', Boolean(enabled));

      const status = enabled ? 'مفعّل ✅' : 'متوقف ⏸️';
      console.log(`🌐 النشر التلقائي (master): ${status}`);

      res.status(200).json({
        success: true,
        message: `النشر التلقائي الآن ${status}`,
        data: { enabled: Boolean(enabled) },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تبديل حالة النشر التلقائي',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // إدارة الأهداف (Targets CRUD)
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/auto-publish/targets
   * جلب جميع أهداف النشر
   */
  static async getTargets(req: Request, res: Response): Promise<void> {
    try {
      const { media_unit_id } = req.query;

      let targets;
      if (media_unit_id) {
        targets = await autoPublishService.getTargetsByMediaUnit(Number(media_unit_id));
      } else {
        targets = await autoPublishService.getAllTargets();
      }

      // إخفاء الـ token الكامل لأسباب أمنية
      const safeTargets = targets.map(t => ({
        ...t,
        api_token: t.api_token ? `***${t.api_token.slice(-8)}` : '',
      }));

      res.status(200).json({
        success: true,
        data: safeTargets,
        total: safeTargets.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب أهداف النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/auto-publish/targets/:id
   * جلب هدف واحد
   */
  static async getTarget(req: Request, res: Response): Promise<void> {
    try {
      const target = await autoPublishService.getTargetById(Number(req.params.id));

      if (!target) {
        res.status(404).json({ success: false, message: 'الهدف غير موجود' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          ...target,
          api_token: target.api_token ? `***${target.api_token.slice(-8)}` : '',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الهدف',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/targets
   * إنشاء هدف نشر جديد
   * Body: { media_unit_id, name, api_url, api_token, default_category_id?, is_enabled? }
   */
  static async createTarget(req: Request, res: Response): Promise<void> {
    try {
      const { media_unit_id, name, api_url, api_token, default_category_id, is_enabled } = req.body;

      // Validation
      if (!media_unit_id || !name || !api_url || !api_token) {
        res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: media_unit_id, name, api_url, api_token',
        });
        return;
      }

      const target = await autoPublishService.createTarget({
        media_unit_id,
        name,
        api_url,
        api_token,
        default_category_id,
        is_enabled,
      });

      console.log(`➕ تم إنشاء هدف نشر جديد: ${name} (media_unit: ${media_unit_id})`);

      res.status(201).json({
        success: true,
        message: `تم إنشاء هدف النشر "${name}"`,
        data: {
          ...target,
          api_token: `***${target.api_token.slice(-8)}`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إنشاء هدف النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/auto-publish/targets/:id
   * تحديث هدف نشر
   * Body: { name?, api_url?, api_token?, default_category_id?, is_enabled? }
   */
  static async updateTarget(req: Request, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const { name, api_url, api_token, default_category_id, is_enabled } = req.body;

      const updated = await autoPublishService.updateTarget(targetId, {
        name,
        api_url,
        api_token,
        default_category_id,
        is_enabled,
      });

      if (!updated) {
        res.status(404).json({ success: false, message: 'الهدف غير موجود أو لا توجد تغييرات' });
        return;
      }

      console.log(`✏️  تم تحديث هدف النشر: ${updated.name} (ID: ${targetId})`);

      res.status(200).json({
        success: true,
        message: `تم تحديث هدف النشر "${updated.name}"`,
        data: {
          ...updated,
          api_token: updated.api_token ? `***${updated.api_token.slice(-8)}` : '',
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث هدف النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/auto-publish/targets/:id
   * حذف هدف نشر
   */
  static async deleteTarget(req: Request, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const deleted = await autoPublishService.deleteTarget(targetId);

      if (!deleted) {
        res.status(404).json({ success: false, message: 'الهدف غير موجود' });
        return;
      }

      console.log(`🗑️  تم حذف هدف النشر (ID: ${targetId})`);

      res.status(200).json({
        success: true,
        message: 'تم حذف هدف النشر',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في حذف هدف النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/targets/:id/toggle
   * تفعيل/إيقاف هدف نشر معين
   * Body: { enabled: boolean }
   */
  static async toggleTarget(req: Request, res: Response): Promise<void> {
    try {
      const targetId = Number(req.params.id);
      const { enabled } = req.body;

      if (enabled === undefined) {
        res.status(400).json({ success: false, message: 'الحقل enabled مطلوب' });
        return;
      }

      const updated = await autoPublishService.toggleTarget(targetId, Boolean(enabled));

      if (!updated) {
        res.status(404).json({ success: false, message: 'الهدف غير موجود' });
        return;
      }

      const status = enabled ? 'مفعّل ✅' : 'متوقف ⏸️';
      console.log(`📤 هدف النشر "${updated.name}": ${status}`);

      res.status(200).json({
        success: true,
        message: `هدف النشر "${updated.name}" الآن ${status}`,
        data: { id: targetId, is_enabled: Boolean(enabled) },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تبديل حالة هدف النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // تشغيل يدوي + نشر يدوي (للمحرر) + سجل
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * POST /api/auto-publish/publish-one
   * نشر خبر واحد يدوياً على هدف معين (للمحرر — أخبار تحريرية)
   * Body: { raw_data_id: number, target_id: number }
   */
  static async publishOneManually(req: Request, res: Response): Promise<void> {
    try {
      const { raw_data_id, target_id } = req.body;

      if (!raw_data_id || !target_id) {
        res.status(400).json({
          success: false,
          message: 'الحقول المطلوبة: raw_data_id, target_id',
        });
        return;
      }

      console.log(`📤 نشر يدوي: خبر #${raw_data_id} → هدف #${target_id}`);
      const result = await autoPublishService.publishOneManually(Number(raw_data_id), Number(target_id));

      if (result.success) {
        res.status(200).json({
          success: true,
          message: 'تم نشر الخبر بنجاح على الموقع الخارجي ✅',
          data: {
            responseCode: result.responseCode,
            externalUrl: result.externalUrl || null,
            externalId: result.externalId || null,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.error || 'فشل النشر',
          data: { responseCode: result.responseCode },
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في نشر الخبر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/run
   * تشغيل النشر التلقائي يدوياً (بدون انتظار الـ scheduler)
   */
  static async runNow(req: Request, res: Response): Promise<void> {
    try {
      console.log('📤 تشغيل النشر التلقائي يدوياً...');
      const result = await autoPublishService.publishAll();

      res.status(200).json({
        success: true,
        message: `تم النشر: ✅ ${result.success} | ❌ ${result.failed} | ⏭️ ${result.skipped}`,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تشغيل النشر التلقائي',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/retry
   * إعادة محاولة نشر المقالات الفاشلة
   */
  static async retryFailed(req: Request, res: Response): Promise<void> {
    try {
      const result = await autoPublishService.retryFailed();

      res.status(200).json({
        success: true,
        message: `إعادة المحاولة: ✅ ${result.success} | ❌ ${result.failed}`,
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
   * GET /api/auto-publish/log
   * جلب سجل النشر التلقائي
   */
  static async getLog(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const targetId = req.query.target_id ? parseInt(req.query.target_id as string) : undefined;

      const log = await autoPublishService.getLog({ targetId, limit });

      res.status(200).json({
        success: true,
        data: log,
        total: log.length,
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
   * GET /api/auto-publish/external-links/:rawDataId
   * جلب روابط النشر الخارجي لخبر معين (للأرشيف)
   */
  static async getExternalLinks(req: Request, res: Response): Promise<void> {
    try {
      const rawDataId = Number(req.params.rawDataId);
      const links = await autoPublishService.getExternalLinks(rawDataId);

      res.status(200).json({
        success: true,
        data: links,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب روابط النشر الخارجي',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/auto-publish/external-links/batch
   * جلب روابط النشر الخارجي لمجموعة أخبار (للأرشيف)
   * Body: { raw_data_ids: number[] }
   */
  static async getExternalLinksBatch(req: Request, res: Response): Promise<void> {
    try {
      const { raw_data_ids } = req.body;
      if (!Array.isArray(raw_data_ids)) {
        res.status(400).json({ success: false, message: 'raw_data_ids يجب أن يكون array' });
        return;
      }

      const links = await autoPublishService.getExternalLinksForArticles(raw_data_ids);

      res.status(200).json({
        success: true,
        data: links,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب روابط النشر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
