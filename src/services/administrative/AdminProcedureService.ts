import pool from '../../config/database';
import { SocketService } from '../management/SocketService';
import { NotificationService } from '../management/NotificationService';
import {
  AdminProcCategory,
  AdminProcOrder,
  AdminProcTask,
  AdminProcTaskAssignment,
  AdminProcTaskComment,
  AdminProcTaskAttachment,
  AdminProcTaskHistory,
  AdminProcArchive,
  AdminProcMention,
  AdminProcAccess,
  CreateAdminProcOrderDTO,
  UpdateAdminProcOrderDTO,
  CreateAdminProcTaskDTO,
  UpdateAdminProcTaskDTO,
  CreateAdminProcTaskCommentDTO,
  CreateAdminProcTaskAttachmentDTO,
  AdminProcOrderFilters,
  AdminProcTaskFilters,
} from '../../types/administrative';

/**
 * Administrative Procedure Service
 * خدمة الإجراءات الإدارية
 * 
 * يحتوي على كل منطق الأعمال للنظام الإداري المنفصل
 */
export class AdminProcedureService {

  // ============ Access Control (التحقق من الصلاحيات) ============

  // Cache بسيط للصلاحيات (5 دقائق)
  private static accessCache = new Map<string, { result: boolean; timestamp: number }>();
  private static ACCESS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * التحقق إذا كان المستخدم له صلاحية الوصول للنظام الإداري
   */
  static async hasAdminAccess(userId: bigint): Promise<boolean> {
    const key = userId.toString();
    const cached = this.accessCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.ACCESS_CACHE_TTL) {
      return cached.result;
    }

    const result = await pool.query(
      'SELECT 1 FROM admin_proc_access WHERE user_id = $1 AND is_active = true LIMIT 1',
      [userId]
    );
    const hasAccess = result.rows.length > 0;
    
    this.accessCache.set(key, { result: hasAccess, timestamp: Date.now() });
    return hasAccess;
  }

  /**
   * منح صلاحية وصول للنظام الإداري لمستخدم
   */
  static async grantAccess(userId: bigint, grantedBy: bigint): Promise<AdminProcAccess> {
    const result = await pool.query(
      `INSERT INTO admin_proc_access (user_id, granted_by, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (user_id) DO UPDATE SET is_active = true, granted_by = $2, granted_at = NOW()
       RETURNING *`,
      [userId, grantedBy]
    );
    return result.rows[0];
  }

  /**
   * سحب صلاحية الوصول
   */
  static async revokeAccess(userId: bigint): Promise<boolean> {
    const result = await pool.query(
      'UPDATE admin_proc_access SET is_active = false WHERE user_id = $1',
      [userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * الحصول على كل المستخدمين اللي عندهم صلاحية وصول
   */
  static async getAuthorizedUsers(): Promise<AdminProcAccess[]> {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, g.name as granted_by_name
       FROM admin_proc_access a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN users g ON a.granted_by = g.id
       WHERE a.is_active = true
       ORDER BY a.granted_at DESC`
    );
    return result.rows;
  }

  // ============ Categories (الأقسام) ============

  /**
   * جلب كل الأقسام الإدارية الأربعة
   */
  static async getAllCategories(): Promise<AdminProcCategory[]> {
    const result = await pool.query(
      'SELECT * FROM admin_proc_categories WHERE is_active = true ORDER BY id ASC'
    );
    return result.rows;
  }

  /**
   * جلب قسم معين
   */
  static async getCategoryById(id: bigint): Promise<AdminProcCategory | null> {
    const result = await pool.query(
      'SELECT * FROM admin_proc_categories WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  // ============ Orders (الطلبات الإدارية) ============

  /**
   * إنشاء طلب إداري جديد
   */
  static async createOrder(data: CreateAdminProcOrderDTO): Promise<AdminProcOrder> {
    const result = await pool.query(
      `INSERT INTO admin_proc_orders 
       (category_id, title, description, status_id, priority_id, deadline, created_by, notes, 
        tender_id, donor_client, announcement_link, submission_deadline, initial_notes,
        hr_type, leave_type, employee_id, start_date, end_date, days_count, leave_time_from, leave_time_to, reason, substitute_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
       RETURNING *`,
      [
        data.category_id,
        data.title,
        data.description || null,
        data.status_id,
        data.priority_id || null,
        data.deadline || null,
        data.created_by,
        data.notes || null,
        data.tender_id || null,
        data.donor_client || null,
        data.announcement_link || null,
        data.submission_deadline || null,
        data.initial_notes || null,
        data.hr_type || null,
        data.leave_type || null,
        data.employee_id || null,
        data.start_date || null,
        data.end_date || null,
        data.days_count || null,
        data.leave_time_from || null,
        data.leave_time_to || null,
        data.reason || null,
        data.substitute_id || null,
      ]
    );
    return result.rows[0];
  }

  /**
   * جلب طلب إداري بالـ ID مع كل التفاصيل
   * يتأكد إن المستخدم يقدر يشوفه (هو منشئه أو معين عليه أو منشن عليه)
   */
  static async getOrderById(orderId: bigint, userId: bigint): Promise<AdminProcOrder | null> {
    // نشوف إذا المستخدم له صلاحية وصول كاملة
    const hasFullAccess = await this.hasAdminAccess(userId);

    let query = `
      SELECT 
        o.*,
        c.name as category_name,
        s.name as status_name,
        p.name as priority_name,
        u.name as created_by_name,
        emp.name as employee_name,
        sub.name as substitute_name,
        (SELECT COUNT(*) FROM admin_proc_tasks WHERE admin_order_id = o.id) as tasks_count,
        (SELECT COUNT(*) FROM admin_proc_tasks t 
         INNER JOIN task_statuses ts ON t.status_id = ts.id 
         WHERE t.admin_order_id = o.id AND ts.name IN ('Done', 'منجز')) as completed_tasks_count
      FROM admin_proc_orders o
      LEFT JOIN admin_proc_categories c ON o.category_id = c.id
      LEFT JOIN order_statuses s ON o.status_id = s.id
      LEFT JOIN priority_levels p ON o.priority_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN users emp ON o.employee_id = emp.id
      LEFT JOIN users sub ON o.substitute_id = sub.id
      WHERE o.id = $1
    `;

    const result = await pool.query(query, [orderId]);
    if (result.rows.length === 0) return null;

    const order = result.rows[0];

    // إذا المستخدم له صلاحية كاملة → يشوف كل شيء
    if (hasFullAccess) return order;

    // وإلا نشوف إذا هو منشئ الطلب أو معين على إحدى مهامه
    const accessCheck = await this.canUserAccessOrder(orderId, userId);
    if (!accessCheck) return null;

    return order;
  }

  /**
   * فحص إذا المستخدم يقدر يشوف الطلب الإداري
   * (إما منشئه، أو معين على إحدى مهامه، أو منشن عليه)
   */
  static async canUserAccessOrder(orderId: bigint, userId: bigint): Promise<boolean> {
    // 1. هل هو المنشئ؟
    const createdResult = await pool.query(
      'SELECT 1 FROM admin_proc_orders WHERE id = $1 AND created_by = $2',
      [orderId, userId]
    );
    if (createdResult.rows.length > 0) return true;

    // 2. هل معين على أي مهمة في الطلب؟
    const assignedResult = await pool.query(
      `SELECT 1 FROM admin_proc_task_assignments a
       INNER JOIN admin_proc_tasks t ON a.admin_task_id = t.id
       WHERE t.admin_order_id = $1 AND a.assigned_to = $2 LIMIT 1`,
      [orderId, userId]
    );
    if (assignedResult.rows.length > 0) return true;

    // 3. هل منشن عليه في أي تعليق؟
    const mentionResult = await pool.query(
      `SELECT 1 FROM admin_proc_mentions m
       INNER JOIN admin_proc_task_comments c ON m.comment_id = c.id
       INNER JOIN admin_proc_tasks t ON c.admin_task_id = t.id
       WHERE t.admin_order_id = $1 AND m.mentioned_user_id = $2 LIMIT 1`,
      [orderId, userId]
    );
    if (mentionResult.rows.length > 0) return true;

    return false;
  }

  /**
   * جلب كل الطلبات الإدارية اللي المستخدم يقدر يشوفها
   */
  static async getOrdersForUser(userId: bigint, filters: AdminProcOrderFilters = {}): Promise<AdminProcOrder[]> {
    const hasFullAccess = await this.hasAdminAccess(userId);

    let query = `
      SELECT DISTINCT
        o.*,
        c.name as category_name,
        s.name as status_name,
        p.name as priority_name,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM admin_proc_tasks WHERE admin_order_id = o.id) as tasks_count
      FROM admin_proc_orders o
      LEFT JOIN admin_proc_categories c ON o.category_id = c.id
      LEFT JOIN order_statuses s ON o.status_id = s.id
      LEFT JOIN priority_levels p ON o.priority_id = p.id
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN admin_proc_tasks t ON t.admin_order_id = o.id
      LEFT JOIN admin_proc_task_assignments a ON a.admin_task_id = t.id
      LEFT JOIN admin_proc_task_comments cmt ON cmt.admin_task_id = t.id
      LEFT JOIN admin_proc_mentions m ON m.comment_id = cmt.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // إذا ما عنده صلاحية كاملة، نشوف بس اللي معين عليها أو منشن عليها أو منشئها
    if (!hasFullAccess) {
      query += ` AND (
        o.created_by = $${paramIndex}
        OR a.assigned_to = $${paramIndex}
        OR m.mentioned_user_id = $${paramIndex}
      )`;
      params.push(userId);
      paramIndex++;
    }

    if (filters.category_id) {
      query += ` AND o.category_id = $${paramIndex++}`;
      params.push(filters.category_id);
    }

    if (filters.status_id) {
      query += ` AND o.status_id = $${paramIndex++}`;
      params.push(filters.status_id);
    }

    if (filters.is_archived !== undefined) {
      query += ` AND o.is_archived = $${paramIndex++}`;
      params.push(filters.is_archived);
    } else {
      // افتراضي: ما نعرض المؤرشف
      query += ` AND o.is_archived = false`;
    }

    if (filters.search) {
      query += ` AND (o.title ILIKE $${paramIndex} OR o.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * جلب الطلبات حسب القسم
   */
  static async getOrdersByCategory(
    categoryId: bigint,
    userId: bigint,
    filters: AdminProcOrderFilters = {}
  ): Promise<AdminProcOrder[]> {
    return this.getOrdersForUser(userId, { ...filters, category_id: categoryId });
  }

  /**
   * تحديث طلب إداري
   */
  static async updateOrder(
    orderId: bigint,
    updates: UpdateAdminProcOrderDTO,
    userId: bigint
  ): Promise<AdminProcOrder | null> {
    // التحقق من الصلاحيات
    const canAccess = await this.canUserAccessOrder(orderId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) {
      throw new Error('ليس لديك صلاحية لتعديل هذا الطلب');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status_id !== undefined) {
      fields.push(`status_id = $${paramIndex++}`);
      values.push(updates.status_id);
    }
    if (updates.priority_id !== undefined) {
      fields.push(`priority_id = $${paramIndex++}`);
      values.push(updates.priority_id);
    }
    if (updates.deadline !== undefined) {
      fields.push(`deadline = $${paramIndex++}`);
      values.push(updates.deadline);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }

    if (fields.length === 0) {
      return this.getOrderById(orderId, userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(orderId);

    const result = await pool.query(
      `UPDATE admin_proc_orders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * حذف طلب إداري
   */
  static async deleteOrder(orderId: bigint, userId: bigint): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية لحذف هذا الطلب');
    }

    const result = await pool.query(
      'DELETE FROM admin_proc_orders WHERE id = $1',
      [orderId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * أرشفة طلب إداري
   */
  static async archiveOrder(orderId: bigint, userId: bigint, reason?: string): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية لأرشفة هذا الطلب');
    }

    const order = await this.getOrderById(orderId, userId);
    if (!order) return false;

    // نسخة كاملة في الأرشيف
    await pool.query(
      `INSERT INTO admin_proc_archive (admin_order_id, entity_type, entity_data, archived_by, reason)
       VALUES ($1, 'order', $2, $3, $4)`,
      [orderId, JSON.stringify(order), userId, reason || null]
    );

    // نحدث الطلب نفسه
    await pool.query(
      `UPDATE admin_proc_orders SET is_archived = true, archived_at = NOW() WHERE id = $1`,
      [orderId]
    );

    return true;
  }

  // ============ Tasks (المهام الإدارية) ============

  /**
   * إنشاء مهمة إدارية جديدة مع تعيينها للمستخدمين
   */
  static async createTask(data: CreateAdminProcTaskDTO): Promise<AdminProcTask> {
    const client = await pool.connect();
    let task: any;
    const assignedUserIds: bigint[] = [];

    try {
      await client.query('BEGIN');

      // إنشاء المهمة
      const taskResult = await client.query(
        `INSERT INTO admin_proc_tasks 
         (admin_order_id, title, description, status_id, priority_id, deadline, sequence_order, created_by, estimated_duration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          data.admin_order_id,
          data.title,
          data.description || null,
          data.status_id,
          data.priority_id || null,
          data.deadline || null,
          data.sequence_order || null,
          data.created_by,
          data.estimated_duration || null,
        ]
      );

      task = taskResult.rows[0];

      // تعيين المستخدمين على المهمة
      if (data.assigned_users && data.assigned_users.length > 0) {
        for (const assignedUserId of data.assigned_users) {
          const insertResult = await client.query(
            `INSERT INTO admin_proc_task_assignments (admin_task_id, assigned_to, assigned_by)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING
             RETURNING *`,
            [task.id, assignedUserId, data.created_by]
          );
          if (insertResult.rows.length > 0) {
            assignedUserIds.push(assignedUserId);
          }
        }
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // إرسال الإشعارات بعد الـ COMMIT (خارج الـ transaction)
    for (const userId of assignedUserIds) {
      try {
        await this.sendAssignmentNotification(userId, task.id, task.title, data.created_by);
      } catch (err) {
        console.error('Failed to send notification to user:', userId.toString(), err);
      }
    }

    return task;
  }

  /**
   * جلب مهمة إدارية بالـ ID مع التفاصيل
   */
  static async getTaskById(taskId: bigint, userId: bigint): Promise<AdminProcTask | null> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    const canAccess = hasFullAccess || (await this.canUserAccessTask(taskId, userId));

    if (!canAccess) return null;

    const result = await pool.query(
      `SELECT 
        t.*,
        s.name as status_name,
        p.name as priority_name,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM admin_proc_task_comments WHERE admin_task_id = t.id) as comments_count,
        (SELECT COUNT(*) FROM admin_proc_task_attachments WHERE admin_task_id = t.id) as attachments_count
      FROM admin_proc_tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      LEFT JOIN priority_levels p ON t.priority_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = $1`,
      [taskId]
    );

    if (result.rows.length === 0) return null;

    const task = result.rows[0];

    // جلب المعينين على المهمة
    const assigneesResult = await pool.query(
      `SELECT a.*, u.name as assigned_to_name, ab.name as assigned_by_name
       FROM admin_proc_task_assignments a
       LEFT JOIN users u ON a.assigned_to = u.id
       LEFT JOIN users ab ON a.assigned_by = ab.id
       WHERE a.admin_task_id = $1`,
      [taskId]
    );
    task.assignees = assigneesResult.rows;

    return task;
  }

  /**
   * فحص إذا المستخدم يقدر يشوف المهمة
   */
  static async canUserAccessTask(taskId: bigint, userId: bigint): Promise<boolean> {
    // query واحد بدل 3 queries منفصلة
    const result = await pool.query(
      `SELECT 1 FROM admin_proc_tasks WHERE id = $1 AND created_by = $2
       UNION ALL
       SELECT 1 FROM admin_proc_task_assignments WHERE admin_task_id = $1 AND assigned_to = $2
       UNION ALL
       SELECT 1 FROM admin_proc_mentions m
       INNER JOIN admin_proc_task_comments c ON m.comment_id = c.id
       WHERE c.admin_task_id = $1 AND m.mentioned_user_id = $2
       LIMIT 1`,
      [taskId, userId]
    );
    return result.rows.length > 0;
  }

  /**
   * جلب كل المهام لطلب معين (للمستخدمين المعينين أو لهم وصول)
   */
  static async getTasksForOrder(orderId: bigint, userId: bigint): Promise<AdminProcTask[]> {
    const hasFullAccess = await this.hasAdminAccess(userId);

    let query = `
      SELECT DISTINCT
        t.*,
        s.name as status_name,
        p.name as priority_name,
        u.name as created_by_name
      FROM admin_proc_tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      LEFT JOIN priority_levels p ON t.priority_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN admin_proc_task_assignments a ON a.admin_task_id = t.id
      LEFT JOIN admin_proc_task_comments cmt ON cmt.admin_task_id = t.id
      LEFT JOIN admin_proc_mentions m ON m.comment_id = cmt.id
      WHERE t.admin_order_id = $1
    `;
    const params: any[] = [orderId];

    if (!hasFullAccess) {
      query += ` AND (
        t.created_by = $2
        OR a.assigned_to = $2
        OR m.mentioned_user_id = $2
      )`;
      params.push(userId);
    }

    query += ` ORDER BY t.sequence_order ASC NULLS LAST, t.created_at DESC`;

    const result = await pool.query(query, params);

    // إضافة المعينين لكل مهمة
    for (const task of result.rows) {
      const assigneesResult = await pool.query(
        `SELECT a.*, u.name as assigned_to_name
         FROM admin_proc_task_assignments a
         LEFT JOIN users u ON a.assigned_to = u.id
         WHERE a.admin_task_id = $1`,
        [task.id]
      );
      task.assignees = assigneesResult.rows;
    }

    return result.rows;
  }

  /**
   * جلب مهام المستخدم (المعين عليها أو منشئها)
   */
  static async getMyTasks(userId: bigint, filters: AdminProcTaskFilters = {}): Promise<AdminProcTask[]> {
    let query = `
      SELECT DISTINCT
        t.*,
        s.name as status_name,
        p.name as priority_name,
        u.name as created_by_name,
        o.title as order_title,
        c.name as category_name
      FROM admin_proc_tasks t
      LEFT JOIN task_statuses s ON t.status_id = s.id
      LEFT JOIN priority_levels p ON t.priority_id = p.id
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN admin_proc_orders o ON t.admin_order_id = o.id
      LEFT JOIN admin_proc_categories c ON o.category_id = c.id
      LEFT JOIN admin_proc_task_assignments a ON a.admin_task_id = t.id
      WHERE (t.created_by = $1 OR a.assigned_to = $1)
    `;
    const params: any[] = [userId];
    let paramIndex = 2;

    if (filters.status_id) {
      query += ` AND t.status_id = $${paramIndex++}`;
      params.push(filters.status_id);
    }

    if (filters.is_archived !== undefined) {
      query += ` AND t.is_archived = $${paramIndex++}`;
      params.push(filters.is_archived);
    } else {
      query += ` AND t.is_archived = false`;
    }

    query += ` ORDER BY t.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * تحديث مهمة إدارية
   */
  static async updateTask(
    taskId: bigint,
    updates: UpdateAdminProcTaskDTO,
    userId: bigint
  ): Promise<AdminProcTask | null> {
    const canAccess = await this.canUserAccessTask(taskId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) {
      throw new Error('ليس لديك صلاحية لتعديل هذه المهمة');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.status_id !== undefined) {
      fields.push(`status_id = $${paramIndex++}`);
      values.push(updates.status_id);
    }
    if (updates.priority_id !== undefined) {
      fields.push(`priority_id = $${paramIndex++}`);
      values.push(updates.priority_id);
    }
    if (updates.deadline !== undefined) {
      fields.push(`deadline = $${paramIndex++}`);
      values.push(updates.deadline);
    }
    if (updates.sequence_order !== undefined) {
      fields.push(`sequence_order = $${paramIndex++}`);
      values.push(updates.sequence_order);
    }

    if (fields.length === 0) {
      return this.getTaskById(taskId, userId);
    }

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const result = await pool.query(
      `UPDATE admin_proc_tasks SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * تغيير حالة المهمة (مع تسجيل في الـ history)
   */
  static async changeTaskStatus(
    taskId: bigint,
    newStatusId: bigint,
    userId: bigint,
    notes?: string
  ): Promise<AdminProcTask | null> {
    const canAccess = await this.canUserAccessTask(taskId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) {
      throw new Error('ليس لديك صلاحية لتغيير حالة هذه المهمة');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // جلب الحالة القديمة
      const oldTaskResult = await client.query(
        'SELECT status_id, title FROM admin_proc_tasks WHERE id = $1',
        [taskId]
      );
      if (oldTaskResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return null;
      }

      const oldStatusId = oldTaskResult.rows[0].status_id;
      const taskTitle = oldTaskResult.rows[0].title;

      // تحديث الحالة
      const result = await client.query(
        `UPDATE admin_proc_tasks 
         SET status_id = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [newStatusId, taskId]
      );

      // تسجيل في سجل التغييرات
      await client.query(
        `INSERT INTO admin_proc_task_history (admin_task_id, old_status_id, new_status_id, changed_by, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [taskId, oldStatusId, newStatusId, userId, notes || null]
      );

      await client.query('COMMIT');

      // إرسال إشعارات للمعينين
      await this.notifyTaskStatusChanged(taskId, taskTitle, newStatusId, userId);

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * تعيين مستخدمين على مهمة
   */
  static async assignUsersToTask(
    taskId: bigint,
    userIds: bigint[],
    assignedBy: bigint
  ): Promise<AdminProcTaskAssignment[]> {
    const assignments: AdminProcTaskAssignment[] = [];

    // جلب عنوان المهمة للإشعار
    const taskResult = await pool.query(
      'SELECT title FROM admin_proc_tasks WHERE id = $1',
      [taskId]
    );
    const taskTitle = taskResult.rows[0]?.title || '';

    for (const userId of userIds) {
      const result = await pool.query(
        `INSERT INTO admin_proc_task_assignments (admin_task_id, assigned_to, assigned_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (admin_task_id, assigned_to) DO NOTHING
         RETURNING *`,
        [taskId, userId, assignedBy]
      );

      if (result.rows.length > 0) {
        assignments.push(result.rows[0]);
        // إرسال إشعار للمستخدم المعين
        await this.sendAssignmentNotification(userId, taskId, taskTitle, assignedBy);
      }
    }

    return assignments;
  }

  /**
   * إزالة تعيين مستخدم من مهمة
   */
  static async unassignUserFromTask(taskId: bigint, userId: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM admin_proc_task_assignments WHERE admin_task_id = $1 AND assigned_to = $2',
      [taskId, userId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * أرشفة مهمة
   */
  static async archiveTask(taskId: bigint, userId: bigint, reason?: string): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية لأرشفة هذه المهمة');
    }

    const task = await this.getTaskById(taskId, userId);
    if (!task) return false;

    await pool.query(
      `INSERT INTO admin_proc_archive (admin_task_id, entity_type, entity_data, archived_by, reason)
       VALUES ($1, 'task', $2, $3, $4)`,
      [taskId, JSON.stringify(task), userId, reason || null]
    );

    await pool.query(
      `UPDATE admin_proc_tasks SET is_archived = true, archived_at = NOW() WHERE id = $1`,
      [taskId]
    );

    return true;
  }

  /**
   * حذف مهمة
   */
  static async deleteTask(taskId: bigint, userId: bigint): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية لحذف هذه المهمة');
    }

    const result = await pool.query('DELETE FROM admin_proc_tasks WHERE id = $1', [taskId]);
    return (result.rowCount || 0) > 0;
  }

  // ============ Comments (التعليقات) ============

  /**
   * إضافة تعليق على مهمة (مع المنشنات)
   */
  static async addComment(data: CreateAdminProcTaskCommentDTO): Promise<AdminProcTaskComment> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // التحقق من الصلاحيات
      const canAccess = await this.canUserAccessTask(data.admin_task_id, data.user_id);
      const hasFullAccess = await this.hasAdminAccess(data.user_id);

      if (!canAccess && !hasFullAccess) {
        throw new Error('ليس لديك صلاحية للتعليق على هذه المهمة');
      }

      // إنشاء التعليق
      const commentResult = await client.query(
        `INSERT INTO admin_proc_task_comments (admin_task_id, user_id, comment)
         VALUES ($1, $2, $3) RETURNING *`,
        [data.admin_task_id, data.user_id, data.comment]
      );

      const comment = commentResult.rows[0];

      // إضافة المنشنات
      if (data.mentioned_user_ids && data.mentioned_user_ids.length > 0) {
        for (const mentionedUserId of data.mentioned_user_ids) {
          await client.query(
            `INSERT INTO admin_proc_mentions 
             (comment_id, mentioned_user_id, mentioned_by_user_id, entity_type, entity_id)
             VALUES ($1, $2, $3, 'task', $4)`,
            [comment.id, mentionedUserId, data.user_id, data.admin_task_id]
          );
        }
      }

      await client.query('COMMIT');

      // إرسال إشعارات للمنشنين والمعينين
      await this.notifyNewComment(data.admin_task_id, comment, data.user_id, data.mentioned_user_ids || []);

      return comment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * جلب تعليقات مهمة
   */
  static async getTaskComments(taskId: bigint, userId: bigint): Promise<AdminProcTaskComment[]> {
    const canAccess = await this.canUserAccessTask(taskId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) return [];

    // جلب التعليقات والمنشنات في query واحد
    const [commentsResult, mentionsResult] = await Promise.all([
      pool.query(
        `SELECT 
          c.*,
          u.name as user_name,
          eu.name as edited_by_name
        FROM admin_proc_task_comments c
        LEFT JOIN users u ON c.user_id = u.id
        LEFT JOIN users eu ON c.edited_by = eu.id
        WHERE c.admin_task_id = $1
        ORDER BY c.created_at ASC`,
        [taskId]
      ),
      pool.query(
        `SELECT m.*, u.name as mentioned_user_name
         FROM admin_proc_mentions m
         LEFT JOIN users u ON m.mentioned_user_id = u.id
         WHERE m.comment_id IN (
           SELECT id FROM admin_proc_task_comments WHERE admin_task_id = $1
         )`,
        [taskId]
      ),
    ]);

    // ربط المنشنات بالتعليقات
    const mentionsByComment = new Map<string, any[]>();
    for (const m of mentionsResult.rows) {
      const key = m.comment_id.toString();
      if (!mentionsByComment.has(key)) mentionsByComment.set(key, []);
      mentionsByComment.get(key)!.push(m);
    }

    for (const comment of commentsResult.rows) {
      comment.mentions = mentionsByComment.get(comment.id.toString()) || [];
    }

    return commentsResult.rows;
  }

  /**
   * حذف تعليق
   */
  static async deleteComment(commentId: bigint, userId: bigint): Promise<boolean> {
    // فقط منشئ التعليق أو الـ Admin يقدر يحذف
    const hasFullAccess = await this.hasAdminAccess(userId);

    let query = 'DELETE FROM admin_proc_task_comments WHERE id = $1';
    const params: any[] = [commentId];

    if (!hasFullAccess) {
      query += ' AND user_id = $2';
      params.push(userId);
    }

    const result = await pool.query(query, params);
    return (result.rowCount || 0) > 0;
  }

  /**
   * تعديل تعليق
   * فقط صاحب التعليق يقدر يعدله
   */
  static async updateComment(commentId: bigint, userId: bigint, newComment: string): Promise<any | null> {
    // التحقق أن التعليق موجود وأن المستخدم هو صاحبه
    const checkResult = await pool.query(
      'SELECT * FROM admin_proc_task_comments WHERE id = $1',
      [commentId]
    );

    if (checkResult.rows.length === 0) return null;

    const comment = checkResult.rows[0];

    // فقط صاحب التعليق يقدر يعدله
    if (comment.user_id.toString() !== userId.toString()) {
      throw new Error('ليس لديك صلاحية لتعديل هذا التعليق');
    }

    const result = await pool.query(
      `UPDATE admin_proc_task_comments 
       SET comment = $1, is_edited = TRUE, edited_by = $2, edited_at = NOW(), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [newComment, userId, commentId]
    );

    return result.rows[0] || null;
  }

  // ============ Attachments (الملفات المرفقة) ============

  /**
   * إضافة ملف مرفق
   * + يخزن نسخة في الأرشيف الإداري تلقائياً
   */
  static async addAttachment(data: CreateAdminProcTaskAttachmentDTO): Promise<AdminProcTaskAttachment> {
    const canAccess = await this.canUserAccessTask(data.admin_task_id, data.uploaded_by);
    const hasFullAccess = await this.hasAdminAccess(data.uploaded_by);

    if (!canAccess && !hasFullAccess) {
      throw new Error('ليس لديك صلاحية لإضافة ملف على هذه المهمة');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // استخراج s3_key و s3_bucket من الـ URL
      let s3Key: string | null = null;
      let s3Bucket: string | null = null;
      if (data.file_url && data.file_url.includes('.amazonaws.com/')) {
        const urlParts = data.file_url.split('.amazonaws.com/');
        if (urlParts.length > 1) {
          s3Key = urlParts[1];
        }
        const bucketMatch = data.file_url.match(/https:\/\/([^.]+)\.s3/);
        if (bucketMatch) {
          s3Bucket = bucketMatch[1];
        }
      }

      // 1. إنشاء المرفق في الجدول الأصلي
      const result = await client.query(
        `INSERT INTO admin_proc_task_attachments 
         (admin_task_id, title, description, file_url, file_type, file_size, uploaded_by, s3_key, s3_bucket)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          data.admin_task_id,
          data.title || null,
          data.description || null,
          data.file_url,
          data.file_type || null,
          data.file_size || null,
          data.uploaded_by,
          s3Key,
          s3Bucket,
        ]
      );

      const attachment = result.rows[0];

      // 2. جلب معلومات المهمة والقسم لحفظ المعلومات الكاملة في الأرشيف
      const taskInfoResult = await client.query(
        `SELECT t.id, t.admin_order_id, o.category_id 
         FROM admin_proc_tasks t
         INNER JOIN admin_proc_orders o ON t.admin_order_id = o.id
         WHERE t.id = $1`,
        [data.admin_task_id]
      );
      const taskInfo = taskInfoResult.rows[0];

      // 3. حفظ نسخة كاملة في الأرشيف الإداري
      await client.query(
        `INSERT INTO admin_proc_archive (
          entity_type, 
          admin_attachment_id,
          admin_task_id, 
          admin_order_id,
          category_id,
          title,
          description,
          file_url,
          file_type,
          file_size,
          file_name,
          s3_key,
          s3_bucket,
          uploaded_by,
          archived_by,
          reason
        ) VALUES (
          'attachment', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        )`,
        [
          attachment.id,
          data.admin_task_id,
          taskInfo?.admin_order_id || null,
          taskInfo?.category_id || null,
          data.title || null,
          data.description || null,
          data.file_url,
          data.file_type || null,
          data.file_size || null,
          data.title || null, // file_name
          s3Key,
          s3Bucket,
          data.uploaded_by,
          data.uploaded_by, // archived_by - نفس اللي رفع
          'Auto-archived on upload',
        ]
      );

      await client.query('COMMIT');
      console.log('✅ Attachment created and auto-archived to admin_proc_archive');

      return attachment;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * جلب ملفات مهمة
   */
  static async getTaskAttachments(taskId: bigint, userId: bigint): Promise<AdminProcTaskAttachment[]> {
    const canAccess = await this.canUserAccessTask(taskId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) return [];

    const result = await pool.query(
      `SELECT 
        a.*,
        u.name as uploaded_by_name
      FROM admin_proc_task_attachments a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.admin_task_id = $1
      ORDER BY a.created_at DESC`,
      [taskId]
    );
    return result.rows;
  }

  /**
   * حذف ملف مرفق
   */
  static async deleteAttachment(attachmentId: bigint, userId: bigint): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);

    // جلب الـ s3_key قبل الحذف عشان نقدر نحذف من S3
    const fileResult = await pool.query(
      'SELECT s3_key, uploaded_by FROM admin_proc_task_attachments WHERE id = $1',
      [attachmentId]
    );

    if (fileResult.rows.length === 0) return false;

    const { s3_key, uploaded_by } = fileResult.rows[0];

    // التحقق من الصلاحيات
    if (!hasFullAccess && uploaded_by.toString() !== userId.toString()) {
      throw new Error('ليس لديك صلاحية لحذف هذا الملف');
    }

    // حذف من قاعدة البيانات
    const result = await pool.query(
      'DELETE FROM admin_proc_task_attachments WHERE id = $1',
      [attachmentId]
    );

    // محاولة الحذف من S3 (إذا كان من bucket الإداري)
    try {
      if (s3_key) {
        const { AdminProcS3Service } = await import('./AdminProcS3Service');
        await AdminProcS3Service.deleteFile(s3_key);
        console.log('✅ File deleted from S3:', s3_key);
      }
    } catch (s3Err) {
      // ما نوقف العملية لو حذف S3 فشل
      console.error('Failed to delete from S3 (non-critical):', s3Err);
    }

    return (result.rowCount || 0) > 0;
  }

  // ============ Task History (سجل التغييرات) ============

  /**
   * جلب سجل تغييرات المهمة
   */
  static async getTaskHistory(taskId: bigint, userId: bigint): Promise<AdminProcTaskHistory[]> {
    const canAccess = await this.canUserAccessTask(taskId, userId);
    const hasFullAccess = await this.hasAdminAccess(userId);

    if (!canAccess && !hasFullAccess) return [];

    const result = await pool.query(
      `SELECT 
        h.*,
        os.name as old_status_name,
        ns.name as new_status_name,
        u.name as changed_by_name
      FROM admin_proc_task_history h
      LEFT JOIN task_statuses os ON h.old_status_id = os.id
      LEFT JOIN task_statuses ns ON h.new_status_id = ns.id
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.admin_task_id = $1
      ORDER BY h.changed_at DESC`,
      [taskId]
    );
    return result.rows;
  }

  // ============ Archive (الأرشيف) ============

  /**
   * جلب الأرشيف الإداري
   * يشمل: الطلبات + المهام + الملفات المرفقة المؤرشفة
   */
  static async getArchive(userId: bigint, filters: AdminProcOrderFilters = {}): Promise<AdminProcArchive[]> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية للوصول للأرشيف الإداري');
    }

    let query = `
      SELECT 
        a.*,
        u.name as archived_by_name,
        uu.name as uploaded_by_name,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        o.title as order_title,
        t.title as task_title
      FROM admin_proc_archive a
      LEFT JOIN users u ON a.archived_by = u.id
      LEFT JOIN users uu ON a.uploaded_by = uu.id
      LEFT JOIN admin_proc_categories c ON a.category_id = c.id
      LEFT JOIN admin_proc_orders o ON a.admin_order_id = o.id
      LEFT JOIN admin_proc_tasks t ON a.admin_task_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    // فلتر حسب نوع الكيان
    if (filters.search) {
      query += ` AND (
        a.title ILIKE $${paramIndex} 
        OR a.description ILIKE $${paramIndex}
        OR a.file_name ILIKE $${paramIndex}
        OR a.entity_data::text ILIKE $${paramIndex}
      )`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.category_id) {
      query += ` AND a.category_id = $${paramIndex++}`;
      params.push(filters.category_id);
    }

    query += ` ORDER BY a.archived_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex++}`;
      params.push(filters.offset);
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * استعادة كيان من الأرشيف
   */
  static async restoreFromArchive(archiveId: bigint, userId: bigint): Promise<boolean> {
    const hasFullAccess = await this.hasAdminAccess(userId);
    if (!hasFullAccess) {
      throw new Error('ليس لديك صلاحية للاستعادة من الأرشيف');
    }

    const result = await pool.query(
      'SELECT * FROM admin_proc_archive WHERE id = $1',
      [archiveId]
    );
    if (result.rows.length === 0) return false;

    const archive = result.rows[0];

    if (archive.entity_type === 'order' && archive.admin_order_id) {
      await pool.query(
        `UPDATE admin_proc_orders SET is_archived = false, archived_at = NULL WHERE id = $1`,
        [archive.admin_order_id]
      );
    } else if (archive.entity_type === 'task' && archive.admin_task_id) {
      await pool.query(
        `UPDATE admin_proc_tasks SET is_archived = false, archived_at = NULL WHERE id = $1`,
        [archive.admin_task_id]
      );
    }

    await pool.query('DELETE FROM admin_proc_archive WHERE id = $1', [archiveId]);
    return true;
  }

  // ============ Notifications (الإشعارات الفورية) ============

  /**
   * إرسال إشعار عند تعيين مهمة
   */
  private static async sendAssignmentNotification(
    userId: bigint,
    taskId: bigint,
    taskTitle: string,
    assignedBy: bigint
  ): Promise<void> {
    try {
      // جلب اسم المعين
      const assignedByResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [assignedBy]
      );
      const assignedByName = assignedByResult.rows[0]?.name || 'مستخدم';

      console.log(`📨 Sending assignment notification to user ${userId} for task "${taskTitle}"`);

      await NotificationService.create({
        user_id: userId,
        type: 'admin_task_assigned',
        title: 'تم تعيين مهمة إدارية جديدة لك',
        message: `المهمة الإدارية: ${taskTitle} — بواسطة: ${assignedByName}`,
        entity_type: 'admin_task',
        entity_id: taskId,
      });

      // إرسال فوري عبر WebSocket
      SocketService.sendToUser(userId, 'admin_task_assigned', {
        task_id: taskId.toString(),
        task_title: taskTitle,
        assigned_by_name: assignedByName,
      });

      console.log(`✅ Notification sent to user ${userId}`);
    } catch (error) {
      console.error('❌ Failed to send assignment notification:', error);
    }
  }

  /**
   * إرسال إشعار عند تغيير حالة المهمة
   */
  private static async notifyTaskStatusChanged(
    taskId: bigint,
    taskTitle: string,
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<void> {
    try {
      // جلب اسم الحالة الجديدة
      const statusResult = await pool.query(
        'SELECT name FROM task_statuses WHERE id = $1',
        [newStatusId]
      );
      const statusName = statusResult.rows[0]?.name || '';

      // جلب كل المعينين على المهمة
      const assigneesResult = await pool.query(
        'SELECT assigned_to FROM admin_proc_task_assignments WHERE admin_task_id = $1',
        [taskId]
      );

      // إرسال إشعار لكل معين (ما عدا اللي غير الحالة)
      for (const row of assigneesResult.rows) {
        if (row.assigned_to.toString() === changedBy.toString()) continue;

        await NotificationService.create({
          user_id: row.assigned_to,
          type: 'admin_task_status_changed',
          title: 'تم تحديث حالة المهمة الإدارية',
          message: `المهمة: ${taskTitle} — الحالة الجديدة: ${statusName}`,
          entity_type: 'admin_task',
          entity_id: taskId,
        });

        SocketService.sendToUser(row.assigned_to, 'admin_task_status_changed', {
          task_id: taskId.toString(),
          task_title: taskTitle,
          new_status: statusName,
        });
      }
    } catch (error) {
      console.error('Failed to send status change notification:', error);
    }
  }

  /**
   * إرسال إشعار عند تعليق جديد أو منشن
   */
  private static async notifyNewComment(
    taskId: bigint,
    comment: AdminProcTaskComment,
    commentedBy: bigint,
    mentionedUserIds: bigint[]
  ): Promise<void> {
    try {
      // جلب اسم المعلق وعنوان المهمة
      const userResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [commentedBy]
      );
      const commentedByName = userResult.rows[0]?.name || 'مستخدم';

      const taskResult = await pool.query(
        'SELECT title FROM admin_proc_tasks WHERE id = $1',
        [taskId]
      );
      const taskTitle = taskResult.rows[0]?.title || '';

      // إشعار للمنشنين
      for (const mentionedId of mentionedUserIds) {
        if (mentionedId.toString() === commentedBy.toString()) continue;

        await NotificationService.create({
          user_id: mentionedId,
          type: 'admin_mention',
          title: 'تم منشنك في تعليق إداري',
          message: `${commentedByName} منشنك في: ${taskTitle}`,
          entity_type: 'admin_task',
          entity_id: taskId,
        });

        SocketService.sendToUser(mentionedId, 'admin_mention', {
          task_id: taskId.toString(),
          task_title: taskTitle,
          mentioned_by_name: commentedByName,
          comment: comment.comment,
        });
      }

      // إشعار لكل المعينين على المهمة (ما عدا المعلق والمنشنين)
      const assigneesResult = await pool.query(
        'SELECT assigned_to FROM admin_proc_task_assignments WHERE admin_task_id = $1',
        [taskId]
      );

      const mentionedSet = new Set(mentionedUserIds.map(id => id.toString()));

      for (const row of assigneesResult.rows) {
        const assignedTo = row.assigned_to;
        if (
          assignedTo.toString() === commentedBy.toString() ||
          mentionedSet.has(assignedTo.toString())
        ) continue;

        await NotificationService.create({
          user_id: assignedTo,
          type: 'admin_comment',
          title: 'تعليق جديد على مهمة إدارية',
          message: `${commentedByName} علق على: ${taskTitle}`,
          entity_type: 'admin_task',
          entity_id: taskId,
        });

        SocketService.sendToUser(assignedTo, 'admin_comment', {
          task_id: taskId.toString(),
          task_title: taskTitle,
          commented_by_name: commentedByName,
        });
      }
    } catch (error) {
      console.error('Failed to send comment notification:', error);
    }
  }
}
