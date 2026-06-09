import pool from '../../config/database';
import { DailyTaskTemplate } from '../../types/management';

/**
 * DailyTaskTemplateModel — قوالب المهام اليومية الثابتة.
 * منفصل تماماً عن جدول tasks. SQL خام بنمط TaskModel.
 */
export class DailyTaskTemplateModel {
  /**
   * إنشاء قالب مهمة يومية جديد.
   */
  static async create(template: {
    title: string;
    assigned_to: bigint;
    sequence_order: number;
    is_active: boolean;
    created_by: bigint;
  }): Promise<DailyTaskTemplate> {
    const result = await pool.query(
      `INSERT INTO daily_task_templates (title, assigned_to, sequence_order, is_active, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [template.title, template.assigned_to, template.sequence_order, template.is_active, template.created_by]
    );
    return result.rows[0];
  }

  /**
   * جلب قالب بالمعرّف (غير المحذوف منطقياً).
   */
  static async findById(id: bigint): Promise<DailyTaskTemplate | null> {
    const result = await pool.query(
      'SELECT * FROM daily_task_templates WHERE id = $1 AND deleted_at IS NULL',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * جلب قوالب موظف مرتبة بترتيب العرض.
   * activeOnly=true يستبعد المُعطّلة.
   */
  static async findByAssignee(
    userId: bigint,
    options: { activeOnly?: boolean } = {}
  ): Promise<DailyTaskTemplate[]> {
    const activeClause = options.activeOnly ? ' AND is_active = true' : '';
    const result = await pool.query(
      `SELECT * FROM daily_task_templates
       WHERE assigned_to = $1 AND deleted_at IS NULL${activeClause}
       ORDER BY sequence_order ASC, id ASC`,
      [userId]
    );
    return result.rows;
  }

  /**
   * أكبر ترتيب عرض حالي لقوالب موظف — لحساب الترتيب الافتراضي للقالب الجديد.
   */
  static async getMaxSequence(userId: bigint): Promise<number> {
    const result = await pool.query(
      `SELECT COALESCE(MAX(sequence_order), -1) AS max_seq
       FROM daily_task_templates
       WHERE assigned_to = $1 AND deleted_at IS NULL`,
      [userId]
    );
    return parseInt(result.rows[0].max_seq, 10);
  }

  /**
   * تعديل قالب (عنوان / إسناد / تفعيل).
   */
  static async update(id: bigint, updates: Partial<DailyTaskTemplate>): Promise<DailyTaskTemplate | null> {
    const allowed = ['title', 'assigned_to', 'is_active', 'sequence_order'];
    const fields = Object.keys(updates).filter((key) => allowed.includes(key));
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map((field) => updates[field as keyof DailyTaskTemplate]);
    values.push(id);

    const result = await pool.query(
      `UPDATE daily_task_templates
       SET ${setClause}, updated_at = NOW()
       WHERE id = $${fields.length + 1} AND deleted_at IS NULL
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * إعادة ترتيب قوالب موظف وفق القائمة المُرسلة (ترتيب المعرّفات = ترتيب العرض).
   */
  static async reorder(userId: bigint, orderedIds: bigint[]): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          `UPDATE daily_task_templates
           SET sequence_order = $1, updated_at = NOW()
           WHERE id = $2 AND assigned_to = $3 AND deleted_at IS NULL`,
          [i, orderedIds[i], userId]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * حذف منطقي — يوقف ظهور القالب مع الإبقاء على سجلات الإنجاز السابقة.
   */
  static async softDelete(id: bigint): Promise<boolean> {
    const result = await pool.query(
      `UPDATE daily_task_templates
       SET is_active = false, deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    return result.rowCount! > 0;
  }
}
