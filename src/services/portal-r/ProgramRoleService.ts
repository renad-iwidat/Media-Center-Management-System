/**
 * Program Role Service
 * Handles all program role-related database operations
 */

import { getPool } from '../../config/database';
import { ProgramRole, CreateProgramRoleDTO, UpdateProgramRoleDTO } from '../../models/portal-r';

export class ProgramRoleService {
  private pool = getPool();

  /**
   * Get all program roles
   */
  async getAllProgramRoles(): Promise<ProgramRole[]> {
    const result = await this.pool.query(`
      SELECT id, program_id, user_id, role, created_at
      FROM public.program_roles
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get program role by ID
   */
  async getProgramRoleById(id: bigint): Promise<ProgramRole | null> {
    const result = await this.pool.query(`
      SELECT id, program_id, user_id, role, created_at
      FROM public.program_roles
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get roles by program
   */
  async getRolesByProgramId(programId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT pr.id, pr.program_id, pr.user_id, pr.role, pr.created_at,
             u.name, u.email
      FROM public.program_roles pr
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1
      ORDER BY pr.role
    `, [programId]);
    return result.rows;
  }

  /**
   * Get roles by user
   */
  async getRolesByUserId(userId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT pr.id, pr.program_id, pr.user_id, pr.role, pr.created_at,
             p.title as program_title
      FROM public.program_roles pr
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
      INSERT INTO public.program_roles (program_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, program_id, user_id, role, created_at
    `, [data.program_id, data.user_id, data.role]);
    return result.rows[0];
  }

  /**
   * Update a program role
   */
  async updateProgramRole(id: bigint, data: UpdateProgramRoleDTO): Promise<ProgramRole | null> {
    if (data.role === undefined) return this.getProgramRoleById(id);

    const result = await this.pool.query(`
      UPDATE public.program_roles
      SET role = $1
      WHERE id = $2
      RETURNING id, program_id, user_id, role, created_at
    `, [data.role, id]);

    return result.rows[0] || null;
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
  async userHasRoleInProgram(programId: bigint, userId: bigint, role: string): Promise<boolean> {
    const result = await this.pool.query(`
      SELECT id FROM public.program_roles
      WHERE program_id = $1 AND user_id = $2 AND role = $3
    `, [programId, userId, role]);
    return result.rows.length > 0;
  }

  /**
   * Get program presenters
   */
  async getProgramPresenters(programId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email
      FROM public.program_roles pr
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1 AND pr.role = 'presenter'
    `, [programId]);
    return result.rows;
  }

  /**
   * Get program producers
   */
  async getProgramProducers(programId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email
      FROM public.program_roles pr
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1 AND pr.role = 'producer'
    `, [programId]);
    return result.rows;
  }
}
