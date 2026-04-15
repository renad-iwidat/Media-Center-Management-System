import { Router } from 'express';
import FlowController from '../../controllers/news/flow.controller';

/**
 * Flow Routes
 * مسارات فلو معالجة الأخبار
 */

const router = Router();

// معالجة الأخبار الجديدة
router.post('/process', FlowController.processNewArticles);

// طابور التحرير
router.get('/queue/pending', FlowController.getPendingQueue);
router.get('/queue/stats', FlowController.getQueueStats);
router.get('/queue/:id', FlowController.getQueueItem);
router.post('/queue/:id/approve', FlowController.approveQueueItem);
router.post('/queue/:id/reject', FlowController.rejectQueueItem);

// المحتوى المنشور
router.get('/published', FlowController.getPublished);
router.get('/published/stats', FlowController.getPublishedStats);
router.get('/published/:id', FlowController.getPublishedItem);
router.get('/published/category/:category', FlowController.getPublishedByCategory);

export default router;
