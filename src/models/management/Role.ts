import pool from '../../config/database';
import { Role, CreateRoleDTO, UpdateRoleDTO } from '../../types/management';

export class RoleModel {
  static async findById(id: bigint): Promise<Role | null> {
    const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(): Promise<Role[]> {
    const result = await pool.query('SELECT * FROM roles ORDER BY name ASC');
    return result.rows;
  }

  static async findByName(name: string): Promise<Role | null> {
    const result = await pool.query('SELECT * FROM roles WHERE name = $1', [name]);
    return result.rows[0] || null;
  }

  static async create(data: CreateRoleDTO): Promise<Role> {
    const result = await pool.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       RETURNING *`,
      [data.name, data.description || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, data: UpdateRoleDTO): Promise<Role | null> {
    const fields = Object.keys(data).filter(key => (data as any)[key] !== undefined);
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => (data as any)[field]);
    values.push(id);

    const result = await pool.query(
      `UPDATE roles SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM roles WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
