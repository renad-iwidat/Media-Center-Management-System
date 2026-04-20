import pool from '../../config/database';
import { Order, OrderStatus, OrderHistory } from '../../types/management';

export class OrderModel {
  static async findById(id: bigint): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByDesk(deskId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE desk_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [deskId, limit, offset]
    );
    return result.rows;
  }

  static async findByStatus(statusId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE status_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [statusId, limit, offset]
    );
    return result.rows;
  }

  static async findByProgram(programId: bigint, limit: number = 10, offset: number = 0): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders WHERE program_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [programId, limit, offset]
    );
    return result.rows;
  }

  static async create(order: Omit<Order, 'id' | 'created_at'>): Promise<Order> {
    const result = await pool.query(
      `INSERT INTO orders (title, description, desk_id, media_unit_id, program_id, episode_id, status_id, priority_id, deadline, created_by, started_at, completed_at, is_overdue, is_archived, archived_at, quality_score, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       RETURNING *`,
      [order.title, order.description || null, order.desk_id || null, order.media_unit_id || null, order.program_id || null, order.episode_id || null, order.status_id || null, order.priority_id || null, order.deadline || null, order.created_by || null, order.started_at || null, order.completed_at || null, order.is_overdue ?? false, order.is_archived ?? false, order.archived_at || null, order.quality_score || null, order.notes || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Order>): Promise<Order | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Order]);
    values.push(id);

    const result = await pool.query(
      `UPDATE orders SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async getStatuses(): Promise<OrderStatus[]> {
    const result = await pool.query('SELECT * FROM order_statuses');
    return result.rows;
  }

  static async getHistory(orderId: bigint): Promise<OrderHistory[]> {
    const result = await pool.query(
      'SELECT * FROM order_history WHERE order_id = $1 ORDER BY changed_at DESC',
      [orderId]
    );
    return result.rows;
  }

  static async addHistory(history: Omit<OrderHistory, 'id' | 'changed_at'>): Promise<OrderHistory> {
    const result = await pool.query(
      `INSERT INTO order_history (order_id, changed_by, old_status_id, new_status_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [history.order_id, history.changed_by, history.old_status_id, history.new_status_id]
    );
    return result.rows[0];
  }
}
