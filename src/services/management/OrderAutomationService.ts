import pool from '../../config/database';
import { Order } from '../../types/management';
import { KPIService } from './KPIService';

export class OrderAutomationService {
  /**
   * Handle order status change
   * Automatically updates timestamps and calculates KPI
   */
  static async handleOrderStatusChange(
    orderId: bigint,
    newStatusId: bigint,
    changedBy: bigint
  ): Promise<Order> {
    // Get current order
    const orderResult = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = orderResult.rows[0];
    const oldStatusId = order.status_id;

    // Get status names
    const newStatusResult = await pool.query(
      `SELECT name FROM order_statuses WHERE id = $1`,
      [newStatusId]
    );

    const newStatusName = newStatusResult.rows[0]?.name;

    let updates: any = { status_id: newStatusId };

    // Handle "In Progress" status
    if (newStatusName === 'In Progress' && !order.started_at) {
      updates.started_at = new Date();
    }

    // Handle "Done" status
    if (newStatusName === 'Done' && !order.completed_at) {
      updates.completed_at = new Date();

      // Calculate actual duration
      if (order.started_at) {
        const startedAt = new Date(order.started_at);
        const completedAt = new Date();
        const durationMinutes = Math.round((completedAt.getTime() - startedAt.getTime()) / 60000);
        updates.actual_duration = durationMinutes;
      }

      // Check if overdue
      if (order.deadline) {
        const deadline = new Date(order.deadline);
        const completedAt = new Date();
        updates.is_overdue = completedAt > deadline;
      }
    }

    // Update order
    const updateFields = Object.keys(updates);
    const setClause = updateFields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = updateFields.map(field => updates[field]);
    values.push(orderId);

    const updatedOrderResult = await pool.query(
      `UPDATE orders SET ${setClause} WHERE id = $${updateFields.length + 1} RETURNING *`,
      values
    );

    const updatedOrder = updatedOrderResult.rows[0];

    // Add to order_history
    await pool.query(
      `INSERT INTO order_history (order_id, old_status_id, new_status_id, changed_by, changed_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [orderId, oldStatusId, newStatusId, changedBy]
    );

    // Calculate KPI
    await KPIService.calculateOrderKPI(orderId);

    return updatedOrder;
  }

  /**
   * Handle order archiving
   * Automatically sets archive flags and timestamps
   */
  static async handleOrderArchive(
    orderId: bigint,
    archivedBy: bigint
  ): Promise<Order> {
    const result = await pool.query(
      `UPDATE orders SET is_archived = true, archived_at = NOW() WHERE id = $1 RETURNING *`,
      [orderId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    // Archive all content associated with this order's tasks
    await pool.query(
      `UPDATE content SET is_archived = true, archived_at = NOW()
       WHERE task_id IN (SELECT id FROM tasks WHERE order_id = $1)`,
      [orderId]
    );

    return result.rows[0];
  }

  /**
   * Get order with all related data
   */
  static async getOrderWithRelations(orderId: bigint): Promise<any> {
    const orderResult = await pool.query(
      `SELECT o.*, os.name as status_name, pl.name as priority_name
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN priority_levels pl ON o.priority_id = pl.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get all tasks
    const tasksResult = await pool.query(
      `SELECT t.*, ts.name as status_name, pl.name as priority_name, u.name as assigned_to_name
       FROM tasks t
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       LEFT JOIN priority_levels pl ON t.priority_id = pl.id
       LEFT JOIN users u ON t.assigned_to = u.id
       WHERE t.order_id = $1
       ORDER BY t.sequence_order ASC`,
      [orderId]
    );

    // Get all content
    const contentResult = await pool.query(
      `SELECT c.*, ct.name as content_type_name, cs.name as status_name
       FROM content c
       LEFT JOIN content_types ct ON c.content_type_id = ct.id
       LEFT JOIN content_statuses cs ON c.status_id = cs.id
       WHERE c.task_id IN (SELECT id FROM tasks WHERE order_id = $1)
       ORDER BY c.created_at DESC`,
      [orderId]
    );

    // Get order history
    const historyResult = await pool.query(
      `SELECT oh.*, os.name as status_name, u.name as changed_by_name
       FROM order_history oh
       LEFT JOIN order_statuses os ON oh.new_status_id = os.id
       LEFT JOIN users u ON oh.changed_by = u.id
       WHERE oh.order_id = $1
       ORDER BY oh.changed_at DESC`,
      [orderId]
    );

    // Get order KPI
    const kpiResult = await pool.query(
      `SELECT * FROM order_kpi WHERE order_id = $1`,
      [orderId]
    );

    return {
      ...order,
      tasks: tasksResult.rows,
      content: contentResult.rows,
      history: historyResult.rows,
      kpi: kpiResult.rows[0] || null
    };
  }

  /**
   * Get order statistics
   */
  static async getOrderStatistics(orderId: bigint): Promise<any> {
    const kpiResult = await pool.query(
      `SELECT * FROM order_kpi WHERE order_id = $1`,
      [orderId]
    );

    if (kpiResult.rows.length === 0) {
      return null;
    }

    const kpi = kpiResult.rows[0];

    // Calculate completion percentage
    const completionPercentage = kpi.total_tasks > 0
      ? Math.round((kpi.completed_tasks / kpi.total_tasks) * 100)
      : 0;

    return {
      ...kpi,
      completion_percentage: completionPercentage,
      content_size_mb: Math.round(kpi.content_size_total / 1024 / 1024),
      status: kpi.is_overdue ? 'Overdue' : (kpi.is_on_time ? 'On Time' : 'In Progress')
    };
  }

  /**
   * Get all orders with KPI
   */
  static async getAllOrdersWithKPI(limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT o.*, os.name as status_name, ok.*, 
              ROUND((ok.completed_tasks::float / NULLIF(ok.total_tasks, 0)) * 100) as completion_percentage
       FROM orders o
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN order_kpi ok ON o.id = ok.order_id
       ORDER BY o.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }
}
