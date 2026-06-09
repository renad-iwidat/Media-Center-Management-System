import { Router } from 'express';
import FlowController from '../../controllers/news/flow.controller';
import { authenticate } from '../../middleware/auth';

/**
 * Flow Routes
 * مسارات فلو معالجة الأخبار
 */

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

// معالجة الأخبار الجديدة
router.post('/process', FlowController.processNewArticles);

// ستوديو التحرير - endpoint جديد يدعم task_id
router.get('/editorial', FlowController.getEditorialStudio);

// طابور التحرير
router.get('/queue/pending', FlowController.getPendingQueue);
router.get('/queue/stats', FlowController.getQueueStats);
router.get('/queue/:id', FlowController.getQueueItem);
router.post('/queue/:id/approve', FlowController.approveQueueItem);
router.post('/queue/:id/reject', FlowController.rejectQueueItem);

// المحتوى المرشح للنشر (معتمد من المحرر - approved)
router.get('/ready-to-publish', FlowController.getReadyToPublish);

// المحتوى المنشور
router.get('/published', FlowController.getPublished);
router.get('/published/stats', FlowController.getPublishedStats);
router.get('/daily-stats', FlowController.getDailyStats);
router.get('/published/:id', FlowController.getPublishedItem);
router.get('/published/category/:category', FlowController.getPublishedByCategory);

export default router;
