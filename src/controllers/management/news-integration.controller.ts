/**
 * News Integration Controller
 * تحكم في تكامل نظام الأخبار مع نظام الإدارة
 */

import { Request, Response } from 'express';
import { query } from '../../config/database';

/**
 * GET /api/management/news/stats/user/:userId
 * جلب إحصائيات أداء موظف في نظام الأخبار
 */
export async function getUserNewsStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = parseInt(req.params.userId);
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    if (isNaN(userId)) {
      res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صحيح',
      });
      return;
    }

    // إحصائيات الموافقة على الأخبار
    const approvalStats = await query(`
      SELECT 
        COUNT(*) as total_approved,
        COUNT(CASE WHEN pi.published_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_approved
      FROM published_items pi
      WHERE pi.approved_by = $1
    `, [userId]);

    // إحصائيات رفض الأخبار
    const rejectionStats = await query(`
      SELECT 
        COUNT(*) as total_rejected,
        COUNT(CASE WHEN eq.updated_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_rejected
      FROM editorial_queue eq
      WHERE eq.user_id = $1 AND eq.status = 'rejected'
    `, [userId]);

    // إحصائيات استخدام الذكاء الاصطناعي
    const aiStats = await query(`
      SELECT 
        feature,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_usage,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_usage
      FROM ai_usage_logs
      WHERE user_identifier = $1 AND user_identifier ~ '^[0-9]+$'
      GROUP BY feature
      ORDER BY usage_count DESC
    `, [String(userId)]);

    // إحصائيات تحديث المحتوى
    const contentUpdateStats = await query(`
      SELECT 
        COUNT(*) as total_updates,
        COUNT(CASE WHEN eq.updated_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_updates
      FROM editorial_queue eq
      WHERE eq.user_id = $1 AND eq.status IN ('in_review', 'approved')
    `, [userId]);

    const stats = {
      userId,
      period: `${days} days`,
      approvals: {
        total: parseInt(approvalStats.rows[0]?.total_approved || '0'),
        recent: parseInt(approvalStats.rows[0]?.recent_approved || '0'),
      },
      rejections: {
        total: parseInt(rejectionStats.rows[0]?.total_rejected || '0'),
        recent: parseInt(rejectionStats.rows[0]?.recent_rejected || '0'),
      },
      contentUpdates: {
        total: parseInt(contentUpdateStats.rows[0]?.total_updates || '0'),
        recent: parseInt(contentUpdateStats.rows[0]?.recent_updates || '0'),
      },
      aiUsage: aiStats.rows.map((row: any) => ({
        feature: row.feature,
        totalUsage: parseInt(row.usage_count),
        successfulUsage: parseInt(row.successful_usage),
        recentUsage: parseInt(row.recent_usage),
        successRate: row.usage_count > 0 ? 
          Math.round((parseInt(row.successful_usage) / parseInt(row.usage_count)) * 100) : 0,
      })),
      totalAiUsage: aiStats.rows.reduce((sum: number, row: any) => sum + parseInt(row.usage_count), 0),
      recentAiUsage: aiStats.rows.reduce((sum: number, row: any) => sum + parseInt(row.recent_usage), 0),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات المستخدم:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات المستخدم',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/management/news/stats/overview
 * جلب إحصائيات عامة لنظام الأخبار
 */
export async function getNewsOverviewStats(req: Request, res: Response): Promise<void> {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;

    // إحصائيات المنشورات (كل published_items بغض النظر عن approved_by)
    const publishedStats = await query(`
      SELECT 
        COUNT(*) as total_published,
        COUNT(CASE WHEN published_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_published,
        COUNT(DISTINCT media_unit_id) as active_units
      FROM published_items
    `);

    // إحصائيات النشر حسب الوحدة الإعلامية
    const publishedByUnit = await query(`
      SELECT 
        mu.name as unit_name,
        COUNT(pi.id) as count,
        COUNT(CASE WHEN pi.published_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_count,
        MAX(pi.published_at) as last_published
      FROM published_items pi
      LEFT JOIN media_units mu ON mu.id = pi.media_unit_id
      GROUP BY mu.name
      ORDER BY count DESC
    `);

    // إحصائيات النشر الخارجي (auto_publish_log)
    const externalPublishStats = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_count
      FROM auto_publish_log
    `);

    // إحصائيات الطابور
    const queueStats = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM editorial_queue
      GROUP BY status
    `);

    // إحصائيات الذكاء الاصطناعي
    const aiOverallStats = await query(`
      SELECT 
        COUNT(*) as total_usage,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '${days} days' THEN 1 END) as recent_usage,
        COUNT(DISTINCT user_identifier) as unique_users,
        COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_usage
      FROM ai_usage_logs
      WHERE user_identifier ~ '^[0-9]+$'
    `);

    // إحصائيات الذكاء الاصطناعي حسب النوع
    const aiByFeature = await query(`
      SELECT 
        feature,
        COUNT(*) as usage_count,
        COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_count
      FROM ai_usage_logs
      WHERE user_identifier ~ '^[0-9]+$'
      GROUP BY feature
      ORDER BY usage_count DESC
    `);

    // أكثر المستخدمين نشاطاً
    const topUsers = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(pi.id) as approved_count,
        COUNT(ai.id) as ai_usage_count
      FROM users u
      LEFT JOIN published_items pi ON u.id = pi.approved_by
      LEFT JOIN ai_usage_logs ai ON CAST(u.id AS TEXT) = ai.user_identifier
      WHERE pi.id IS NOT NULL OR ai.id IS NOT NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY (COUNT(pi.id) + COUNT(ai.id)) DESC
      LIMIT 10
    `);

    const stats = {
      period: `${days} days`,
      published: {
        total: parseInt(publishedStats.rows[0]?.total_published || '0'),
        recent: parseInt(publishedStats.rows[0]?.recent_published || '0'),
        activeUnits: parseInt(publishedStats.rows[0]?.active_units || '0'),
        byUnit: publishedByUnit.rows.map((r: any) => ({
          unit: r.unit_name,
          count: parseInt(r.count),
          recentCount: parseInt(r.recent_count),
          lastPublished: r.last_published,
        })),
        external: {
          total: parseInt(externalPublishStats.rows[0]?.total || '0'),
          success: parseInt(externalPublishStats.rows[0]?.success_count || '0'),
          failed: parseInt(externalPublishStats.rows[0]?.failed_count || '0'),
          recent: parseInt(externalPublishStats.rows[0]?.recent_count || '0'),
        },
      },
      queue: queueStats.rows.reduce((acc: Record<string, number>, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {} as Record<string, number>),
      aiUsage: {
        total: parseInt(aiOverallStats.rows[0]?.total_usage || '0'),
        recent: parseInt(aiOverallStats.rows[0]?.recent_usage || '0'),
        uniqueUsers: parseInt(aiOverallStats.rows[0]?.unique_users || '0'),
        successful: parseInt(aiOverallStats.rows[0]?.successful_usage || '0'),
        successRate: aiOverallStats.rows[0]?.total_usage > 0 ? 
          Math.round((parseInt(aiOverallStats.rows[0].successful_usage) / parseInt(aiOverallStats.rows[0].total_usage)) * 100) : 0,
      },
      aiByFeature: aiByFeature.rows.map((row: any) => ({
        feature: row.feature,
        usage: parseInt(row.usage_count),
        successful: parseInt(row.successful_count),
        successRate: row.usage_count > 0 ? 
          Math.round((parseInt(row.successful_count) / parseInt(row.usage_count)) * 100) : 0,
      })),
      topUsers: topUsers.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        approvedCount: parseInt(row.approved_count),
        aiUsageCount: parseInt(row.ai_usage_count),
        totalActivity: parseInt(row.approved_count) + parseInt(row.ai_usage_count),
      })),
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('❌ خطأ في جلب الإحصائيات العامة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات العامة',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * GET /api/management/news/tasks/:taskId/items
 * جلب جميع المنشورات المرتبطة بمهمة معينة
 */
export async function getTaskNewsItems(req: Request, res: Response): Promise<void> {
  try {
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      res.status(400).json({
        success: false,
        message: 'معرف المهمة غير صحيح',
      });
      return;
    }

    // جلب المنشورات
    const published = await query(`
      SELECT 
        pi.*,
        mu.name as media_unit_name,
        u.name as approved_by_name
      FROM published_items pi
      LEFT JOIN media_units mu ON pi.media_unit_id = mu.id
      LEFT JOIN users u ON pi.approved_by = u.id
      WHERE pi.task_id = $1
      ORDER BY pi.published_at DESC
    `, [taskId]);

    // جلب عناصر الطابور
    const queue = await query(`
      SELECT 
        eq.*,
        mu.name as media_unit_name,
        u.name as user_name,
        rd.title,
        rd.content
      FROM editorial_queue eq
      LEFT JOIN media_units mu ON eq.media_unit_id = mu.id
      LEFT JOIN users u ON eq.user_id = u.id
      LEFT JOIN raw_data rd ON eq.raw_data_id = rd.id
      WHERE eq.task_id = $1
      ORDER BY eq.updated_at DESC
    `, [taskId]);

    // جلب استخدامات الذكاء الاصطناعي المرتبطة بالمهمة
    const aiUsage = await query(`
      SELECT 
        ai.*,
        u.name as user_name
      FROM ai_usage_logs ai
      LEFT JOIN users u ON CAST(u.id AS TEXT) = ai.user_identifier
      WHERE ai.user_identifier IN (
        SELECT DISTINCT CAST(user_id AS TEXT) FROM editorial_queue WHERE task_id = $1 AND user_id IS NOT NULL
        UNION
        SELECT DISTINCT CAST(approved_by AS TEXT) FROM published_items WHERE task_id = $1 AND approved_by IS NOT NULL
      )
      AND ai.created_at >= (
        SELECT COALESCE(MIN(created_at), NOW() - INTERVAL '1 day') 
        FROM editorial_queue 
        WHERE task_id = $1
      )
      ORDER BY ai.created_at DESC
    `, [taskId]);

    res.status(200).json({
      success: true,
      data: {
        taskId,
        published: published.rows,
        queue: queue.rows,
        aiUsage: aiUsage.rows,
        summary: {
          publishedCount: published.rows.length,
          queueCount: queue.rows.length,
          aiUsageCount: aiUsage.rows.length,
        },
      },
    });
  } catch (error) {
    console.error('❌ خطأ في جلب عناصر المهمة:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب عناصر المهمة',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}