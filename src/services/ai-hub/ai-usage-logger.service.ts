/**
 * AI Usage Logger Service
 * خدمة تسجيل استخدام AI Hub
 */

import { query } from '../../config/database';

export type AIFeature = 'chat' | 'tts' | 'stt' | 'ideas' | 'audio_extraction' | 'text_tools' | 'video_to_text';
export type ResponseStatus = 'success' | 'error' | 'rate_limited';

export interface AIUsageLogData {
  userIdentifier: string;
  userAgent?: string;
  feature: AIFeature;
  action: string;
  endpoint: string;
  requestData?: any;
  responseStatus: ResponseStatus;
  responseData?: any;
  durationMs?: number;
  tokensUsed?: number;
  audioDurationSec?: number;
}

export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  rateLimitedRequests: number;
  uniqueUsers: number;
  avgDurationMs: number;
  totalTokensUsed: number;
}

export interface UserUsageStats {
  userIdentifier: string;
  feature: AIFeature;
  totalRequests: number;
  successfulRequests: number;
  totalTokensUsed: number;
  avgDurationMs: number;
  firstUsed: Date;
  lastUsed: Date;
}

/**
 * تسجيل استخدام AI
 */
export async function logAIUsage(data: AIUsageLogData): Promise<void> {
  try {
    const sql = `
      INSERT INTO ai_usage_logs (
        user_identifier,
        user_agent,
        feature,
        action,
        endpoint,
        request_data,
        response_status,
        response_data,
        duration_ms,
        tokens_used,
        audio_duration_sec
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await query(sql, [
      data.userIdentifier,
      data.userAgent || null,
      data.feature,
      data.action,
      data.endpoint,
      data.requestData ? JSON.stringify(data.requestData) : null,
      data.responseStatus,
      data.responseData ? JSON.stringify(data.responseData) : null,
      data.durationMs || null,
      data.tokensUsed || null,
      data.audioDurationSec || null,
    ]);

    console.log(`📊 [AI Logger] Logged ${data.feature}/${data.action} for user ${data.userIdentifier}`);
  } catch (error) {
    // Don't throw - logging should not break the main flow
    console.error('❌ [AI Logger] Failed to log usage:', error);
  }
}

/**
 * الحصول على إحصائيات يومية
 */
export async function getDailyStats(
  startDate?: Date,
  endDate?: Date,
  feature?: AIFeature
): Promise<AIUsageStats[]> {
  try {
    let sql = `
      SELECT 
        DATE(created_at) as date,
        feature,
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_identifier) as unique_users,
        COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_requests,
        COUNT(CASE WHEN response_status = 'error' THEN 1 END) as failed_requests,
        COUNT(CASE WHEN response_status = 'rate_limited' THEN 1 END) as rate_limited_requests,
        ROUND(AVG(duration_ms)) as avg_duration_ms,
        COALESCE(SUM(tokens_used), 0) as total_tokens_used
      FROM ai_usage_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (feature) {
      sql += ` AND feature = $${paramIndex}`;
      params.push(feature);
      paramIndex++;
    }

    sql += ` GROUP BY DATE(created_at), feature ORDER BY date DESC, feature`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ [AI Logger] Failed to get daily stats:', error);
    throw error;
  }
}

/**
 * الحصول على إحصائيات المستخدم
 */
export async function getUserStats(
  userIdentifier?: string,
  feature?: AIFeature
): Promise<UserUsageStats[]> {
  try {
    let sql = `
      SELECT 
        user_identifier,
        feature,
        COUNT(*) as total_requests,
        COUNT(CASE WHEN response_status = 'success' THEN 1 END) as successful_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens_used,
        ROUND(AVG(duration_ms)) as avg_duration_ms,
        MIN(created_at) as first_used,
        MAX(created_at) as last_used
      FROM ai_usage_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (userIdentifier) {
      sql += ` AND user_identifier = $${paramIndex}`;
      params.push(userIdentifier);
      paramIndex++;
    }

    if (feature) {
      sql += ` AND feature = $${paramIndex}`;
      params.push(feature);
      paramIndex++;
    }

    sql += ` GROUP BY user_identifier, feature ORDER BY total_requests DESC`;

    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('❌ [AI Logger] Failed to get user stats:', error);
    throw error;
  }
}

/**
 * الحصول على إحصائيات عامة
 */
export async function getOverallStats(
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRequests: number;
  uniqueUsers: number;
  byFeature: Record<AIFeature, number>;
  byStatus: Record<ResponseStatus, number>;
}> {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_identifier) as unique_users,
        feature,
        response_status
      FROM ai_usage_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += ` GROUP BY feature, response_status`;

    const result = await query(sql, params);

    // Aggregate results
    const byFeature: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let totalRequests = 0;
    let uniqueUsers = 0;

    for (const row of result.rows) {
      totalRequests += parseInt(row.total_requests);
      uniqueUsers = Math.max(uniqueUsers, parseInt(row.unique_users));
      
      byFeature[row.feature] = (byFeature[row.feature] || 0) + parseInt(row.total_requests);
      byStatus[row.response_status] = (byStatus[row.response_status] || 0) + parseInt(row.total_requests);
    }

    return {
      totalRequests,
      uniqueUsers,
      byFeature: byFeature as Record<AIFeature, number>,
      byStatus: byStatus as Record<ResponseStatus, number>,
    };
  } catch (error) {
    console.error('❌ [AI Logger] Failed to get overall stats:', error);
    throw error;
  }
}

/**
 * الحصول على أكثر المستخدمين نشاطاً
 */
export async function getTopUsers(limit: number = 10): Promise<{
  userIdentifier: string;
  totalRequests: number;
  totalTokensUsed: number;
  features: string[];
}[]> {
  try {
    const sql = `
      SELECT 
        user_identifier,
        COUNT(*) as total_requests,
        COALESCE(SUM(tokens_used), 0) as total_tokens_used,
        ARRAY_AGG(DISTINCT feature) as features
      FROM ai_usage_logs
      GROUP BY user_identifier
      ORDER BY total_requests DESC
      LIMIT $1
    `;

    const result = await query(sql, [limit]);
    return result.rows;
  } catch (error) {
    console.error('❌ [AI Logger] Failed to get top users:', error);
    throw error;
  }
}

/**
 * حذف السجلات القديمة (للصيانة)
 */
export async function cleanupOldLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const sql = `
      DELETE FROM ai_usage_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
    `;

    const result = await query(sql);
    const deletedCount = result.rowCount || 0;
    
    console.log(`🧹 [AI Logger] Cleaned up ${deletedCount} old logs (older than ${daysToKeep} days)`);
    return deletedCount;
  } catch (error) {
    console.error('❌ [AI Logger] Failed to cleanup old logs:', error);
    throw error;
  }
}
