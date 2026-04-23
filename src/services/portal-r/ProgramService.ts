import { ProgramModel } from '../../models/content/Program';
import { EpisodeModel } from '../../models/content/Episode';
import { Program, CreateProgramDTO, UpdateProgramDTO } from '../../types/content';
import pool from '../../config/database';

export class ProgramService {
  async getAllPrograms(): Promise<any[]> {
    const result = await pool.query(
      `SELECT p.*, m.name as media_unit_name
       FROM programs p LEFT JOIN media_units m ON p.media_unit_id = m.id
       ORDER BY p.created_at DESC`
    );
    return result.rows;
  }

  async getProgramById(id: bigint): Promise<any> {
    const result = await pool.query(
      `SELECT p.*, m.name as media_unit_name
       FROM programs p LEFT JOIN media_units m ON p.media_unit_id = m.id
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  async getProgramsByMediaUnit(mediaUnitId: bigint): Promise<Program[]> {
    return ProgramModel.findByMediaUnit(mediaUnitId);
  }

  async createProgram(data: CreateProgramDTO): Promise<Program> {
    return ProgramModel.create(data);
  }

  async updateProgram(id: bigint, data: UpdateProgramDTO): Promise<Program | null> {
    return ProgramModel.update(id, data as Partial<Program>);
  }

  async deleteProgram(id: bigint): Promise<boolean> {
    return ProgramModel.delete(id);
  }

  async getProgramWithEpisodes(id: bigint): Promise<any> {
    const program = await this.getProgramById(id);
    if (!program) return null;
    const episodes = await EpisodeModel.findByProgram(id);
    return { ...program, episodes };
  }

  async getProgramWithRoles(id: bigint): Promise<any> {
    const program = await this.getProgramById(id);
    if (!program) return null;
    const result = await pool.query(
      `SELECT pr.*, r.name as role_name, u.name as user_name, u.email
       FROM program_roles pr
       INNER JOIN roles r ON pr.role_id = r.id
       INNER JOIN users u ON pr.user_id = u.id
       WHERE pr.program_id = $1 ORDER BY r.name`,
      [id]
    );
    return { ...program, team_members: result.rows };
  }
}
