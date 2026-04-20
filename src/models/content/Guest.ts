import pool from '../../config/database';
import { Guest } from '../../types/content';

export class GuestModel {
  static async findById(id: bigint): Promise<Guest | null> {
    const result = await pool.query('SELECT * FROM guests WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Guest[]> {
    const result = await pool.query(
      'SELECT * FROM guests ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async search(query: string, limit: number = 10): Promise<Guest[]> {
    const result = await pool.query(
      `SELECT * FROM guests 
       WHERE name ILIKE $1 OR title ILIKE $1 OR bio ILIKE $1
       ORDER BY name ASC LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }

  static async create(guest: Omit<Guest, 'id' | 'created_at'>): Promise<Guest> {
    const result = await pool.query(
      `INSERT INTO guests (name, title, bio, phone)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [guest.name, guest.title, guest.bio, guest.phone]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Guest>): Promise<Guest | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Guest]);
    values.push(id);

    const result = await pool.query(
      `UPDATE guests SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM guests WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
