import pool from '../../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../../types/management';

export class UserModel {
  static async findById(id: bigint): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  static async findByTeam(teamId: bigint): Promise<User[]> {
    const result = await pool.query(
      `SELECT u.* FROM users u
       INNER JOIN team_users tu ON u.id = tu.user_id
       WHERE tu.team_id = $1
       ORDER BY u.name ASC`,
      [teamId]
    );
    return result.rows;
  }

  static async findWithRole(id: bigint): Promise<any> {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.description as role_description
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAllWithRoles(limit: number = 100, offset: number = 0): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.*, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.name ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async create(data: CreateUserDTO): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (name, email, role_id, work_days, start_time, end_time)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.name, data.email, data.role_id || null, data.work_days || null, data.start_time || null, data.end_time || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<User>): Promise<User | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(', ');
    const values = fields.map(field => (updates as any)[field]);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
