/**
 * Scheduler Routes
 * مسارات التحكم في جدولة السحب والتصنيف والفلو
 */

import { Router } from 'express';
import SchedulerController from '../../controllers/news/scheduler.controller';

const router = Router();

// بدء الـ scheduler
router.post('/start', SchedulerController.start);

// إيقاف الـ scheduler
router.post('/stop', SchedulerController.stop);

// إعادة تشغيل الـ scheduler (لتطبيق التغييرات فوراً)
router.post('/restart', SchedulerController.restart);

// تشغيل دورة واحدة فوراً
router.post('/run-now', SchedulerController.runNow);

// جلب حالة الـ scheduler
router.get('/status', SchedulerController.getStatus);

export default router;
