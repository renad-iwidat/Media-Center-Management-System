/**
 * System Settings Controller
 * التحكم في إعدادات النظام (تشغيل/إيقاف السيرفسز)
 */

import { Request, Response } from 'express';
import { SystemSettingsService } from '../../services/database/system-settings.service';
import { schedulerService } from '../../services/news/scheduler.service';

export class SystemSettingsController {
  /**
   * GET /api/settings
   * جلب جميع الإعدادات
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const settings = await SystemSettingsService.getAll();
      res.status(200).json({
        success: true,
        data: settings,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/settings/toggles
   * جلب حالة الـ toggles الثلاثة دفعة واحدة
   */
  static async getToggles(req: Request, res: Response): Promise<void> {
    try {
      const toggles = await SystemSettingsService.getToggles();
      res.status(200).json({
        success: true,
        data: toggles,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/settings/:key
   * تحديث إعداد واحد
   * Body: { value: "true" | "false" }
   */
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value } = req.body;

      // التحقق من المفاتيح المسموح بها
      const allowedKeys = [
        'scheduler_enabled',
        'classifier_enabled',
        'flow_enabled',
        'scheduler_interval_minutes',
        'articles_per_source',
      ];
      if (!allowedKeys.includes(key)) {
        res.status(400).json({
          success: false,
          message: `المفتاح غير مسموح به. المفاتيح المتاحة: ${allowedKeys.join(', ')}`,
        });
        return;
      }

      if (value === undefined || value === null) {
        res.status(400).json({
          success: false,
          message: 'القيمة مطلوبة',
        });
        return;
      }

      const updated = await SystemSettingsService.set(key, String(value));

      if (!updated) {
        res.status(404).json({
          success: false,
          message: 'الإعداد غير موجود في الداتابيس — شغّل SQL الإنشاء أولاً',
        });
        return;
      }

      console.log(`⚙️  تم تحديث الإعداد: ${key} = ${value}`);

      // 🔄 إعادة تشغيل الـ Scheduler تلقائياً إذا تغيّر الـ interval
      if (key === 'scheduler_interval_minutes' && schedulerService.getStatus().isRunning) {
        console.log('🔄 إعادة تشغيل الـ Scheduler لتطبيق الـ interval الجديد...');
        await schedulerService.restart();
        console.log('✅ تم إعادة تشغيل الـ Scheduler بنجاح');
      }

      res.status(200).json({
        success: true,
        message: `تم تحديث ${key} إلى ${value}`,
        data: updated,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الإعداد',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/settings/toggles/bulk
   * تحديث أكثر من toggle دفعة واحدة
   * Body: { scheduler_enabled?: boolean, classifier_enabled?: boolean, flow_enabled?: boolean }
   */
  static async bulkUpdate(req: Request, res: Response): Promise<void> {
    try {
      const {
        scheduler_enabled,
        classifier_enabled,
        flow_enabled,
        scheduler_interval_minutes,
        articles_per_source,
      } = req.body;

      const updates: Array<{ key: string; value: string }> = [];

      if (scheduler_enabled !== undefined)
        updates.push({ key: 'scheduler_enabled', value: String(Boolean(scheduler_enabled)) });
      if (classifier_enabled !== undefined)
        updates.push({ key: 'classifier_enabled', value: String(Boolean(classifier_enabled)) });
      if (flow_enabled !== undefined)
        updates.push({ key: 'flow_enabled', value: String(Boolean(flow_enabled)) });
      if (scheduler_interval_minutes !== undefined) {
        const mins = parseInt(String(scheduler_interval_minutes), 10);
        if (isNaN(mins) || mins < 1) {
          res.status(400).json({ success: false, message: 'scheduler_interval_minutes يجب أن يكون رقم موجب' });
          return;
        }
        updates.push({ key: 'scheduler_interval_minutes', value: String(mins) });
      }
      if (articles_per_source !== undefined) {
        const count = parseInt(String(articles_per_source), 10);
        if (isNaN(count) || count < 1) {
          res.status(400).json({ success: false, message: 'articles_per_source يجب أن يكون رقم موجب' });
          return;
        }
        updates.push({ key: 'articles_per_source', value: String(count) });
      }

      if (updates.length === 0) {
        res.status(400).json({ success: false, message: 'لا توجد قيم للتحديث' });
        return;
      }

      const results = await Promise.all(
        updates.map(({ key, value }) => SystemSettingsService.set(key, value))
      );

      console.log(`⚙️  تم تحديث ${updates.length} إعداد دفعة واحدة`);

      // 🔄 إعادة تشغيل الـ Scheduler تلقائياً إذا تغيّر الـ interval
      const intervalChanged = updates.some(u => u.key === 'scheduler_interval_minutes');
      if (intervalChanged && schedulerService.getStatus().isRunning) {
        console.log('🔄 إعادة تشغيل الـ Scheduler لتطبيق الـ interval الجديد...');
        await schedulerService.restart();
        console.log('✅ تم إعادة تشغيل الـ Scheduler بنجاح');
      }

      res.status(200).json({
        success: true,
        message: `تم تحديث ${updates.length} إعداد`,
        data: results,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تحديث الإعدادات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default SystemSettingsController;
