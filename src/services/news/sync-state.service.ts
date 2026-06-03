/**
 * Sync State Service
 * إدارة حالة المزامنة لكل Media Unit — يتتبع آخر وقت مزامنة ناجحة
 *
 * يُستخدم لتنفيذ Incremental Sync:
 * - تخزين last_sync_time لكل وحدة إعلامية
 * - حساب date_from بناءً على آخر مزامنة (بدلاً من "آخر ساعتين" الثابتة)
 * - تسجيل عمليات المزامنة (نجاح/فشل) في جدول sync_logs
 */

import { query } from '../../config/database';

export interface SyncState {
  media_unit_id: number;
  media_unit_slug: string;
  last_sync_at: Date | null;
  last_article_date: Date | null;
  articles_synced: number;
  total_synced: number;
  last_error: string | null;
}

export interface SyncLogEntry {
  id?: number;
  media_unit_id: number | null;
  sync_type: 'articles' | 'categories' | 'geo_scopes' | 'media_units' | 'sources' | 'full';
  status: 'started' | 'success' | 'partial' | 'failed';
  articles_fetched: number;
  articles_saved: number;
  articles_skipped: number;
  errors: string[];
  duration_ms: number;
  started_at: Date;
  completed_at?: Date;
}

class SyncStateService {
  /**
   * ضمان وجود جداول sync_state و sync_logs
   * يُستدعى مرة واحدة عند بدء التشغيل
   */
  async ensureTables(): Promise<void> {
    try {
      // جدول حالة المزامنة لكل وحدة إعلامية
      await query(`
        CREATE TABLE IF NOT EXISTS sync_state (
          id SERIAL PRIMARY KEY,
          media_unit_id INTEGER REFERENCES media_units(id) ON DELETE CASCADE,
          media_unit_slug VARCHAR(255) NOT NULL DEFAULT '',
          last_sync_at TIMESTAMP,
          last_article_date TIMESTAMP,
          articles_synced INTEGER DEFAULT 0,
          total_synced INTEGER DEFAULT 0,
          last_error TEXT,
          updated_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(media_unit_id)
        )
      `);

      // جدول سجلات المزامنة
      await query(`
        CREATE TABLE IF NOT EXISTS sync_logs (
          id SERIAL PRIMARY KEY,
          media_unit_id INTEGER REFERENCES media_units(id) ON DELETE SET NULL,
          sync_type VARCHAR(50) NOT NULL DEFAULT 'articles',
          status VARCHAR(20) NOT NULL DEFAULT 'started',
          articles_fetched INTEGER DEFAULT 0,
          articles_saved INTEGER DEFAULT 0,
          articles_skipped INTEGER DEFAULT 0,
          errors TEXT[] DEFAULT '{}',
          duration_ms INTEGER DEFAULT 0,
          started_at TIMESTAMP DEFAULT NOW(),
          completed_at TIMESTAMP
        )
      `);

      // Index للبحث السريع
      await query(`
        CREATE INDEX IF NOT EXISTS idx_sync_logs_media_unit ON sync_logs(media_unit_id);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
      `);
      await query(`
        CREATE INDEX IF NOT EXISTS idx_sync_state_slug ON sync_state(media_unit_slug);
      `);

      console.log('   ✅ جداول sync_state و sync_logs جاهزة');
    } catch (err) {
      // الجداول قد تكون موجودة مسبقاً — تجاهل الخطأ
      console.warn('   ⚠️ sync tables:', err instanceof Error ? err.message : err);
    }
  }

  /**
   * جلب حالة المزامنة لوحدة إعلامية
   */
  async getState(mediaUnitId: number): Promise<SyncState | null> {
    const result = await query(
      `SELECT * FROM sync_state WHERE media_unit_id = $1`,
      [mediaUnitId]
    );
    return result.rows[0] || null;
  }

  /**
   * جلب حالة المزامنة لكل الوحدات النشطة
   */
  async getAllStates(): Promise<SyncState[]> {
    const result = await query(
      `SELECT ss.*, mu.name as media_unit_name
       FROM sync_state ss
       JOIN media_units mu ON ss.media_unit_id = mu.id
       WHERE mu.is_active = true
       ORDER BY ss.last_sync_at DESC NULLS LAST`
    );
    return result.rows;
  }

  /**
   * تحديث حالة المزامنة بعد نجاح
   */
  async updateState(
    mediaUnitId: number,
    mediaUnitSlug: string,
    articlesSynced: number,
    lastArticleDate?: Date | null
  ): Promise<void> {
    await query(
      `INSERT INTO sync_state (media_unit_id, media_unit_slug, last_sync_at, last_article_date, articles_synced, total_synced, last_error, updated_at)
       VALUES ($1, $2, NOW(), $3, $4, $4, NULL, NOW())
       ON CONFLICT (media_unit_id) DO UPDATE SET
         media_unit_slug = $2,
         last_sync_at = NOW(),
         last_article_date = COALESCE($3, sync_state.last_article_date),
         articles_synced = $4,
         total_synced = sync_state.total_synced + $4,
         last_error = NULL,
         updated_at = NOW()`,
      [mediaUnitId, mediaUnitSlug, lastArticleDate || null, articlesSynced]
    );
  }

  /**
   * تسجيل خطأ في المزامنة
   */
  async recordError(mediaUnitId: number, error: string): Promise<void> {
    await query(
      `INSERT INTO sync_state (media_unit_id, last_error, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (media_unit_id) DO UPDATE SET
         last_error = $2,
         updated_at = NOW()`,
      [mediaUnitId, error]
    );
  }

  /**
   * حساب date_from لوحدة إعلامية بناءً على last_sync_at
   * Fallback: إذا ما في مزامنة سابقة → آخر 24 ساعة (بدلاً من ساعتين)
   */
  async getDateFromForUnit(mediaUnitId: number): Promise<string> {
    const state = await this.getState(mediaUnitId);

    if (state?.last_sync_at) {
      // نرجع ساعة قبل آخر مزامنة (overlap للأمان)
      const lastSync = new Date(state.last_sync_at);
      lastSync.setHours(lastSync.getHours() - 1);
      return lastSync.toISOString().split('T')[0];
    }

    // أول مزامنة — نجلب آخر 7 أيام (لضمان وجود أخبار)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return sevenDaysAgo.toISOString().split('T')[0];
  }

  // ══════════════════════════════════════════════════════════════════════
  // Sync Logs
  // ══════════════════════════════════════════════════════════════════════

  /**
   * بدء سجل مزامنة جديد
   */
  async startLog(mediaUnitId: number | null, syncType: SyncLogEntry['sync_type']): Promise<number> {
    const result = await query(
      `INSERT INTO sync_logs (media_unit_id, sync_type, status, started_at)
       VALUES ($1, $2, 'started', NOW())
       RETURNING id`,
      [mediaUnitId, syncType]
    );
    return result.rows[0].id;
  }

  /**
   * تحديث سجل المزامنة عند الانتهاء
   */
  async completeLog(
    logId: number,
    status: 'success' | 'partial' | 'failed',
    stats: {
      articles_fetched?: number;
      articles_saved?: number;
      articles_skipped?: number;
      errors?: string[];
      duration_ms?: number;
    }
  ): Promise<void> {
    await query(
      `UPDATE sync_logs SET
         status = $1,
         articles_fetched = $2,
         articles_saved = $3,
         articles_skipped = $4,
         errors = $5,
         duration_ms = $6,
         completed_at = NOW()
       WHERE id = $7`,
      [
        status,
        stats.articles_fetched || 0,
        stats.articles_saved || 0,
        stats.articles_skipped || 0,
        stats.errors || [],
        stats.duration_ms || 0,
        logId,
      ]
    );
  }

  /**
   * جلب آخر سجلات المزامنة
   */
  async getRecentLogs(limit: number = 50, mediaUnitId?: number): Promise<SyncLogEntry[]> {
    let sql = `SELECT sl.*, mu.name as media_unit_name
       FROM sync_logs sl
       LEFT JOIN media_units mu ON sl.media_unit_id = mu.id`;
    const params: any[] = [];

    if (mediaUnitId) {
      sql += ` WHERE sl.media_unit_id = $1`;
      params.push(mediaUnitId);
    }

    sql += ` ORDER BY sl.started_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await query(sql, params);
    return result.rows;
  }

  /**
   * حذف سجلات قديمة (أكثر من N يوم)
   */
  async cleanupOldLogs(daysToKeep: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM sync_logs WHERE started_at < NOW() - INTERVAL '1 day' * $1`,
      [daysToKeep]
    );
    return result.rowCount || 0;
  }

  /**
   * جلب إحصائيات المزامنة (آخر 24 ساعة)
   */
  async getSyncStats(): Promise<{
    total_runs: number;
    successful: number;
    failed: number;
    total_articles_synced: number;
    last_sync_at: string | null;
  }> {
    const result = await query(`
      SELECT
        COUNT(*) as total_runs,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed,
        COALESCE(SUM(articles_saved), 0) as total_articles_synced,
        MAX(completed_at)::TEXT as last_sync_at
      FROM sync_logs
      WHERE started_at > NOW() - INTERVAL '24 hours'
    `);
    return result.rows[0];
  }
}

export const syncStateService = new SyncStateService();
export default syncStateService;
