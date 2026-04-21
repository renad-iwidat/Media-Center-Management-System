/**
 * System Settings Routes
 * مسارات إعدادات النظام
 */

import { Router } from 'express';
import { SystemSettingsController } from '../../controllers/news/system-settings.controller';

const router = Router();

// GET /api/settings — جميع الإعدادات
router.get('/', SystemSettingsController.getAll);

// GET /api/settings/toggles — حالة الـ toggles الثلاثة
router.get('/toggles', SystemSettingsController.getToggles);

// PATCH /api/settings/toggles/bulk — تحديث أكثر من toggle دفعة واحدة
router.patch('/toggles/bulk', SystemSettingsController.bulkUpdate);

// PATCH /api/settings/:key — تحديث إعداد واحد
router.patch('/:key', SystemSettingsController.update);

export default router;
