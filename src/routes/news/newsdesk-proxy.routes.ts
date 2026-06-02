/**
 * NewsDesk Proxy Routes
 * مسارات الربط مع NewsDesk API الخارجي
 * 
 * Prefix: /api/newsdesk
 */

import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { NewsDeskProxyController } from '../../controllers/news/newsdesk-proxy.controller';

const router = Router();

// المصادقة على جميع المسارات
router.use(authenticate);

// ── Health ────────────────────────────────────────────────────────────────
router.get('/health', NewsDeskProxyController.health);

// ── Sources CRUD ──────────────────────────────────────────────────────────
router.get('/sources', NewsDeskProxyController.listSources);
router.get('/sources/:slug', NewsDeskProxyController.getSource);
router.post('/sources', NewsDeskProxyController.createSource);
router.patch('/sources/:slug', NewsDeskProxyController.updateSource);
router.delete('/sources/:slug', NewsDeskProxyController.deleteSource);
router.post('/sources/:slug/activate', NewsDeskProxyController.activateSource);
router.post('/sources/:slug/deactivate', NewsDeskProxyController.deactivateSource);

// ── Articles ──────────────────────────────────────────────────────────────
router.get('/articles', NewsDeskProxyController.listArticles);
router.get('/articles/:id', NewsDeskProxyController.getArticle);
router.get('/articles/by-source/:slug', NewsDeskProxyController.articlesBySource);
router.get('/articles/by-category/:slug', NewsDeskProxyController.articlesByCategory);

// ── Scraper Control ───────────────────────────────────────────────────────
router.post('/scraper/fetch', NewsDeskProxyController.triggerFetch);
router.post('/scraper/fetch-async', NewsDeskProxyController.triggerFetchAsync);

// ── Scheduler (Remote) ────────────────────────────────────────────────────
router.get('/scheduler/status', NewsDeskProxyController.getRemoteSchedulerStatus);
router.post('/scheduler/start', NewsDeskProxyController.startRemoteScheduler);
router.post('/scheduler/stop', NewsDeskProxyController.stopRemoteScheduler);

// ── Categories & Geo Scopes ───────────────────────────────────────────────
router.get('/categories', NewsDeskProxyController.listCategories);
router.get('/geographic-scopes', NewsDeskProxyController.listGeoScopes);

// ── Admin ─────────────────────────────────────────────────────────────────
router.get('/admin/stats', NewsDeskProxyController.adminStats);
router.get('/admin/settings', NewsDeskProxyController.adminSettings);
router.patch('/admin/settings', NewsDeskProxyController.updateAdminSettings);
router.get('/admin/logs', NewsDeskProxyController.adminLogs);
router.post('/admin/classifier/run', NewsDeskProxyController.runClassifier);
router.get('/admin/classifier/stats', NewsDeskProxyController.classifierStats);

// ── Media Units (من الـ API الخارجي) ─────────────────────────────────────
router.get('/media-units', NewsDeskProxyController.listMediaUnits);
router.get('/media-units/:slug', NewsDeskProxyController.getMediaUnit);

// ── Sync (مزامنة من الـ API الخارجي إلى الداتابيس المحلي) ────────────────
router.post('/sync/all', NewsDeskProxyController.syncAll);
router.post('/sync/sources', NewsDeskProxyController.syncSources);

export default router;
