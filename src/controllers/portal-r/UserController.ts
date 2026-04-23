/**
 * User Controller
 * Handles user-related HTTP requests
 */

import { Request, Response } from 'express';
import { UserService } from '../../services/portal-r';

const userService = new UserService();

export class UserController {
  /**
   * GET /users - Get all users
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 Getting all users...');
      const users = await userService.getAllUsers();
      console.log(`✅ Found ${users.length} users`);
      console.log('First user:', users[0]);
      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      console.error('❌ Error getting users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /users/:id - Get user by ID
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(BigInt(id));

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /users/:id/with-role - Get user with role details
   */
  static async getUserWithRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserWithRole(BigInt(id));

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /teams/:teamId/users - Get users by team
   */
  static async getUsersByTeam(req: Request, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const users = await userService.getUsersByTeamId(BigInt(teamId));

      res.json({
        success: true,
        data: users,
        count: users.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /users - Create a new user
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, role_id, work_days, start_time, end_time } = req.body;

      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: 'Name and email are required',
        });
        return;
      }

      const user = await userService.createUser({
        name,
        email,
        role_id: role_id ? BigInt(role_id) : undefined,
        work_days,
        start_time,
        end_time,
      });

      res.status(201).json({
        success: true,
        data: user,
        message: 'User created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /users/:id - Update a user
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, email, role_id, work_days, start_time, end_time } = req.body;

      const user = await userService.updateUser(BigInt(id), {
        name,
        email,
        role_id: role_id ? BigInt(role_id) : undefined,
        work_days,
        start_time,
        end_time,
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /users/:id - Delete a user
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await userService.deleteUser(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
