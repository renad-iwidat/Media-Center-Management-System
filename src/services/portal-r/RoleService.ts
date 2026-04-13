/**
 * Role Service
 * Handles all role-related database operations
 */

import { getPool } from '../../config/database';
import { Role, CreateRoleDTO, UpdateRoleDTO } from '../../models/portal-r';

export class RoleService {
  private pool = getPool();

  /**
   * Get all roles
   */
  async getAllRoles(): Promise<Role[]> {
    const result = await this.pool.query(`
      SELECT id, name, description
      FROM public.roles
      ORDER BY name
    `);
    return result.rows;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: bigint): Promise<Role | null> {
    const result = await this.pool.query(`
      SELECT id, name, description
      FROM public.roles
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleDTO): Promise<Role> {
    const result = await this.pool.query(`
      INSERT INTO public.roles (name, description)
      VALUES ($1, $2)
      RETURNING id, name, description
    `, [data.name, data.description || null]);
    return result.rows[0];
  }

  /**
   * Update a role
   */
  async updateRole(id: bigint, data: UpdateRoleDTO): Promise<Role | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }

    if (updates.length === 0) return this.getRoleById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.roles
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete a role
   */
  async deleteRole(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.roles
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
