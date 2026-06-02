import pool from '../../config/database';
import { TaskKPI, OrderKPI, UserKPI } from '../../types/management';

export class KPIService {
  /**
   * Calculate and update task KPI
   * Called when task is completed
   */
  static async calculateTaskKPI(taskId: bigint): Promise<TaskKPI> {
    const taskResult = await pool.query(
      `SELECT id, order_id, created_at, started_at, completed_at, deadline, estimated_duration, is_overdue
       FROM tasks WHERE id = $1`,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      throw new Error(`Task ${taskId} not found`);
    }

    const task = taskResult.rows[0];
    const completedAt = task.completed_at || new Date();
    const startedAt = task.started_at || task.created_at;

    // Calculate actual duration in minutes
    const actualDuration = startedAt && completedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

    // Check if on time
    const isOnTime = task.deadline && completedAt
      ? new Date(completedAt) <= new Date(task.deadline)
      : true;

    // Calculate delay in minutes
    const delayMinutes = !isOnTime && task.deadline && completedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(task.deadline).getTime()) / 60000)
      : 0;

    // Get content produced by this task
    const contentResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM content WHERE task_id = $1`,
      [taskId]
    );

    const contentProducedCount = parseInt(contentResult.rows[0].count) || 0;
    const contentSizeTotal = parseInt(contentResult.rows[0].total_size) || 0;

    // Upsert task_kpi
    const kpiResult = await pool.query(
      `INSERT INTO task_kpi (task_id, order_id, created_at, started_at, completed_at, estimated_duration, actual_duration, is_on_time, is_overdue, delay_minutes, content_produced_count, content_size_total, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (task_id) DO UPDATE SET
         started_at = $4,
         completed_at = $5,
         actual_duration = $7,
         is_on_time = $8,
         is_overdue = $9,
         delay_minutes = $10,
         content_produced_count = $11,
         content_size_total = $12,
         updated_at = NOW()
       RETURNING *`,
      [taskId, task.order_id, task.created_at, startedAt, completedAt, task.estimated_duration, actualDuration, isOnTime, !isOnTime, delayMinutes, contentProducedCount, contentSizeTotal]
    );

    return kpiResult.rows[0];
  }

  /**
   * Calculate and update order KPI
   * Called when order is completed or when any task in the order changes
   */
  static async calculateOrderKPI(orderId: bigint): Promise<OrderKPI> {
    const orderResult = await pool.query(
      `SELECT id, created_at, started_at, completed_at, deadline
       FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orderResult.rows[0];
    const completedAt = order.completed_at || new Date();
    const startedAt = order.started_at || order.created_at;

    // Calculate actual duration in minutes
    const actualDuration = startedAt && completedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
      : null;

    // Check if on time
    const isOnTime = order.deadline && completedAt
      ? new Date(completedAt) <= new Date(order.deadline)
      : true;

    // Calculate delay in minutes
    const delayMinutes = !isOnTime && order.deadline && completedAt
      ? Math.round((new Date(completedAt).getTime() - new Date(order.deadline).getTime()) / 60000)
      : 0;

    // Get task statistics
    const tasksResult = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         SUM(CASE WHEN status_id = (SELECT id FROM task_statuses WHERE name = 'Done') THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN status_id != (SELECT id FROM task_statuses WHERE name = 'Done') THEN 1 ELSE 0 END) as pending_tasks,
         SUM(CASE WHEN is_overdue = true THEN 1 ELSE 0 END) as overdue_tasks
       FROM tasks WHERE order_id = $1`,
      [orderId]
    );

    const taskStats = tasksResult.rows[0];
    const totalTasks = parseInt(taskStats.total_tasks) || 0;
    const completedTasks = parseInt(taskStats.completed_tasks) || 0;
    const pendingTasks = parseInt(taskStats.pending_tasks) || 0;
    const overdueTasks = parseInt(taskStats.overdue_tasks) || 0;

    // Get content statistics
    const contentResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM content WHERE task_id IN (SELECT id FROM tasks WHERE order_id = $1)`,
      [orderId]
    );

    const contentProducedCount = parseInt(contentResult.rows[0].count) || 0;
    const contentSizeTotal = parseInt(contentResult.rows[0].total_size) || 0;

    // Upsert order_kpi
    const kpiResult = await pool.query(
      `INSERT INTO order_kpi (order_id, created_at, started_at, completed_at, actual_duration, is_on_time, is_overdue, delay_minutes, total_tasks, completed_tasks, pending_tasks, overdue_tasks, content_produced_count, content_size_total, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
       ON CONFLICT (order_id) DO UPDATE SET
         started_at = $3,
         completed_at = $4,
         actual_duration = $5,
         is_on_time = $6,
         is_overdue = $7,
         delay_minutes = $8,
         total_tasks = $9,
         completed_tasks = $10,
         pending_tasks = $11,
         overdue_tasks = $12,
         content_produced_count = $13,
         content_size_total = $14,
         updated_at = NOW()
       RETURNING *`,
      [orderId, order.created_at, startedAt, completedAt, actualDuration, isOnTime, !isOnTime, delayMinutes, totalTasks, completedTasks, pendingTasks, overdueTasks, contentProducedCount, contentSizeTotal]
    );

    return kpiResult.rows[0];
  }

  /**
   * Calculate and update user KPI
   * Called when user completes a task or when task is assigned
   * يحسب المهام العادية + المهام الإدارية
   */
  static async calculateUserKPI(userId: bigint): Promise<UserKPI> {
    // Get regular task statistics
    const tasksResult = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         SUM(CASE WHEN status_id = (SELECT id FROM task_statuses WHERE name = 'Done') THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN status_id != (SELECT id FROM task_statuses WHERE name = 'Done') THEN 1 ELSE 0 END) as pending_tasks,
         SUM(CASE WHEN is_overdue = true THEN 1 ELSE 0 END) as overdue_tasks,
         ROUND(AVG(CASE WHEN actual_duration IS NOT NULL THEN actual_duration ELSE NULL END)) as avg_completion_time
       FROM tasks WHERE assigned_to = $1`,
      [userId]
    );

    // Get admin task statistics (المهام الإدارية)
    const adminTasksResult = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         SUM(CASE WHEN ts.name IN ('Done', 'منجز', 'مكتمل') THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN ts.name NOT IN ('Done', 'منجز', 'مكتمل') THEN 1 ELSE 0 END) as pending_tasks,
         0 as overdue_tasks,
         ROUND(AVG(CASE WHEN t.actual_duration IS NOT NULL THEN t.actual_duration ELSE NULL END)) as avg_completion_time
       FROM admin_proc_task_assignments ta
       INNER JOIN admin_proc_tasks t ON ta.admin_task_id = t.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       WHERE ta.assigned_to = $1 AND t.is_archived = false`,
      [userId]
    );

    // Get admin tasks created by user (المهام اللي أنشأها المستخدم)
    const adminCreatedResult = await pool.query(
      `SELECT 
         COUNT(*) as total_tasks,
         SUM(CASE WHEN ts.name IN ('Done', 'منجز', 'مكتمل') THEN 1 ELSE 0 END) as completed_tasks,
         SUM(CASE WHEN ts.name NOT IN ('Done', 'منجز', 'مكتمل') THEN 1 ELSE 0 END) as pending_tasks,
         0 as overdue_tasks
       FROM admin_proc_tasks t
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       WHERE t.created_by = $1 AND t.is_archived = false`,
      [userId]
    );

    const regularStats = tasksResult.rows[0];
    const adminAssignedStats = adminTasksResult.rows[0];
    const adminCreatedStats = adminCreatedResult.rows[0];

    // Combine all statistics (دمج الإحصائيات)
    const totalTasksAssigned = 
      (parseInt(regularStats.total_tasks) || 0) + 
      (parseInt(adminAssignedStats.total_tasks) || 0) +
      (parseInt(adminCreatedStats.total_tasks) || 0);
    
    const completedTasks = 
      (parseInt(regularStats.completed_tasks) || 0) + 
      (parseInt(adminAssignedStats.completed_tasks) || 0) +
      (parseInt(adminCreatedStats.completed_tasks) || 0);
    
    const pendingTasks = 
      (parseInt(regularStats.pending_tasks) || 0) + 
      (parseInt(adminAssignedStats.pending_tasks) || 0) +
      (parseInt(adminCreatedStats.pending_tasks) || 0);
    
    const overdueTasks = 
      (parseInt(regularStats.overdue_tasks) || 0) + 
      (parseInt(adminAssignedStats.overdue_tasks) || 0) +
      (parseInt(adminCreatedStats.overdue_tasks) || 0);
    
    // Average completion time (متوسط وقت الإنجاز)
    const regularAvg = parseInt(regularStats.avg_completion_time) || 0;
    const adminAvg = parseInt(adminAssignedStats.avg_completion_time) || 0;
    const avgCompletionTime = regularAvg > 0 && adminAvg > 0 
      ? Math.round((regularAvg + adminAvg) / 2)
      : (regularAvg || adminAvg);

    // Calculate on-time percentage
    const onTimePercentage = totalTasksAssigned > 0
      ? Math.round(((totalTasksAssigned - overdueTasks) / totalTasksAssigned) * 100)
      : 0;

    // Get content statistics (regular tasks)
    const contentResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM content WHERE task_id IN (SELECT id FROM tasks WHERE assigned_to = $1)`,
      [userId]
    );

    // Get admin attachments statistics (المرفقات الإدارية)
    const adminAttachmentsResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM admin_proc_task_attachments 
       WHERE admin_task_id IN (
         SELECT admin_task_id FROM admin_proc_task_assignments WHERE assigned_to = $1
         UNION
         SELECT id FROM admin_proc_tasks WHERE created_by = $1
       )`,
      [userId]
    );

    const contentProducedCount = 
      (parseInt(contentResult.rows[0].count) || 0) + 
      (parseInt(adminAttachmentsResult.rows[0].count) || 0);
    
    const contentSizeTotal = 
      (parseInt(contentResult.rows[0].total_size) || 0) + 
      (parseInt(adminAttachmentsResult.rows[0].total_size) || 0);

    // Get AI usage count
    let aiUsageCount = 0;
    try {
      const aiResult = await pool.query(
        `SELECT COUNT(*) as count FROM ai_logs WHERE user_id = $1`,
        [userId]
      );
      aiUsageCount = parseInt(aiResult.rows[0].count) || 0;
    } catch {
      // ai_logs table doesn't exist, default to 0
      aiUsageCount = 0;
    }

    // Upsert user_kpi
    const kpiResult = await pool.query(
      `INSERT INTO user_kpi (user_id, total_tasks_assigned, completed_tasks, pending_tasks, overdue_tasks, average_completion_time, on_time_percentage, content_produced_count, content_size_total, ai_usage_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         total_tasks_assigned = $2,
         completed_tasks = $3,
         pending_tasks = $4,
         overdue_tasks = $5,
         average_completion_time = $6,
         on_time_percentage = $7,
         content_produced_count = $8,
         content_size_total = $9,
         ai_usage_count = $10,
         updated_at = NOW()
       RETURNING *`,
      [userId, totalTasksAssigned, completedTasks, pendingTasks, overdueTasks, avgCompletionTime, onTimePercentage, contentProducedCount, contentSizeTotal, aiUsageCount]
    );

    return kpiResult.rows[0];
  }

  /**
   * Get task KPI
   */
  static async getTaskKPI(taskId: bigint): Promise<TaskKPI | null> {
    const result = await pool.query(
      `SELECT * FROM task_kpi WHERE task_id = $1`,
      [taskId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get order KPI
   */
  static async getOrderKPI(orderId: bigint): Promise<OrderKPI | null> {
    const result = await pool.query(
      `SELECT * FROM order_kpi WHERE order_id = $1`,
      [orderId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get user KPI
   */
  static async getUserKPI(userId: bigint): Promise<UserKPI | null> {
    const result = await pool.query(
      `SELECT * FROM user_kpi WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all orders KPI (for dashboard)
   * عرض كل الموظفين النشطين (38 موظف) حتى لو ما عندهم مهام
   */
  static async getAllUsersKPI(limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      // جلب كل الموظفين النشطين مع حساب مهامهم (عادية + إدارية)
      // حتى لو ما عندهم مهام يظهروا بـ 0 مهام
      const result = await pool.query(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          u.email,
          r.name as role_name,
          COALESCE(task_counts.total, 0) + COALESCE(admin_assigned_counts.total, 0) + COALESCE(admin_created_counts.total, 0) as total_tasks_assigned,
          COALESCE(task_counts.completed, 0) + COALESCE(admin_assigned_counts.completed, 0) + COALESCE(admin_created_counts.completed, 0) as completed_tasks,
          COALESCE(task_counts.pending, 0) + COALESCE(admin_assigned_counts.pending, 0) + COALESCE(admin_created_counts.pending, 0) as pending_tasks,
          COALESCE(task_counts.overdue, 0) + COALESCE(admin_assigned_counts.overdue, 0) + COALESCE(admin_created_counts.overdue, 0) as overdue_tasks,
          0 as average_completion_time,
          0 as content_produced_count,
          0 as content_size_total,
          0 as ai_usage_count,
          CASE 
            WHEN (COALESCE(task_counts.total, 0) + COALESCE(admin_assigned_counts.total, 0) + COALESCE(admin_created_counts.total, 0)) > 0 
            THEN ROUND(
              ((COALESCE(task_counts.completed, 0) + COALESCE(admin_assigned_counts.completed, 0) + COALESCE(admin_created_counts.completed, 0))::numeric / 
               (COALESCE(task_counts.total, 0) + COALESCE(admin_assigned_counts.total, 0) + COALESCE(admin_created_counts.total, 0))) * 100
            )
            ELSE 0 
          END as on_time_percentage
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN LATERAL (
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ts.name IN ('Done', 'منجز')) as completed,
            COUNT(*) FILTER (WHERE ts.name NOT IN ('Done', 'منجز', 'مرفوض')) as pending,
            COUNT(*) FILTER (WHERE t.is_overdue = true) as overdue
          FROM tasks t
          LEFT JOIN task_statuses ts ON t.status_id = ts.id
          WHERE t.assigned_to = u.id
        ) task_counts ON true
        LEFT JOIN LATERAL (
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ts.name IN ('Done', 'منجز', 'مكتمل')) as completed,
            COUNT(*) FILTER (WHERE ts.name NOT IN ('Done', 'منجز', 'مكتمل')) as pending,
            0 as overdue
          FROM admin_proc_task_assignments ata
          INNER JOIN admin_proc_tasks at ON ata.admin_task_id = at.id
          LEFT JOIN task_statuses ts ON at.status_id = ts.id
          WHERE ata.assigned_to = u.id AND at.is_archived = false
        ) admin_assigned_counts ON true
        LEFT JOIN LATERAL (
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE ts.name IN ('Done', 'منجز', 'مكتمل')) as completed,
            COUNT(*) FILTER (WHERE ts.name NOT IN ('Done', 'منجز', 'مكتمل')) as pending,
            0 as overdue
          FROM admin_proc_tasks at
          LEFT JOIN task_statuses ts ON at.status_id = ts.id
          WHERE at.created_by = u.id AND at.is_archived = false
        ) admin_created_counts ON true
        WHERE u.is_active = true
        ORDER BY 
          (COALESCE(task_counts.completed, 0) + COALESCE(admin_assigned_counts.completed, 0) + COALESCE(admin_created_counts.completed, 0)) DESC,
          u.name ASC
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // تحديث/إدراج KPI لكل مستخدم لحفظ البيانات
      for (const user of result.rows) {
        try {
          await pool.query(
            `INSERT INTO user_kpi (user_id, total_tasks_assigned, completed_tasks, pending_tasks, overdue_tasks, average_completion_time, on_time_percentage, content_produced_count, content_size_total, ai_usage_count, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             ON CONFLICT (user_id) DO UPDATE SET
               total_tasks_assigned = $2,
               completed_tasks = $3,
               pending_tasks = $4,
               overdue_tasks = $5,
               average_completion_time = $6,
               on_time_percentage = $7,
               content_produced_count = $8,
               content_size_total = $9,
               ai_usage_count = $10,
               updated_at = NOW()`,
            [
              user.user_id, 
              user.total_tasks_assigned, 
              user.completed_tasks, 
              user.pending_tasks, 
              user.overdue_tasks,
              user.average_completion_time,
              user.on_time_percentage,
              user.content_produced_count,
              user.content_size_total,
              user.ai_usage_count
            ]
          );
        } catch (error) {
          // تجاهل أخطاء الحفظ - المهم عرض البيانات للفرونت اند
        }
      }

      return result.rows;
    } catch (error) {
      console.error('getAllUsersKPI error:', error);
      return [];
    }
  }

  /**
   * Get all orders KPI (for dashboard)
   */
  static async getAllOrdersKPI(limit: number = 50, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT uk.*, u.name as user_name, u.email, r.name as role_name
       FROM user_kpi uk
       INNER JOIN users u ON uk.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY uk.on_time_percentage DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Dashboard summary — ملخص عام لكل الـ KPIs
   * يدعم فلترة بالفترة الزمنية
   */
  static async getDashboardSummary(from?: Date, to?: Date): Promise<any> {
    const dateFilter = from && to ? ' AND o.created_at BETWEEN $1 AND $2' : '';
    const taskDateFilter = from && to ? ' AND t.created_at BETWEEN $1 AND $2' : '';
    const dateParams = from && to ? [from, to] : [];

    try {
      // تشغيل الـ queries الأساسية بالتوازي
      const [ordersResult, tasksResult, usersResult, contentResult, typesResult, byDeskResult] = await Promise.all([
        pool.query(
          'SELECT' +
          ' COUNT(*) as total_orders,' +
          " SUM(CASE WHEN os.name IN ('Done', 'مكتمل', 'منجز') THEN 1 ELSE 0 END) as completed_orders," +
          " SUM(CASE WHEN os.name IN ('In Progress', 'قيد التنفيذ') THEN 1 ELSE 0 END) as in_progress_orders," +
          " SUM(CASE WHEN os.name IN ('Pending', 'Created', 'مسودة', 'بانتظار المراجعة', 'معلق') THEN 1 ELSE 0 END) as pending_orders," +
          ' SUM(CASE WHEN o.is_overdue = true THEN 1 ELSE 0 END) as overdue_orders' +
          ' FROM orders o LEFT JOIN order_statuses os ON o.status_id = os.id' +
          ' WHERE 1=1' + dateFilter,
          dateParams
        ),
        pool.query(
          'SELECT' +
          ' COUNT(*) as total_tasks,' +
          " SUM(CASE WHEN ts.name IN ('Done', 'منجز') THEN 1 ELSE 0 END) as completed_tasks," +
          " SUM(CASE WHEN ts.name IN ('In Progress', 'قيد التنفيذ') THEN 1 ELSE 0 END) as in_progress_tasks," +
          " SUM(CASE WHEN ts.name IN ('Pending', 'غير مُسند', 'تم الإسناد') THEN 1 ELSE 0 END) as pending_tasks," +
          ' SUM(CASE WHEN t.is_overdue = true THEN 1 ELSE 0 END) as overdue_tasks' +
          ' FROM tasks t LEFT JOIN task_statuses ts ON t.status_id = ts.id' +
          ' WHERE 1=1' + taskDateFilter,
          dateParams
        ),
        pool.query('SELECT COUNT(*) as total_users FROM users WHERE is_active = true'),
        pool.query(`SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_archived = true) as archived FROM content`),
        pool.query(`SELECT ct.name, COUNT(c.id) as count FROM content c LEFT JOIN content_types ct ON c.content_type_id = ct.id GROUP BY ct.name ORDER BY count DESC`),
        pool.query(`SELECT d.name, COUNT(c.id) as count FROM desks d LEFT JOIN orders o ON o.desk_id = d.id LEFT JOIN tasks t ON t.order_id = o.id LEFT JOIN content c ON c.task_id = t.id GROUP BY d.name HAVING COUNT(c.id) > 0 ORDER BY count DESC`),
      ]);

      const orders = ordersResult.rows[0];
      const tasks = tasksResult.rows[0];
      const content = contentResult.rows[0];

      // حساب حجم الملفات من admin attachments (task_attachments ما فيها file_size)
      let totalSizeMB = 0;
      try {
        const sizeRes = await pool.query(`SELECT COALESCE(SUM(file_size), 0) as s FROM admin_proc_task_attachments WHERE file_size > 0`);
        totalSizeMB = Math.round((parseInt(sizeRes.rows[0]?.s) || 0) / 1024 / 1024);
      } catch { /* ignore */ }

      return {
        orders: {
          total: parseInt(orders.total_orders) || 0,
          completed: parseInt(orders.completed_orders) || 0,
          in_progress: parseInt(orders.in_progress_orders) || 0,
          pending: parseInt(orders.pending_orders) || 0,
          overdue: parseInt(orders.overdue_orders) || 0,
          completion_rate: orders.total_orders > 0
            ? Math.round((parseInt(orders.completed_orders) / parseInt(orders.total_orders)) * 100)
            : 0,
        },
        tasks: {
          total: parseInt(tasks.total_tasks) || 0,
          completed: parseInt(tasks.completed_tasks) || 0,
          in_progress: parseInt(tasks.in_progress_tasks) || 0,
          pending: parseInt(tasks.pending_tasks) || 0,
          overdue: parseInt(tasks.overdue_tasks) || 0,
          completion_rate: tasks.total_tasks > 0
            ? Math.round((parseInt(tasks.completed_tasks) / parseInt(tasks.total_tasks)) * 100)
            : 0,
        },
        content: {
          total: parseInt(content.total) || 0,
          archived: parseInt(content.archived) || 0,
          total_size_mb: totalSizeMB,
          types: typesResult.rows.map((r: any) => ({ name: r.name || 'غير محدد', count: parseInt(r.count) })),
          byDesk: byDeskResult.rows.map((r: any) => ({ name: r.name, count: parseInt(r.count) })),
        },
        users: {
          total: parseInt(usersResult.rows[0].total_users) || 0,
        },
        performance: {
          avg_task_duration_minutes: 0,
          on_time_percentage: tasks.total_tasks > 0
            ? Math.round((parseInt(tasks.completed_tasks) / parseInt(tasks.total_tasks)) * 100)
            : 0,
        },
        top_performers: [],
        reuse: { total_reuses: 0, top_reused: [] },
      };
    } catch (error) {
      console.error('getDashboardSummary error:', error);
      throw error;
    }
  }

  /**
   * Reuse statistics for dashboard
   */
  static async getReuseStats(): Promise<any> {
    const result = await pool.query(
      "SELECT COUNT(*) as total_reuses FROM content_tasks WHERE usage_type = 'reuse'"
    );
    const topResult = await pool.query(
      "SELECT c.id, c.title, COUNT(cta.task_id) as reuse_count " +
      "FROM content c " +
      "INNER JOIN content_tasks cta ON c.id = cta.content_id AND cta.usage_type = 'reuse' " +
      "GROUP BY c.id, c.title " +
      "ORDER BY reuse_count DESC LIMIT 5"
    );
    return {
      total_reuses: parseInt(result.rows[0].total_reuses) || 0,
      top_reused: topResult.rows,
    };
  }

  /**
   * Monthly trends — مقارنات شهرية
   */
  static async getMonthlyTrends(months: number = 6): Promise<any[]> {
    const result = await pool.query(
      "SELECT" +
      " TO_CHAR(DATE_TRUNC('month', o.created_at), 'YYYY-MM') as month," +
      " COUNT(DISTINCT o.id) as orders," +
      " COUNT(DISTINCT t.id) as tasks," +
      " COUNT(DISTINCT c.id) as content" +
      " FROM orders o" +
      " LEFT JOIN tasks t ON t.order_id = o.id" +
      " LEFT JOIN content c ON c.task_id = t.id" +
      " WHERE o.created_at >= NOW() - ($1 || ' months')::INTERVAL" +
      " GROUP BY DATE_TRUNC('month', o.created_at)" +
      " ORDER BY month DESC",
      [months]
    );
    return result.rows;
  }

  /**
   * Recalculate all KPIs (manual trigger)
   */
  static async recalculateAllKPIs(): Promise<{ tasks: number; orders: number; users: number }> {
    let taskCount = 0;
    let orderCount = 0;
    let userCount = 0;

    // Recalculate all completed tasks
    const completedTasks = await pool.query(
      `SELECT id FROM tasks WHERE completed_at IS NOT NULL`
    );
    for (const task of completedTasks.rows) {
      try {
        await this.calculateTaskKPI(task.id);
        taskCount++;
      } catch { /* skip failed */ }
    }

    // Recalculate all orders
    const allOrders = await pool.query('SELECT id FROM orders');
    for (const order of allOrders.rows) {
      try {
        await this.calculateOrderKPI(order.id);
        orderCount++;
      } catch { /* skip failed */ }
    }

    const usersWithTasks = await pool.query(
      'SELECT DISTINCT assigned_to as user_id FROM tasks WHERE assigned_to IS NOT NULL'
    );
    for (const user of usersWithTasks.rows) {
      try {
        await this.calculateUserKPI(user.user_id);
        userCount++;
      } catch { /* skip failed */ }
    }

    return { tasks: taskCount, orders: orderCount, users: userCount };
  }
}
