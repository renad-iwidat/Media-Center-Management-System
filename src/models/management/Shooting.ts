import pool from '../../config/database';
import { Shooting } from '../../types/management';

export class ShootingModel {
  static async findById(id: bigint): Promise<Shooting | null> {
    const result = await pool.query('SELECT * FROM shootings WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Shooting[]> {
    const result = await pool.query(
      'SELECT * FROM shootings ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByOrder(orderId: bigint): Promise<Shooting[]> {
    const result = await pool.query(
      'SELECT * FROM shootings WHERE order_id = $1 ORDER BY created_at DESC',
      [orderId]
    );
    return result.rows;
  }

  static async findByTask(taskId: bigint): Promise<Shooting[]> {
    const result = await pool.query(
      'SELECT * FROM shootings WHERE task_id = $1 ORDER BY created_at DESC',
      [taskId]
    );
    return result.rows;
  }

  static async findByCreator(userId: bigint, limit: number = 10, offset: number = 0): Promise<Shooting[]> {
    const result = await pool.query(
      'SELECT * FROM shootings WHERE created_by = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async create(shooting: Omit<Shooting, 'id' | 'created_at'>): Promise<Shooting> {
    const result = await pool.query(
      `INSERT INTO shootings (order_id, task_id, location, start_time, end_time, equipment, crew, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [shooting.order_id, shooting.task_id, shooting.location, shooting.start_time, shooting.end_time, shooting.equipment, shooting.crew, shooting.notes, shooting.created_by]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Shooting>): Promise<Shooting | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Shooting]);
    values.push(id);

    const result = await pool.query(
      `UPDATE shootings SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM shootings WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
