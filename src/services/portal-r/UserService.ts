/**
 * User Service
 * Handles all user-related database operations
 */

import { getPool } from '../../config/database';
import { User, CreateUserDTO, UpdateUserDTO } from '../../models/portal-r';

export class UserService {
  private pool = getPool();

  /**
   * Get all users
   */
  async getAllUsers(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, u.work_days, u.start_time, u.end_time, u.created_at,
             r.name as role_name
      FROM public.users u
      LEFT JOIN public.roles r ON u.role_id = r.id
      ORDER BY u.name
    `);
    console.log('🔍 getAllUsers query result:', result.rows);
    return result.rows;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: bigint): Promise<User | null> {
    const result = await this.pool.query(`
      SELECT id, name, email, role_id, work_days, start_time, end_time, created_at
      FROM public.users
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query(`
      SELECT id, name, email, role_id, work_days, start_time, end_time, created_at
      FROM public.users
      WHERE email = $1
    `, [email]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user
   */
  async createUser(data: CreateUserDTO): Promise<any> {
    const result = await this.pool.query(`
      INSERT INTO public.users (name, email, role_id, work_days, start_time, end_time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, email, role_id, work_days, start_time, end_time, created_at
    `, [
      data.name,
      data.email,
      data.role_id || null,
      data.work_days || null,
      data.start_time || null,
      data.end_time || null,
    ]);
    
    // Get the created user with role name
    const user = result.rows[0];
    if (user && user.role_id) {
      const roleResult = await this.pool.query(`
        SELECT name as role_name FROM public.roles WHERE id = $1
      `, [user.role_id]);
      if (roleResult.rows[0]) {
        user.role_name = roleResult.rows[0].role_name;
      }
    }
    return user;
  }

  /**
   * Update a user
   */
  async updateUser(id: bigint, data: UpdateUserDTO): Promise<any> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(data.email);
    }
    if (data.role_id !== undefined) {
      updates.push(`role_id = $${paramCount++}`);
      values.push(data.role_id);
    }
    if (data.work_days !== undefined) {
      updates.push(`work_days = $${paramCount++}`);
      values.push(data.work_days);
    }
    if (data.start_time !== undefined) {
      updates.push(`start_time = $${paramCount++}`);
      values.push(data.start_time);
    }
    if (data.end_time !== undefined) {
      updates.push(`end_time = $${paramCount++}`);
      values.push(data.end_time);
    }

    if (updates.length === 0) return this.getUserById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, email, role_id, work_days, start_time, end_time, created_at
    `, values);

    // Get the updated user with role name
    const user = result.rows[0];
    if (user && user.role_id) {
      const roleResult = await this.pool.query(`
        SELECT name as role_name FROM public.roles WHERE id = $1
      `, [user.role_id]);
      if (roleResult.rows[0]) {
        user.role_name = roleResult.rows[0].role_name;
      }
    }
    return user || null;
  }

  /**
   * Delete a user
   */
  async deleteUser(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.users
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get users by team
   */
  async getUsersByTeamId(teamId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, u.work_days, u.start_time, u.end_time, u.created_at,
             r.name as role_name
      FROM public.users u
      INNER JOIN public.team_users tu ON u.id = tu.user_id
      LEFT JOIN public.roles r ON u.role_id = r.id
      WHERE tu.team_id = $1
      ORDER BY u.name
    `, [teamId]);
    return result.rows;
  }

  /**
   * Get user with role details
   */
  async getUserWithRole(id: bigint): Promise<any> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, u.work_days, u.start_time, u.end_time, u.created_at,
             r.name as role_name, r.description as role_description
      FROM public.users u
      LEFT JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [id]);
    return result.rows[0] || null;
  }
}
