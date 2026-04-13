/**
 * Desk Service
 * Handles all desk-related database operations
 */

import { getPool } from '../../config/database';
import { Desk, CreateDeskDTO, UpdateDeskDTO } from '../../models/portal-r';

export class DeskService {
  private pool = getPool();

  /**
   * Get all desks
   */
  async getAllDesks(): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT d.id, d.name, d.description, d.manager_id, d.created_at,
             u.name as manager_name
      FROM public.desks d
      LEFT JOIN public.users u ON d.manager_id = u.id
      ORDER BY d.created_at DESC
    `);
    console.log('🔍 getAllDesks query result:', JSON.stringify(result.rows, null, 2));
    return result.rows;
  }

  /**
   * Get desk by ID
   */
  async getDeskById(id: bigint): Promise<any> {
    const result = await this.pool.query(`
      SELECT d.id, d.name, d.description, d.manager_id, d.created_at,
             u.name as manager_name
      FROM public.desks d
      LEFT JOIN public.users u ON d.manager_id = u.id
      WHERE d.id = $1
    `, [id]);
    console.log('🔍 getDeskById result:', JSON.stringify(result.rows[0], null, 2));
    return result.rows[0] || null;
  }

  /**
   * Create a new desk
   */
  async createDesk(data: CreateDeskDTO): Promise<Desk> {
    const result = await this.pool.query(`
      INSERT INTO public.desks (name, description, manager_id)
      VALUES ($1, $2, $3)
      RETURNING id, name, description, manager_id, created_at
    `, [data.name, data.description || null, data.manager_id || null]);
    return result.rows[0];
  }

  /**
   * Update a desk
   */
  async updateDesk(id: bigint, data: UpdateDeskDTO): Promise<Desk | null> {
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
    if (data.manager_id !== undefined) {
      updates.push(`manager_id = $${paramCount++}`);
      values.push(data.manager_id);
    }

    if (updates.length === 0) return this.getDeskById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.desks
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, name, description, manager_id, created_at
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete a desk
   */
  async deleteDesk(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.desks
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get desk with teams
   */
  async getDeskWithTeams(id: bigint): Promise<any> {
    const desk = await this.getDeskById(id);
    if (!desk) return null;

    const teamsResult = await this.pool.query(`
      SELECT id, desk_id, name, manager_id, created_at
      FROM public.teams
      WHERE desk_id = $1
      ORDER BY created_at DESC
    `, [id]);

    return {
      ...desk,
      teams: teamsResult.rows,
    };
  }
}
