/**
 * Team Controller
 * Handles team-related HTTP requests
 */

import { Request, Response } from 'express';
import { TeamService } from '../../services/portal-r';

const teamService = new TeamService();

export class TeamController {
  /**
   * GET /teams - Get all teams
   */
  static async getAllTeams(req: Request, res: Response): Promise<void> {
    try {
      const teams = await teamService.getAllTeams();
      res.json({
        success: true,
        data: teams,
        count: teams.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /teams/:id - Get team by ID
   */
  static async getTeamById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const team = await teamService.getTeamById(BigInt(id));

      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        data: team,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /desks/:deskId/teams - Get teams by desk
   */
  static async getTeamsByDesk(req: Request, res: Response): Promise<void> {
    try {
      const { deskId } = req.params;
      const teams = await teamService.getTeamsByDeskId(BigInt(deskId));

      res.json({
        success: true,
        data: teams,
        count: teams.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch teams',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /teams - Create a new team
   */
  static async createTeam(req: Request, res: Response): Promise<void> {
    try {
      const { desk_id, name, manager_id } = req.body;

      if (!desk_id || !name) {
        res.status(400).json({
          success: false,
          error: 'Desk ID and team name are required',
        });
        return;
      }

      const team = await teamService.createTeam({
        desk_id: BigInt(desk_id),
        name,
        manager_id: manager_id ? BigInt(manager_id) : undefined,
      });

      res.status(201).json({
        success: true,
        data: team,
        message: 'Team created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /teams/:id - Update a team
   */
  static async updateTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, manager_id } = req.body;

      const team = await teamService.updateTeam(BigInt(id), {
        name,
        manager_id: manager_id ? BigInt(manager_id) : undefined,
      });

      if (!team) {
        res.status(404).json({
          success: false,
          error: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        data: team,
        message: 'Team updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /teams/:id - Delete a team
   */
  static async deleteTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await teamService.deleteTeam(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Team not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Team deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete team',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /teams/:id/members - Add user to team
   */
  static async addUserToTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { user_id } = req.body;

      if (!user_id) {
        res.status(400).json({
          success: false,
          error: 'User ID is required',
        });
        return;
      }

      const added = await teamService.addUserToTeam(BigInt(id), BigInt(user_id));

      if (!added) {
        res.status(400).json({
          success: false,
          error: 'Failed to add user to team',
        });
        return;
      }

      res.json({
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
   * DELETE /teams/:id/members/:userId - Remove user from team
   */
  static async removeUserFromTeam(req: Request, res: Response): Promise<void> {
    try {
      const { id, userId } = req.params;
      const removed = await teamService.removeUserFromTeam(BigInt(id), BigInt(userId));

      if (!removed) {
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

  /**
   * GET /teams/:id/members - Get team members
   */
  static async getTeamMembers(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const members = await teamService.getTeamMembers(BigInt(id));

      res.json({
        success: true,
        data: members,
        count: members.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch team members',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
