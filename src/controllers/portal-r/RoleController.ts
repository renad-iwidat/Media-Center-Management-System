/**
 * Role Controller
 * Handles role-related HTTP requests
 */

import { Request, Response } from 'express';
import { RoleService } from '../../services/portal-r';

const roleService = new RoleService();

export class RoleController {
  /**
   * GET /roles - Get all roles
   */
  static async getAllRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await roleService.getAllRoles();
      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /roles/:id - Get role by ID
   */
  static async getRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const role = await roleService.getRoleById(BigInt(id));

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      res.json({
        success: true,
        data: role,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /roles - Create a new role
   */
  static async createRole(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;

      if (!name) {
        res.status(400).json({
          success: false,
          error: 'Role name is required',
        });
        return;
      }

      const role = await roleService.createRole({
        name,
        description,
      });

      res.status(201).json({
        success: true,
        data: role,
        message: 'Role created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /roles/:id - Update a role
   */
  static async updateRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const role = await roleService.updateRole(BigInt(id), {
        name,
        description,
      });

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      res.json({
        success: true,
        data: role,
        message: 'Role updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /roles/:id - Delete a role
   */
  static async deleteRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await roleService.deleteRole(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Role not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Role deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
