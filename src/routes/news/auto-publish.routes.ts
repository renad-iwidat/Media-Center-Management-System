/**
 * Auto-Publish Routes
 * مسارات النشر التلقائي على المواقع الخارجية
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { AutoPublishController } from '../../controllers/news/auto-publish.controller';

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

// ── Status & Master Switch ──────────────────────────────────────────────────
// GET /api/auto-publish/status — حالة النشر التلقائي + إحصائيات
router.get('/status', AutoPublishController.getStatus);

// POST /api/auto-publish/toggle — تفعيل/إيقاف النشر التلقائي (master switch)
router.post('/toggle', AutoPublishController.toggleMaster);

// ── Targets CRUD ────────────────────────────────────────────────────────────
// GET /api/auto-publish/targets — جميع أهداف النشر (أو ?media_unit_id=X)
router.get('/targets', AutoPublishController.getTargets);

// GET /api/auto-publish/targets/:id — هدف واحد
router.get('/targets/:id', AutoPublishController.getTarget);

// POST /api/auto-publish/targets — إنشاء هدف جديد
router.post('/targets', AutoPublishController.createTarget);

// PATCH /api/auto-publish/targets/:id — تحديث هدف
router.patch('/targets/:id', AutoPublishController.updateTarget);

// DELETE /api/auto-publish/targets/:id — حذف هدف
router.delete('/targets/:id', AutoPublishController.deleteTarget);

// POST /api/auto-publish/targets/:id/toggle — تفعيل/إيقاف هدف معين
router.post('/targets/:id/toggle', AutoPublishController.toggleTarget);

// ── Manual Publish (للمحرر) + Run & Log ─────────────────────────────────────
// POST /api/auto-publish/publish-one — نشر خبر واحد يدوياً (المحرر يكبس زر)
router.post('/publish-one', AutoPublishController.publishOneManually);

// POST /api/auto-publish/run — تشغيل يدوي (كل الأخبار الأوتوماتيكية)
router.post('/run', AutoPublishController.runNow);

// POST /api/auto-publish/retry — إعادة محاولة الفاشل
router.post('/retry', AutoPublishController.retryFailed);

// GET /api/auto-publish/log — سجل النشر (?target_id=X&limit=50)
router.get('/log', AutoPublishController.getLog);

// GET /api/auto-publish/external-links/:rawDataId — روابط النشر الخارجي لخبر
router.get('/external-links/:rawDataId', AutoPublishController.getExternalLinks);

// POST /api/auto-publish/external-links/batch — روابط لمجموعة أخبار
router.post('/external-links/batch', AutoPublishController.getExternalLinksBatch);

export default router;
