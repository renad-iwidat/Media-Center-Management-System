/**
 * Team User Controller
 * Handles team user relationships
 */

import { Request, Response } from 'express';
import { TeamService } from '../../services/portal-r';

const teamService = new TeamService();

export class TeamUserController {
  /**
   * GET /team-users?team_id=X - Get users in a team
   */
  static async getUsersByTeam(req: Request, res: Response): Promise<void> {
    try {
      const { team_id, user_id } = req.query;

      if (team_id) {
        const users = await teamService.getTeamMembers(BigInt(team_id as string));
        res.json({
          success: true,
          data: users,
          count: users.length,
        });
      } else if (user_id) {
        // Get teams for a user
        const result = await teamService.getUserTeams(BigInt(user_id as string));
        res.json({
          success: true,
          data: result,
          count: result.length,
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'team_id or user_id is required',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team users',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /team-users - Add user to team
   */
  static async addUserToTeam(req: Request, res: Response): Promise<void> {
    try {
      const { team_id, user_id } = req.body;

      if (!team_id || !user_id) {
        res.status(400).json({
          success: false,
          error: 'team_id and user_id are required',
        });
        return;
      }

      const success = await teamService.addUserToTeam(BigInt(team_id), BigInt(user_id));

      if (!success) {
        res.status(400).json({
          success: false,
          error: 'Failed to add user to team',
        });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'User added to team successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to add user to team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /team-users/:teamId/:userId - Remove user from team
   */
  static async removeUserFromTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId, userId } = req.params;

      const success = await teamService.removeUserFromTeam(BigInt(teamId), BigInt(userId));

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'User not found in team',
        });
        return;
      }

      res.json({
        success: true,
        message: 'User removed from team successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to remove user from team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
