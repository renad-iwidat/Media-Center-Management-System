/**
 * News Routes
 * مسارات الأخبار
 */

import { Router } from 'express';
import { NewsController } from '../../controllers/news/news.controller';

const router = Router();

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
