/**
 * Team Service
 * Handles all team-related database operations
 */

import { getPool } from '../../config/database';
import { Team, CreateTeamDTO, UpdateTeamDTO } from '../../models/portal-r';

export class TeamService {
  private pool = getPool();

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    const result = await this.pool.query(`
      SELECT id, desk_id, name, manager_id, created_at
      FROM public.teams
      ORDER BY created_at DESC
    `);
    return result.rows;
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: bigint): Promise<Team | null> {
    const result = await this.pool.query(`
      SELECT id, desk_id, name, manager_id, created_at
      FROM public.teams
      WHERE id = $1
    `, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get teams by desk ID
   */
  async getTeamsByDeskId(deskId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT t.id, t.desk_id, t.name, t.manager_id, t.created_at,
             u.name as manager_name
      FROM public.teams t
      LEFT JOIN public.users u ON t.manager_id = u.id
      WHERE t.desk_id = $1
      ORDER BY t.created_at DESC
    `, [deskId]);
    return result.rows;
  }

  /**
   * Create a new team
   */
  async createTeam(data: CreateTeamDTO): Promise<Team> {
    const result = await this.pool.query(`
      INSERT INTO public.teams (desk_id, name, manager_id)
      VALUES ($1, $2, $3)
      RETURNING id, desk_id, name, manager_id, created_at
    `, [data.desk_id, data.name, data.manager_id || null]);
    return result.rows[0];
  }

  /**
   * Update a team
   */
  async updateTeam(id: bigint, data: UpdateTeamDTO): Promise<Team | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(data.name);
    }
    if (data.manager_id !== undefined) {
      updates.push(`manager_id = $${paramCount++}`);
      values.push(data.manager_id);
    }

    if (updates.length === 0) return this.getTeamById(id);

    values.push(id);
    const result = await this.pool.query(`
      UPDATE public.teams
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, desk_id, name, manager_id, created_at
    `, values);

    return result.rows[0] || null;
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.teams
      WHERE id = $1
    `, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Add user to team
   */
  async addUserToTeam(teamId: bigint, userId: bigint): Promise<boolean> {
    try {
      console.log(`Adding user ${userId} to team ${teamId}`);
      await this.pool.query(`
        INSERT INTO public.team_users (team_id, user_id)
        VALUES ($1, $2)
      `, [teamId, userId]);
      console.log(`✅ User ${userId} added to team ${teamId}`);
      return true;
    } catch (error) {
      console.error(`❌ Error adding user to team:`, error);
      return false;
    }
  }

  /**
   * Remove user from team
   */
  async removeUserFromTeam(teamId: bigint, userId: bigint): Promise<boolean> {
    const result = await this.pool.query(`
      DELETE FROM public.team_users
      WHERE team_id = $1 AND user_id = $2
    `, [teamId, userId]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Get team members
   */
  async getTeamMembers(teamId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, u.work_days, u.start_time, u.end_time
      FROM public.users u
      INNER JOIN public.team_users tu ON u.id = tu.user_id
      WHERE tu.team_id = $1
      ORDER BY u.name
    `, [teamId]);
    return result.rows;
  }

  /**
   * Get teams for a user
   */
  async getUserTeams(userId: bigint): Promise<any[]> {
    const result = await this.pool.query(`
      SELECT t.id, t.desk_id, t.name, t.manager_id, t.created_at
      FROM public.teams t
      INNER JOIN public.team_users tu ON t.id = tu.team_id
      WHERE tu.user_id = $1
      ORDER BY t.name
    `, [userId]);
    return result.rows;
  }
}
