/**
 * News Routes
 * مسارات الأخبار
 */

import { Router } from 'express';
import { NewsController } from '../../controllers/news/news.controller';
import { classifyUnclassifiedArticles, getUnclassifiedArticles } from '../../controllers/news/classifier.controller';

const router = Router();

/**
 * GET /api/news/classifier/unclassified - الحصول على الأخبار بدون تصنيف
 */
router.get('/classifier/unclassified', getUnclassifiedArticles);

/**
 * POST /api/news/classifier/process - تصنيف الأخبار بدون تصنيف
 */
router.post('/classifier/process', classifyUnclassifiedArticles);

/**
 * GET /api/news - الحصول على جميع الأخبار
 */
router.get('/', NewsController.getAllNews);

/**
 * GET /api/news/:id - الحصول على خبر بالـ ID
 */
router.get('/:id', NewsController.getNewsById);

/**
 * GET /api/news/source/:sourceId - الحصول على أخبار من مصدر معين
 */
router.get('/source/:sourceId', NewsController.getNewsBySource);

/**
 * POST /api/news - إضافة خبر جديد
 */
router.post('/', NewsController.createNews);

export default router;
