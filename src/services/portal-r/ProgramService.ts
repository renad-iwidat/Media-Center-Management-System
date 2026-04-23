/**
 * Program Service
 * Handles all program-related database operations
 */

import { getPool } from '../../config/database';
import { Program, CreateProgramDTO, UpdateProgramDTO } from '../../models/portal-r';

export class ProgramService {
  private pool = getPool();

  /**
   * Get all programs
   */
  async getAllPrograms(): Promise<Program[]> {
    const result = await this.pool.query(`
      SELECT p.id, p.title, p.description, p.media_unit_id, p.air_time, p.created_at,
             m.name as media_unit_name
      FROM public.programs p
      LEFT JOIN public.media_units m ON p.media_unit_id = m.id
      ORDER BY p.created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get program by ID
   */
  async getProgramById(id: bigint): Promise<Program | null> {
    const result = await this.pool.query(`
      SELECT p.id, p.title, p.description, p.media_unit_id, p.air_time, p.created_at,
             m.name as media_unit_name
      FROM public.programs p
      LEFT JOIN public.media_units m ON p.media_unit_id = m.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get programs by media unit
   */
  async getProgramsByMediaUnit(mediaUnitId: bigint): Promise<Program[]> {
    const result = await this.pool.query(`
      SELECT p.id, p.title, p.description, p.media_unit_id, p.air_time, p.created_at,
             m.name as media_unit_name
      FROM public.programs p
      LEFT JOIN public.media_units m ON p.media_unit_id = m.id
      WHERE p.media_unit_id = $1
      ORDER BY p.created_at DESC
    `, [mediaUnitId]);
    return result.rows;
  }

  /**
   * Create a new program
   */
  async createProgram(data: CreateProgramDTO): Promise<Program> {
    const result = await this.pool.query(`
      INSERT INTO public.programs (title, description, media_unit_id, air_time)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, description, media_unit_id, air_time, created_at
    `, [data.title, data.description || null, data.media_unit_id || null, data.air_time || null]);
    
    const program = result.rows[0];
    
    // Fetch media unit name if media_unit_id exists
    if (program.media_unit_id) {
      const muResult = await this.pool.query(`
        SELECT name FROM public.media_units WHERE id = $1
      `, [program.media_unit_id]);
      if (muResult.rows[0]) {
        program.media_unit_name = muResult.rows[0].name;
      }
    }
    
    return program;
  }

  /**
   * Update a program
   */
  async updateProgram(id: bigint, data: UpdateProgramDTO): Promise<Program | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(data.description);
    }
    if (data.media_unit_id !== undefined) {
      updates.push(`media_unit_id = $${paramCount++}`);
      values.push(data.media_unit_id);
    }
    if (data.air_time !== undefined) {
      updates.push(`air_time = $${paramCount++}`);
      values.push(data.air_time);
    }

    if (updates.length === 0) return this.getProgramById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.programs
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, title, description, media_unit_id, air_time, created_at
    `, values);

    const program = result.rows[0];
    if (!program) return null;
    
    // Fetch media unit name if media_unit_id exists
    if (program.media_unit_id) {
      const muResult = await this.pool.query(`
        SELECT name FROM public.media_units WHERE id = $1
      `, [program.media_unit_id]);
      if (muResult.rows[0]) {
        program.media_unit_name = muResult.rows[0].name;
      }
    }
    
    return program;
  }

  /**
   * Delete a program
   */
  async deleteProgram(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.programs
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get program with episodes
   */
  async getProgramWithEpisodes(id: bigint): Promise<any> {
    const program = await this.getProgramById(id);
    if (!program) return null;

    const episodesResult = await this.pool.query(`
      SELECT id, program_id, title, episode_number, air_date, created_at
      FROM public.episodes
      WHERE program_id = $1
      ORDER BY episode_number DESC
    `, [id]);

    return {
      ...program,
      episodes: episodesResult.rows,
    };
  }

  /**
   * Get program with roles (team members)
   */
  async getProgramWithRoles(id: bigint): Promise<any> {
    const program = await this.getProgramById(id);
    if (!program) return null;

    const rolesResult = await this.pool.query(`
      SELECT pr.id, pr.program_id, pr.user_id, pr.role, pr.created_at,
             u.name, u.email
      FROM public.program_roles pr
      INNER JOIN public.users u ON pr.user_id = u.id
      WHERE pr.program_id = $1
      ORDER BY pr.role
    `, [id]);

    return {
      ...program,
      team_members: rolesResult.rows,
    };
  }
}
