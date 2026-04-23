import pool from '../../config/database';
import { ProgramRole, CreateProgramRoleDTO, UpdateProgramRoleDTO } from '../../types/management';

export class ProgramRoleModel {
  static async findById(id: bigint): Promise<ProgramRole | null> {
    const result = await pool.query(
      `SELECT pr.*, r.name as role_name, u.name as user_name, p.title as program_name
       FROM program_roles pr
       INNER JOIN roles r ON pr.role_id = r.id
       INNER JOIN users u ON pr.user_id = u.id
       INNER JOIN programs p ON pr.program_id = p.id
       WHERE pr.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(): Promise<ProgramRole[]> {
    const result = await pool.query(
      `SELECT pr.*, r.name as role_name, u.name as user_name, p.title as program_name
       FROM program_roles pr
       INNER JOIN roles r ON pr.role_id = r.id
       INNER JOIN users u ON pr.user_id = u.id
       INNER JOIN programs p ON pr.program_id = p.id
       ORDER BY pr.created_at DESC`
    );
    return result.rows;
  }

  static async findByProgram(programId: bigint): Promise<ProgramRole[]> {
    const result = await pool.query(
      `SELECT pr.*, r.name as role_name, u.name as user_name, u.email
       FROM program_roles pr
       INNER JOIN roles r ON pr.role_id = r.id
       INNER JOIN users u ON pr.user_id = u.id
       WHERE pr.program_id = $1
       ORDER BY r.name, u.name`,
      [programId]
    );
    return result.rows;
  }

  static async findByUser(userId: bigint): Promise<ProgramRole[]> {
    const result = await pool.query(
      `SELECT pr.*, r.name as role_name, p.title as program_name
       FROM program_roles pr
       INNER JOIN roles r ON pr.role_id = r.id
       INNER JOIN programs p ON pr.program_id = p.id
       WHERE pr.user_id = $1
       ORDER BY p.title`,
      [userId]
    );
    return result.rows;
  }

  static async findByProgramAndRole(programId: bigint, roleId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email
       FROM program_roles pr
       INNER JOIN users u ON pr.user_id = u.id
       WHERE pr.program_id = $1 AND pr.role_id = $2
       ORDER BY u.name`,
      [programId, roleId]
    );
    return result.rows;
  }

  static async exists(programId: bigint, userId: bigint, roleId: bigint): Promise<boolean> {
    const result = await pool.query(
      'SELECT id FROM program_roles WHERE program_id = $1 AND user_id = $2 AND role_id = $3',
      [programId, userId, roleId]
    );
    return result.rows.length > 0;
  }

  static async create(data: CreateProgramRoleDTO): Promise<ProgramRole> {
    const result = await pool.query(
      `INSERT INTO program_roles (program_id, user_id, role_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.program_id, data.user_id, data.role_id]
    );
    // Return with joined data
    return (await this.findById(result.rows[0].id))!;
  }

  static async update(id: bigint, data: UpdateProgramRoleDTO): Promise<ProgramRole | null> {
    if (data.role_id === undefined) return this.findById(id);

    const result = await pool.query(
      'UPDATE program_roles SET role_id = $1 WHERE id = $2 RETURNING id',
      [data.role_id, id]
    );
    if (result.rows.length === 0) return null;
    return this.findById(id);
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM program_roles WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }
}
