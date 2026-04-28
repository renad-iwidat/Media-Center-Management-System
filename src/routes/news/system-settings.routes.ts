/**
 * System Settings Routes
 * مسارات إعدادات النظام
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { SystemSettingsController } from '../../controllers/news/system-settings.controller';

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

// GET /api/settings — جميع الإعدادات
router.get('/', SystemSettingsController.getAll);

// GET /api/settings/toggles — حالة الـ toggles الثلاثة
router.get('/toggles', SystemSettingsController.getToggles);

// PATCH /api/settings/toggles/bulk — تحديث أكثر من toggle دفعة واحدة
router.patch('/toggles/bulk', SystemSettingsController.bulkUpdate);

// PATCH /api/settings/:key — تحديث إعداد واحد
router.patch('/:key', SystemSettingsController.update);

export default router;
