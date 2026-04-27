/**
 * AI Hub Analytics Routes
 * مسارات إحصائيات استخدام AI Hub
 */

import { Router } from 'express';
import {
  getAnalyticsOverview,
  getDailyAnalytics,
  getUserAnalytics,
  getTopUsersAnalytics,
  getMyUsage,
  getFeatureAnalytics,
} from '../../controllers/ai-hub/index';

const router = Router();

/**
 * @route   GET /api/ai-hub/analytics/overview
 * @desc    إحصائيات عامة لجميع الميزات
 * @query   startDate, endDate (optional)
 * @access  Public (يمكن تقييدها لاحقاً)
 */
router.get('/overview', getAnalyticsOverview);

/**
 * @route   GET /api/ai-hub/analytics/daily
 * @desc    إحصائيات يومية
 * @query   startDate, endDate, feature (optional)
 * @access  Public
 */
router.get('/daily', getDailyAnalytics);

/**
 * @route   GET /api/ai-hub/analytics/users
 * @desc    إحصائيات المستخدمين
 * @query   userIdentifier, feature (optional)
 * @access  Public
 */
router.get('/users', getUserAnalytics);

/**
 * @route   GET /api/ai-hub/analytics/top-users
 * @desc    أكثر المستخدمين نشاطاً
 * @query   limit (default: 10)
 * @access  Public
 */
router.get('/top-users', getTopUsersAnalytics);

/**
 * @route   GET /api/ai-hub/analytics/my-usage
 * @desc    استخدام المستخدم الحالي
 * @query   feature (optional)
 * @access  Public
 */
router.get('/my-usage', getMyUsage);

/**
 * @route   GET /api/ai-hub/analytics/feature/:feature
 * @desc    إحصائيات ميزة معينة
 * @param   feature - اسم الميزة (chat, tts, stt, ideas, etc.)
 * @query   startDate, endDate (optional)
 * @access  Public
 */
router.get('/feature/:feature', getFeatureAnalytics);

export default router;
