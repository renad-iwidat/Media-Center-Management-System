import pool from '../../config/database';
import { Qism, Team, TeamUser } from '../../types/management';

/**
 * QismModel - قسم (Desk/Department)
 * Handles database operations for Qism (departments/desks)
 */
export class QismModel {
  /**
   * Find a qism by ID
   */
  static async findById(id: bigint): Promise<Qism | null> {
    const result = await pool.query('SELECT * FROM desks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Get all qisms with pagination
   */
  static async findAll(limit: number = 10, offset: number = 0): Promise<Qism[]> {
    const result = await pool.query(
      'SELECT * FROM desks ORDER BY name ASC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Get qisms managed by a specific user
   */
  static async findByManager(managerId: bigint): Promise<Qism[]> {
    const result = await pool.query(
      'SELECT * FROM desks WHERE manager_id = $1 ORDER BY name ASC',
      [managerId]
    );
    return result.rows;
  }

  /**
   * Create a new qism
   */
  static async create(qism: Omit<Qism, 'id' | 'created_at'>): Promise<Qism> {
    const result = await pool.query(
      `INSERT INTO desks (name, description, manager_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [qism.name, qism.description, qism.manager_id]
    );
    return result.rows[0];
  }

  /**
   * Update a qism
   */
  static async update(id: bigint, updates: Partial<Qism>): Promise<Qism | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = ${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Qism]);
    values.push(id);

    const result = await pool.query(
      `UPDATE desks SET ${setClause} WHERE id = ${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Delete a qism
   */
  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM desks WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  /**
   * Get teams in a qism
   */
  static async getTeamsInQism(qismId: bigint): Promise<Team[]> {
    const result = await pool.query(
      `SELECT t.*, u.name as manager_name,
       (SELECT COUNT(*) FROM team_users tu WHERE tu.team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN users u ON t.manager_id = u.id
       WHERE t.desk_id = $1 ORDER BY t.name ASC`,
      [qismId]
    );
    return result.rows;
  }
}

export class TeamModel {
  static async findById(id: bigint): Promise<Team | null> {
    const result = await pool.query(
      `SELECT t.*, d.name as desk_name, u.name as manager_name
       FROM teams t
       LEFT JOIN desks d ON t.desk_id = d.id
       LEFT JOIN users u ON t.manager_id = u.id
       WHERE t.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 100, offset: number = 0): Promise<Team[]> {
    const result = await pool.query(
      `SELECT t.*, d.name as desk_name, u.name as manager_name,
       (SELECT COUNT(*) FROM team_users tu WHERE tu.team_id = t.id) as member_count
       FROM teams t
       LEFT JOIN desks d ON t.desk_id = d.id
       LEFT JOIN users u ON t.manager_id = u.id
       ORDER BY t.name ASC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async findByDesk(deskId: bigint): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE desk_id = $1 ORDER BY name ASC',
      [deskId]
    );
    return result.rows;
  }

  static async findByManager(managerId: bigint): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE manager_id = $1 ORDER BY name ASC',
      [managerId]
    );
    return result.rows;
  }

  static async create(team: Omit<Team, 'id' | 'created_at'>): Promise<Team> {
    const result = await pool.query(
      `INSERT INTO teams (desk_id, manager_id, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [team.desk_id, team.manager_id, team.name]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: Partial<Team>): Promise<Team | null> {
    const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'created_at');
    if (fields.length === 0) return this.findById(id);

    const setClause = fields.map((field, i) => `${field} = ${i + 1}`).join(', ');
    const values = fields.map(field => updates[field as keyof Team]);
    values.push(id);

    const result = await pool.query(
      `UPDATE teams SET ${setClause} WHERE id = ${fields.length + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query('DELETE FROM teams WHERE id = $1', [id]);
    return result.rowCount! > 0;
  }

  static async getMembers(teamId: bigint): Promise<TeamUser[]> {
    const result = await pool.query(
      'SELECT * FROM team_users WHERE team_id = $1',
      [teamId]
    );
    return result.rows;
  }

  static async addMember(member: Omit<TeamUser, 'id'>): Promise<TeamUser> {
    const result = await pool.query(
      `INSERT INTO team_users (user_id, team_id)
       VALUES ($1, $2)
       RETURNING *`,
      [member.user_id, member.team_id]
    );
    return result.rows[0];
  }

  static async removeMember(teamId: bigint, userId: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM team_users WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );
    return result.rowCount! > 0;
  }
}
