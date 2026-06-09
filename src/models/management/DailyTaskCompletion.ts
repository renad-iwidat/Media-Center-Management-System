import pool from '../../config/database';
import { DailyChecklistItem, DailyTaskCompletion } from '../../types/management';

/**
 * DailyTaskCompletionModel — سجلات الإنجاز اليومي + اشتقاق قائمة التحقق.
 * لا يُنشأ صف إلا عند وضع علامة فعلية (لا صفوف للأيام غير المُعلَّمة).
 */
export class DailyTaskCompletionModel {
  /**
   * اشتقاق قائمة التحقق لموظف في يوم تشغيلي محدد:
   * القوالب المُفعّلة للموظف النشط ⋈ سجلات إنجاز ذلك اليوم.
   * غياب السجل ⇒ "غير مُنجز".
   */
  static async getChecklist(userId: bigint, businessDay: string): Promise<DailyChecklistItem[]> {
    const result = await pool.query(
      `SELECT
         t.id AS template_id,
         t.title,
         t.sequence_order,
         COALESCE(c.is_completed, false) AS is_completed,
         c.marked_at
       FROM daily_task_templates t
       INNER JOIN users u ON u.id = t.assigned_to
       LEFT JOIN daily_task_completions c
         ON c.template_id = t.id AND c.business_day = $2
       WHERE t.assigned_to = $1
         AND t.is_active = true
         AND t.deleted_at IS NULL
         AND u.is_active = true
       ORDER BY t.sequence_order ASC, t.id ASC`,
      [userId, businessDay]
    );
    return result.rows.map((r: any) => ({
      template_id: r.template_id,
      title: r.title,
      sequence_order: r.sequence_order,
      is_completed: r.is_completed,
      marked_at: r.marked_at || null,
    }));
  }

  /**
   * UPSERT لحالة إنجاز (قالب × يوم) — idempotent عبر UNIQUE(template_id, business_day).
   */
  static async upsertCompletion(
    templateId: bigint,
    businessDay: string,
    isCompleted: boolean,
    markedBy: bigint
  ): Promise<DailyTaskCompletion> {
    const result = await pool.query(
      `INSERT INTO daily_task_completions (template_id, business_day, is_completed, marked_by, marked_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (template_id, business_day) DO UPDATE SET
         is_completed = EXCLUDED.is_completed,
         marked_by = EXCLUDED.marked_by,
         marked_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [templateId, businessDay, isCompleted, markedBy]
    );
    return result.rows[0];
  }

  /**
   * جلب سجل إنجاز قالب في يوم محدد (إن وُجد).
   */
  static async findCompletion(templateId: bigint, businessDay: string): Promise<DailyTaskCompletion | null> {
    const result = await pool.query(
      'SELECT * FROM daily_task_completions WHERE template_id = $1 AND business_day = $2',
      [templateId, businessDay]
    );
    return result.rows[0] || null;
  }

  /**
   * إجمالي عناصر المهام اليومية المُنجزة للموظف عبر كل الأيام (البسط في KPI التراكمي).
   * يُحتسب فقط لقوالب نشطة غير محذوفة لضمان اتساقه مع المقام (completed ≤ expected).
   */
  static async countCompletedForUser(userId: bigint): Promise<number> {
    const result = await pool.query(
      `SELECT COUNT(*) AS count
       FROM daily_task_completions c
       INNER JOIN daily_task_templates t ON t.id = c.template_id
       WHERE t.assigned_to = $1
         AND t.is_active = true
         AND t.deleted_at IS NULL
         AND c.is_completed = true`,
      [userId]
    );
    return parseInt(result.rows[0].count, 10) || 0;
  }

  /**
   * إجمالي العناصر المتوقَّعة للموظف (المقام في KPI التراكمي):
   * مجموع الأيام التشغيلية المنقضية منذ إنشاء كل قالب نشط حتى اليوم (شامل اليومين).
   * عدد مُشتق — لا يعتمد على صفوف مخزّنة للأيام غير المُعلَّمة.
   */
  static async countExpectedItemsForUser(userId: bigint): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(SUM(
         (CURRENT_DATE - (t.created_at AT TIME ZONE 'UTC')::date) + 1
       ), 0) AS expected
       FROM daily_task_templates t
       INNER JOIN users u ON u.id = t.assigned_to
       WHERE t.assigned_to = $1
         AND t.is_active = true
         AND t.deleted_at IS NULL
         AND u.is_active = true`,
      [userId]
    );
    return parseInt(result.rows[0].expected, 10) || 0;
  }
}
