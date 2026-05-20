/**
 * Publishing Routes (v2)
 * مسارات نظام النشر المتعدد المنصات
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { PublishingController } from '../../controllers/publishing/publishing.controller';

const router = Router();

// المصادقة مطلوبة لجميع المسارات
router.use(authenticate);

// ── Publishing Actions ──────────────────────────────────────────────────────
router.post('/publish', PublishingController.publish);
router.post('/set-status', PublishingController.setArticleStatus);

// ── Retry & Dead Letter ─────────────────────────────────────────────────────
router.post('/retry', PublishingController.retryFailed);
router.get('/dead-letter', PublishingController.getDeadLetter);
router.post('/cleanup', PublishingController.cleanupStale);

// ── Article Status ──────────────────────────────────────────────────────────
router.get('/status/:articleId', PublishingController.getArticleStatus);

// ── Publishing Logs ─────────────────────────────────────────────────────────
router.get('/logs', PublishingController.getLogs);
router.get('/logs/:articleId', PublishingController.getArticleLogs);

// ── Platforms & Constraints ─────────────────────────────────────────────────
router.get('/platforms', PublishingController.getPlatforms);
router.get('/constraints', PublishingController.getConstraints);

// ── Platform Configs CRUD ───────────────────────────────────────────────────
router.get('/configs', PublishingController.getConfigs);
router.get('/configs/:id', PublishingController.getConfig);
router.post('/configs', PublishingController.createConfig);
router.patch('/configs/:id', PublishingController.updateConfig);
router.delete('/configs/:id', PublishingController.deleteConfig);
router.post('/configs/:id/toggle', PublishingController.toggleConfig);
router.post('/configs/:id/validate', PublishingController.validateConfig);

// ── Archive ─────────────────────────────────────────────────────────────────
router.get('/archive', PublishingController.getArchive);
router.post('/archive/:articleId', PublishingController.archiveArticle);

// ── Statistics ──────────────────────────────────────────────────────────────
router.get('/stats', PublishingController.getStats);

export default router;
