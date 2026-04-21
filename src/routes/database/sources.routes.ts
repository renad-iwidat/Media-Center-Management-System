/**
 * Sources Routes
 * مسارات المصادر
 */

import { Router } from 'express';
import { SourcesController } from '../../controllers/database/sources.controller';

const router = Router();

/**
 * GET /api/sources - الحصول على جميع المصادر
 */
router.get('/', SourcesController.getAllSources);

/**
 * GET /api/sources/active - الحصول على المصادر النشطة
 */
router.get('/active', SourcesController.getActiveSources);

/**
 * GET /api/sources/fetch-info - الحصول على معلومات المصادر مع آخر وقت سحب
 */
router.get('/fetch-info/all', SourcesController.getSourcesWithFetchInfo);

/**
 * GET /api/sources/:id - الحصول على مصدر بالـ ID
 */
router.get('/:id', SourcesController.getSourceById);

/**
 * POST /api/sources - إنشاء مصدر جديد
 */
router.post('/', SourcesController.createSource);

/**
 * PUT /api/sources/:id - تحديث مصدر
 */
router.put('/:id', SourcesController.updateSource);

export default router;
