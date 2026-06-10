/**
 * News Integration Routes
 * مسارات تكامل نظام الأخبار مع نظام الإدارة
 */

import { Router } from 'express';
import { authenticate, requirePermission } from '../../middleware/auth';
import {
  getUserNewsStats,
  getNewsOverviewStats,
  getTaskNewsItems,
} from '../../controllers/management/news-integration.controller';

const router = Router();

// إضافة المصادقة على جميع routes
router.use(authenticate);

/**
 * GET /api/management/news/stats/user/:userId
 * جلب إحصائيات أداء موظف في نظام الأخبار
 * يتطلب صلاحية: view_employee_stats
 */
router.get('/stats/user/:userId', requirePermission('news.dashboard'), getUserNewsStats);

/**
 * GET /api/management/news/stats/overview
 * جلب إحصائيات عامة لنظام الأخبار
 * يتطلب صلاحية: news.dashboard
 */
router.get('/stats/overview', requirePermission('news.dashboard'), getNewsOverviewStats);

/**
 * GET /api/management/news/tasks/:taskId/items
 * جلب جميع المنشورات المرتبطة بمهمة معينة
 * يتطلب صلاحية: news.dashboard
 */
router.get('/tasks/:taskId/items', requirePermission('news.dashboard'), getTaskNewsItems);

export default router;