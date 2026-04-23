import pool from '../../config/database';
import { MediaUnit, CreateMediaUnitDTO, UpdateMediaUnitDTO } from '../../types/management';

export class MediaUnitModel {
  static async findById(id: bigint): Promise<MediaUnit | null> {
    const result = await pool.query('SELECT * FROM media_units WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<MediaUnit[]> {
    const result = await pool.query(
      'SELECT * FROM media_units ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async create(data: CreateMediaUnitDTO): Promise<MediaUnit> {
    const result = await pool.query(
      `INSERT INTO media_units (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [data.name, data.description || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, data: UpdateMediaUnitDTO): Promise<MediaUnit | null> {
    const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => (data as any)[field]);
    values.push(id);

    const result = await pool.query(
      `UPDATE media_units SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM media_units WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
