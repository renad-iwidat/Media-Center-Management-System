/**
 * Scheduler Controller
 * التحكم في جدولة السحب والتصنيف والفلو
 */

import { Request, Response } from 'express';
import { schedulerService } from '../../services/news/scheduler.service';

export class SchedulerController {
  /**
   * POST /api/scheduler/start
   * بدء الـ scheduler (السحب + التصنيف + الفلو كل X دقيقة)
   */
  static async start(req: Request, res: Response): Promise<void> {
    try {
      const intervalMinutes = req.body?.intervalMinutes || 15;
      await schedulerService.start(intervalMinutes);

      res.status(200).json({
        success: true,
        message: `✅ تم بدء الـ scheduler — كل ${intervalMinutes} دقيقة`,
        data: schedulerService.getStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في بدء الـ scheduler',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/scheduler/stop
   * إيقاف الـ scheduler
   */
  static async stop(req: Request, res: Response): Promise<void> {
    try {
      schedulerService.stop();

      res.status(200).json({
        success: true,
        message: '✅ تم إيقاف الـ scheduler',
        data: schedulerService.getStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إيقاف الـ scheduler',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/scheduler/restart
   * إعادة تشغيل الـ scheduler (لتطبيق التغييرات فوراً)
   */
  static async restart(req: Request, res: Response): Promise<void> {
    try {
      await schedulerService.restart();

      res.status(200).json({
        success: true,
        message: '✅ تم إعادة تشغيل الـ scheduler — التغييرات طُبّقت فوراً',
        data: schedulerService.getStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إعادة تشغيل الـ scheduler',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/scheduler/run-now
   * تشغيل دورة واحدة فوراً (بدون انتظار الـ interval)
   */
  static async runNow(req: Request, res: Response): Promise<void> {
    try {
      console.log('🚀 تشغيل دورة واحدة فوراً...');
      
      // استدعاء runJob بشكل مباشر (private method — بحتاج نعمل workaround)
      // الحل: نستخدم الـ scheduler status ونشغل الدورة يدوياً
      const status = schedulerService.getStatus();
      
      if (!status.isRunning) {
        res.status(400).json({
          success: false,
          message: 'الـ scheduler متوقف — شغّله أولاً بـ POST /api/scheduler/start',
        });
        return;
      }

      // بما أن runJob private، بنستخدم workaround: نوقف الـ scheduler ونشغله مرة ثانية
      // هاد بيشغل دورة واحدة فوراً
      schedulerService.stop();
      await schedulerService.start();

      res.status(200).json({
        success: true,
        message: '✅ تم تشغيل دورة واحدة فوراً',
        data: schedulerService.getStatus(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في تشغيل الدورة',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/scheduler/status
   * جلب حالة الـ scheduler
   */
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = schedulerService.getStatus();
      const info = schedulerService.getInfo();

      res.status(200).json({
        success: true,
        data: {
          ...status,
          info,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب حالة الـ scheduler',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default SchedulerController;
