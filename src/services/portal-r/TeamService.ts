import { TeamModel } from '../../models/management/Desk';
import { Team, CreateTeamDTO, UpdateTeamDTO } from '../../types/management';
import pool from '../../config/database';

export class TeamService {
  async getAllTeams(): Promise<Team[]> {
    return TeamModel.findAll();
  }

  async getTeamById(id: bigint): Promise<Team | null> {
    return TeamModel.findById(id);
  }

  async getTeamsByDeskId(deskId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT t.*, u.name as manager_name
       FROM teams t LEFT JOIN users u ON t.manager_id = u.id
       WHERE t.desk_id = $1 ORDER BY t.created_at DESC`,
      [deskId]
    );
    return result.rows;
  }

  async createTeam(data: CreateTeamDTO): Promise<Team> {
    return TeamModel.create(data);
  }

  async updateTeam(id: bigint, data: UpdateTeamDTO): Promise<Team | null> {
    return TeamModel.update(id, data as Partial<Team>);
  }

  async deleteTeam(id: bigint): Promise<boolean> {
    return TeamModel.delete(id);
  }

  async addUserToTeam(teamId: bigint, userId: bigint): Promise<boolean> {
    try {
      await TeamModel.addMember({ team_id: teamId, user_id: userId });
      return true;
    } catch {
      return false;
    }
  }

  async removeUserFromTeam(teamId: bigint, userId: bigint): Promise<boolean> {
    return TeamModel.removeMember(teamId, userId);
  }

  async getTeamMembers(teamId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.role_id, u.work_days, u.start_time, u.end_time
       FROM users u INNER JOIN team_users tu ON u.id = tu.user_id
       WHERE tu.team_id = $1 ORDER BY u.name`,
      [teamId]
    );
    return result.rows;
  }

  async getUserTeams(userId: bigint): Promise<any[]> {
    const result = await pool.query(
      `SELECT t.* FROM teams t
       INNER JOIN team_users tu ON t.id = tu.team_id
       WHERE tu.user_id = $1 ORDER BY t.name`,
      [userId]
    );
    return result.rows;
  }
}
