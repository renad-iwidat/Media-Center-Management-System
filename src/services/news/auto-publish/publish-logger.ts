/**
 * Publish Logger
 * تسجيل عمليات النشر التلقائي واليدوي في قاعدة البيانات
 */

import { query } from '../../../config/database';

// ── Log Entry ────────────────────────────────────────────────────────────────

export interface LogEntry {
  targetId: number;
  rawDataId: number;
  status: 'success' | 'failed' | 'pending';
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  externalUrl?: string;
  externalId?: number;
  isManual?: boolean;
}

// ── Logger Class ─────────────────────────────────────────────────────────────

export class PublishLogger {

  /**
   * تسجيل عملية نشر (جديدة أو تحديث retry)
   */
  async log(entry: LogEntry): Promise<void> {
    try {
      const existing = await query(
        `SELECT id, retry_count FROM auto_publish_log
         WHERE target_id = $1 AND raw_data_id = $2
         ORDER BY created_at DESC LIMIT 1`,
        [entry.targetId, entry.rawDataId]
      );

      if (existing.rows.length > 0 && entry.status === 'failed') {
        // تحديث المحاولة الفاشلة (retry)
        await query(
          `UPDATE auto_publish_log
           SET status = $1, response_code = $2, response_body = $3,
               error_message = $4, retry_count = retry_count + 1, updated_at = NOW()
           WHERE id = $5`,
          [
            entry.status,
            entry.responseCode || null,
            entry.responseBody || null,
            entry.errorMessage || null,
            existing.rows[0].id,
          ]
        );
      } else {
        // إدخال سجل جديد
        await query(
          `INSERT INTO auto_publish_log
             (target_id, raw_data_id, status, response_code, response_body,
              error_message, external_url, external_id, is_manual)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            entry.targetId,
            entry.rawDataId,
            entry.status,
            entry.responseCode || null,
            entry.responseBody || null,
            entry.errorMessage || null,
            entry.externalUrl || null,
            entry.externalId || null,
            entry.isManual ?? false,
          ]
        );
      }
    } catch (err) {
      console.error('❌ خطأ في تسجيل عملية النشر:', err);
    }
  }

  /**
   * عدد الأخبار المنشورة تلقائياً اليوم لهدف معين
   */
  async getTodayAutoCount(targetId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as cnt FROM auto_publish_log
       WHERE target_id = $1
         AND status = 'success'
         AND is_manual = false
         AND published_at > NOW() - INTERVAL '24 hours'`,
      [targetId]
    );
    return parseInt(result.rows[0]?.cnt || '0', 10);
  }

  /**
   * جلب سجل النشر (مع فلترة اختيارية)
   */
  async getLog(options: { targetId?: number; limit?: number } = {}): Promise<any[]> {
    const { targetId, limit = 50 } = options;

    let sql = `
      SELECT apl.*, apl.external_url, apl.external_id,
             rd.title as article_title, apt.name as target_name, mu.name as media_unit_name
      FROM auto_publish_log apl
      JOIN auto_publish_targets apt ON apt.id = apl.target_id
      JOIN media_units mu ON mu.id = apt.media_unit_id
      LEFT JOIN raw_data rd ON rd.id = apl.raw_data_id
    `;
    const params: any[] = [];

    if (targetId) {
      sql += ` WHERE apl.target_id = $1`;
      params.push(targetId);
    }

    sql += ` ORDER BY apl.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * جلب رابط النشر الخارجي لخبر معين
   */
  async getExternalLinks(rawDataId: number): Promise<{ targetName: string; externalUrl: string; publishedAt: string }[]> {
    const result = await query(
      `SELECT apt.name as target_name, apl.external_url, apl.published_at
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = $1 AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataId]
    );
    return result.rows.map((row: any) => ({
      targetName: row.target_name,
      externalUrl: row.external_url,
      publishedAt: row.published_at,
    }));
  }

  /**
   * جلب روابط النشر الخارجي لمجموعة أخبار (batch)
   */
  async getExternalLinksForArticles(rawDataIds: number[]): Promise<Record<number, { targetName: string; externalUrl: string }[]>> {
    if (rawDataIds.length === 0) return {};

    const result = await query(
      `SELECT apl.raw_data_id, apt.name as target_name, apl.external_url
       FROM auto_publish_log apl
       JOIN auto_publish_targets apt ON apt.id = apl.target_id
       WHERE apl.raw_data_id = ANY($1) AND apl.status = 'success' AND apl.external_url IS NOT NULL
       ORDER BY apl.published_at DESC`,
      [rawDataIds]
    );

    const map: Record<number, { targetName: string; externalUrl: string }[]> = {};
    for (const row of result.rows) {
      if (!map[row.raw_data_id]) map[row.raw_data_id] = [];
      map[row.raw_data_id].push({ targetName: row.target_name, externalUrl: row.external_url });
    }
    return map;
  }
}

export const publishLogger = new PublishLogger();
