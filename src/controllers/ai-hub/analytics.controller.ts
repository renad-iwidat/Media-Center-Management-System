/**
 * AI Analytics Controller
 * عرض إحصائيات استخدام AI Hub
 */

import { Request, Response } from 'express';
import {
  getDailyStats,
  getUserStats,
  getOverallStats,
  getTopUsers,
  AIFeature,
} from '../../services/ai-hub/ai-usage-logger.service';
import { getClientIdentifier } from '../../services/ai-hub/rate-limiter.service';

/**
 * GET /api/ai-hub/analytics/overview
 * إحصائيات عامة
 */
export async function getAnalyticsOverview(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const stats = await getOverallStats(start, end);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting overview:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics',
    });
  }
}

/**
 * GET /api/ai-hub/analytics/daily
 * إحصائيات يومية
 */
export async function getDailyAnalytics(req: Request, res: Response) {
  try {
    const { startDate, endDate, feature } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;
    const feat = feature as AIFeature | undefined;

    const stats = await getDailyStats(start, end, feat);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting daily stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get daily analytics',
    });
  }
}

/**
 * GET /api/ai-hub/analytics/users
 * إحصائيات المستخدمين
 */
export async function getUserAnalytics(req: Request, res: Response) {
  try {
    const { userIdentifier, feature } = req.query;

    const userId = userIdentifier as string | undefined;
    const feat = feature as AIFeature | undefined;

    const stats = await getUserStats(userId, feat);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting user stats:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user analytics',
    });
  }
}

/**
 * GET /api/ai-hub/analytics/top-users
 * أكثر المستخدمين نشاطاً
 */
export async function getTopUsersAnalytics(req: Request, res: Response) {
  try {
    const { limit = '10' } = req.query;

    const topUsers = await getTopUsers(parseInt(limit as string));

    res.json({
      success: true,
      data: topUsers,
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting top users:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get top users',
    });
  }
}

/**
 * GET /api/ai-hub/analytics/my-usage
 * استخدام المستخدم الحالي
 */
export async function getMyUsage(req: Request, res: Response) {
  try {
    const userIdentifier = getClientIdentifier(req);
    const { feature } = req.query;

    const feat = feature as AIFeature | undefined;
    const stats = await getUserStats(userIdentifier, feat);

    // Calculate totals
    const totals = stats.reduce(
      (acc, stat) => ({
        totalRequests: acc.totalRequests + stat.totalRequests,
        successfulRequests: acc.successfulRequests + stat.successfulRequests,
        totalTokensUsed: acc.totalTokensUsed + stat.totalTokensUsed,
      }),
      { totalRequests: 0, successfulRequests: 0, totalTokensUsed: 0 }
    );

    res.json({
      success: true,
      data: {
        userIdentifier,
        totals,
        byFeature: stats,
      },
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting my usage:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage stats',
    });
  }
}

/**
 * GET /api/ai-hub/analytics/feature/:feature
 * إحصائيات ميزة معينة
 */
export async function getFeatureAnalytics(req: Request, res: Response) {
  try {
    const { feature } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : undefined;
    const end = endDate ? new Date(endDate as string) : undefined;

    const [dailyStats, userStats] = await Promise.all([
      getDailyStats(start, end, feature as AIFeature),
      getUserStats(undefined, feature as AIFeature),
    ]);

    // Calculate totals
    const totals = dailyStats.reduce(
      (acc, stat: any) => ({
        totalRequests: acc.totalRequests + (stat.total_requests || stat.totalRequests || 0),
        uniqueUsers: Math.max(acc.uniqueUsers, stat.unique_users || stat.uniqueUsers || 0),
        successfulRequests: acc.successfulRequests + (stat.successful_requests || stat.successfulRequests || 0),
        failedRequests: acc.failedRequests + (stat.failed_requests || stat.failedRequests || 0),
        totalTokensUsed: acc.totalTokensUsed + (stat.total_tokens_used || stat.totalTokensUsed || 0),
      }),
      {
        totalRequests: 0,
        uniqueUsers: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokensUsed: 0,
      }
    );

    res.json({
      success: true,
      data: {
        feature,
        totals,
        dailyStats,
        topUsers: userStats.slice(0, 10),
      },
    });
  } catch (error) {
    console.error('❌ [Analytics] Error getting feature analytics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get feature analytics',
    });
  }
}
