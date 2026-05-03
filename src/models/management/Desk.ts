import { Desk, Team, TeamUser, CreateDeskDTO, UpdateDeskDTO, CreateTeamDTO, UpdateTeamDTO } from '../../types/management';
import pool from '../../config/database';

export class DeskModel {
  static async findById(id: bigint): Promise<Desk | null> {
    const result = await pool.query(
      'SELECT * FROM desks WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Desk[]> {
    const result = await pool.query(
      'SELECT * FROM desks ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByManager(managerId: bigint): Promise<Desk[]> {
    const result = await pool.query(
      'SELECT * FROM desks WHERE manager_id = $1 ORDER BY created_at DESC',
      [managerId]
    );
    return result.rows;
  }

  static async create(desk: CreateDeskDTO): Promise<Desk> {
    const result = await pool.query(
      'INSERT INTO desks (name, description, manager_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [desk.name, desk.description || null, desk.manager_id || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: UpdateDeskDTO): Promise<Desk | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }
    if (updates.manager_id !== undefined) {
      fields.push(`manager_id = $${paramCount++}`);
      values.push(updates.manager_id);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE desks SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM desks WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  }

  static async getTeams(deskId: bigint): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE desk_id = $1 ORDER BY created_at DESC',
      [deskId]
    );
    return result.rows;
  }
}

export class TeamModel {
  static async findById(id: bigint): Promise<Team | null> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findAll(limit: number = 50, offset: number = 0): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async findByDesk(deskId: bigint): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE desk_id = $1 ORDER BY created_at DESC',
      [deskId]
    );
    return result.rows;
  }

  static async findByManager(managerId: bigint): Promise<Team[]> {
    const result = await pool.query(
      'SELECT * FROM teams WHERE manager_id = $1 ORDER BY created_at DESC',
      [managerId]
    );
    return result.rows;
  }

  static async create(team: CreateTeamDTO): Promise<Team> {
    const result = await pool.query(
      'INSERT INTO teams (desk_id, name, manager_id, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [team.desk_id, team.name, team.manager_id || null]
    );
    return result.rows[0];
  }

  static async update(id: bigint, updates: UpdateTeamDTO): Promise<Team | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.manager_id !== undefined) {
      fields.push(`manager_id = $${paramCount++}`);
      values.push(updates.manager_id);
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await pool.query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id: bigint): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM teams WHERE id = $1',
      [id]
    );
    return result.rowCount! > 0;
  }

  static async getMembers(teamId: bigint): Promise<TeamUser[]> {
    const result = await pool.query(
      'SELECT team_id, user_id FROM team_users WHERE team_id = $1',
      [teamId]
    );
    return result.rows;
  }

  static async addMember(member: Omit<TeamUser, 'id'>): Promise<TeamUser> {
    const result = await pool.query(
      'INSERT INTO team_users (team_id, user_id) VALUES ($1, $2) RETURNING *',
      [member.team_id, member.user_id]
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
