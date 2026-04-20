import pool from '../../config/database';
import { Program } from '../../types/content';

export class ProgramModel {
  static async findById(id: bigint): Promise<Program | null> {
    const result = await pool.query('SELECT * FROM programs WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 10, offset: number = 0): Promise<Program[]> {
    const result = await pool.query(
      'SELECT * FROM programs ORDER BY title ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByMediaUnit(mediaUnitId: bigint, limit: number = 10, offset: number = 0): Promise<Program[]> {
    const result = await pool.query(
      'SELECT * FROM programs WHERE media_unit_id = $1 ORDER BY title ASC LIMIT $2 OFFSET $3',
      [mediaUnitId, limit, offset]
    );
    return result.rows;
  }

  static async create(program: Omit<Program, 'id' | 'created_at'>): Promise<Program> {
    const result = await pool.query(
      `INSERT INTO programs (title, description, media_unit_id, air_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [program.title, program.description, program.media_unit_id, program.air_time]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Program>): Promise<Program | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Program]);
    values.push(id);

    const result = await pool.query(
      `UPDATE programs SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM programs WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
