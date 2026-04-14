/**
 * Program Role Service
 * Handles all program role-related database operations
 */

import { getPool } from '../../config/database';
import { ProgramRole, CreateProgramRoleDTO, UpdateProgramRoleDTO } from '../../models/portal-r';

export class ProgramRoleService {
  private pool = getPool();

  /**
   * Get all program roles with joined data
   */
  async getAllProgramRoles(): Promise<ProgramRole[]> {
    const result = await this.pool.query(`
      SELECT 
        pr.id, 
        pr.program_id, 
        pr.user_id, 
        pr.role_id, 
        pr.created_at,
        r.name as role_name,
        u.name as user_name,
        p.title as program_name
      FROM public.program_roles pr
      INNER JOIN public.roles r ON pr.role_id = r.id
      INNER JOIN public.users u ON pr.user_id = u.id
      INNER JOIN public.programs p ON pr.program_id = p.id
      ORDER BY pr.created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get program role by ID
   */
  async getProgramRoleById(id: bigint): Promise<ProgramRole | null> {
    const result = await this.pool.query(`
      SELECT 
        pr.id, 
        pr.program_id, 
        pr.user_id, 
        pr.role_id, 
        pr.created_at,
        r.name as role_name,
        u.name as user_name,
        p.title as program_name
      FROM public.program_roles pr
      INNER JOIN public.roles r ON pr.role_id = r.id
      INNER JOIN public.users u ON pr.user_id = u.id
      INNER JOIN public.programs p ON pr.program_id = p.id
      WHERE pr.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get roles by program
   */
  async getRolesByProgramId(programId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        pr.id, 
        pr.program_id, 
        pr.user_id, 
        pr.role_id, 
        pr.created_at,
        r.name as role_name,
        u.name as user_name,
        u.email
      FROM public.program_roles pr
      INNER JOIN public.roles r ON pr.role_id = r.id
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1
      ORDER BY r.name, u.name
    `, [programId]);
    return result.rows;
  }

  /**
   * Get roles by user
   */
  async getRolesByUserId(userId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT 
        pr.id, 
        pr.program_id, 
        pr.user_id, 
        pr.role_id, 
        pr.created_at,
        r.name as role_name,
        p.title as program_name
      FROM public.program_roles pr
      INNER JOIN public.roles r ON pr.role_id = r.id
      INNER JOIN public.programs p ON pr.program_id = p.id
      WHERE pr.user_id = $1
      ORDER BY p.title
    `, [userId]);
    return result.rows;
  }

  /**
   * Create a new program role
   */
  async createProgramRole(data: CreateProgramRoleDTO): Promise<ProgramRole> {
    const result = await this.pool.query(`
      INSERT INTO public.program_roles (program_id, user_id, role_id)
      VALUES ($1, $2, $3)
      RETURNING id, program_id, user_id, role_id, created_at
    `, [data.program_id, data.user_id, data.role_id]);
    
    // Get full data with joins
    return this.getProgramRoleById(result.rows[0].id) as Promise<ProgramRole>;
  }

  /**
   * Update a program role
   */
  async updateProgramRole(id: bigint, data: UpdateProgramRoleDTO): Promise<ProgramRole | null> {
    if (data.role_id === undefined) return this.getProgramRoleById(id);

    const result = await this.pool.query(`
      UPDATE public.program_roles
      SET role_id = $1
      WHERE id = $2
      RETURNING id
    `, [data.role_id, id]);

    if (result.rows.length === 0) return null;
    
    // Get full data with joins
    return this.getProgramRoleById(id);
  }

  /**
   * Delete a program role
   */
  async deleteProgramRole(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.program_roles
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if user has role in program
   */
  async userHasRoleInProgram(programId: bigint, userId: bigint, roleId: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      SELECT id FROM public.program_roles
      WHERE program_id = $1 AND user_id = $2 AND role_id = $3
    `, [programId, userId, roleId]);
    return result.rows.length > 0;
  }

  /**
   * Get users by program and role
   */
  async getUsersByProgramAndRole(programId: bigint, roleId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email
      FROM public.program_roles pr
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1 AND pr.role_id = $2
      ORDER BY u.name
    `, [programId, roleId]);
    return result.rows;
  }
}
