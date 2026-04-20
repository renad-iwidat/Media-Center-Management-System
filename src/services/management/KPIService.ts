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
   */
  static async calculateUserKPI(userId: bigint): Promise<UserKPI> {
    // Get task statistics
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

    const taskStats = tasksResult.rows[0];
    const totalTasksAssigned = parseInt(taskStats.total_tasks) || 0;
    const completedTasks = parseInt(taskStats.completed_tasks) || 0;
    const pendingTasks = parseInt(taskStats.pending_tasks) || 0;
    const overdueTasks = parseInt(taskStats.overdue_tasks) || 0;
    const avgCompletionTime = parseInt(taskStats.avg_completion_time) || 0;

    // Calculate on-time percentage
    const onTimePercentage = totalTasksAssigned > 0
      ? Math.round(((totalTasksAssigned - overdueTasks) / totalTasksAssigned) * 100)
      : 0;

    // Get content statistics
    const contentResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(file_size), 0) as total_size
       FROM content WHERE task_id IN (SELECT id FROM tasks WHERE assigned_to = $1)`,
      [userId]
    );

    const contentProducedCount = parseInt(contentResult.rows[0].count) || 0;
    const contentSizeTotal = parseInt(contentResult.rows[0].total_size) || 0;

    // Get AI usage count
    const aiResult = await pool.query(
      `SELECT COUNT(*) as count FROM ai_logs WHERE user_id = $1`,
      [userId]
    );

    const aiUsageCount = parseInt(aiResult.rows[0].count) || 0;

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
}
