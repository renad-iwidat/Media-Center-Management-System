import pool from '../../config/database';
import { Order, OrderStatus, OrderHistory } from '../../types/management';

export class OrderModel {
  static async findById(id: bigint): Promise<Order | null> {
    const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByIdWithDetails(id: bigint): Promise<any | null> {
    const result = await pool.query(
      `SELECT 
        o.*,
        u.name as created_by_name,
        d.name as desk_name,
        os.name as status_name,
        pl.name as priority_name,
        pr.title as program_name,
        e.title as episode_title
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       LEFT JOIN desks d ON o.desk_id = d.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN priority_levels pl ON o.priority_id = pl.id
       LEFT JOIN programs pr ON o.program_id = pr.id
       LEFT JOIN episodes e ON o.episode_id = e.id
       WHERE o.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Order[]> {
    const result = await pool.query(
      'SELECT * FROM orders ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findAllWithDetails(limit: number = 10, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT 
        o.*,
        u.name as created_by_name,
        d.name as desk_name,
        os.name as status_name,
        pl.name as priority_name,
        pr.title as program_name,
        e.title as episode_title
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       LEFT JOIN desks d ON o.desk_id = d.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN priority_levels pl ON o.priority_id = pl.id
       LEFT JOIN programs pr ON o.program_id = pr.id
       LEFT JOIN episodes e ON o.episode_id = e.id
       ORDER BY o.created_at DESC 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async searchWithDetails(
    limit: number = 10,
    offset: number = 0,
    search: string = '',
    desk_id?: bigint,
    status_id?: bigint,
    program_id?: bigint
  ): Promise<any[]> {
    let query = `SELECT 
      o.*,
      u.name as created_by_name,
      d.name as desk_name,
      os.name as status_name,
      pl.name as priority_name,
      pr.title as program_name,
      e.title as episode_title
     FROM orders o
     LEFT JOIN users u ON o.created_by = u.id
     LEFT JOIN desks d ON o.desk_id = d.id
     LEFT JOIN order_statuses os ON o.status_id = os.id
     LEFT JOIN priority_levels pl ON o.priority_id = pl.id
     LEFT JOIN programs pr ON o.program_id = pr.id
     LEFT JOIN episodes e ON o.episode_id = e.id
     WHERE 1=1`;

    const params: any[] = [];
    let paramIndex = 1;

    // Search by title or description
    if (search) {
      query += ` AND (o.title ILIKE $${paramIndex} OR o.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Filter by desk
    if (desk_id) {
      query += ` AND o.desk_id = $${paramIndex}`;
      params.push(desk_id);
      paramIndex++;
    }

    // Filter by status
    if (status_id) {
      query += ` AND o.status_id = $${paramIndex}`;
      params.push(status_id);
      paramIndex++;
    }

    // Filter by program
    if (program_id) {
      query += ` AND o.program_id = $${paramIndex}`;
      params.push(program_id);
      paramIndex++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
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
      `SELECT 
        oh.*,
        u.name as changed_by_name,
        os_old.name as old_status_name,
        os_new.name as new_status_name
       FROM order_history oh
       LEFT JOIN users u ON oh.changed_by = u.id
       LEFT JOIN order_statuses os_old ON oh.old_status_id = os_old.id
       LEFT JOIN order_statuses os_new ON oh.new_status_id = os_new.id
       WHERE oh.order_id = $1 
       ORDER BY oh.changed_at DESC`,
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
