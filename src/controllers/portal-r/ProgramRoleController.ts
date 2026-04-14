/**
 * Program Role Controller
 * Handles program role-related HTTP requests
 */

import { Request, Response } from 'express';
import { ProgramRoleService } from '../../services/portal-r';

const programRoleService = new ProgramRoleService();

export class ProgramRoleController {
  /**
   * GET /program-roles - Get all program roles or filter by program_id/user_id
   */
  static async getAllProgramRoles(req: Request, res: Response): Promise<void> {
    try {
      const { program_id, user_id } = req.query;

      let roles;
      if (program_id) {
        roles = await programRoleService.getRolesByProgramId(BigInt(String(program_id)));
      } else if (user_id) {
        roles = await programRoleService.getRolesByUserId(BigInt(String(user_id)));
      } else {
        roles = await programRoleService.getAllProgramRoles();
      }

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch program roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /program-roles/:id - Get program role by ID
   */
  static async getProgramRoleById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const role = await programRoleService.getProgramRoleById(BigInt(id));

      if (!role) {
        res.status(404).json({
          success: false,
          error: 'Program role not found',
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
        error: 'Failed to fetch program role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:programId/roles - Get roles by program
   */
  static async getRolesByProgram(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;
      const roles = await programRoleService.getRolesByProgramId(BigInt(programId));

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch program roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /users/:userId/roles - Get roles by user
   */
  static async getRolesByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const roles = await programRoleService.getRolesByUserId(BigInt(userId));

      res.json({
        success: true,
        data: roles,
        count: roles.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user roles',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /program-roles - Create a new program role
   */
  static async createProgramRole(req: Request, res: Response): Promise<void> {
    try {
      const { program_id, user_id, role_id } = req.body;

      if (!program_id || !user_id || !role_id) {
        res.status(400).json({
          success: false,
          error: 'Program ID, user ID, and role ID are required',
        });
        return;
      }

      const programRole = await programRoleService.createProgramRole({
        program_id: BigInt(program_id),
        user_id: BigInt(user_id),
        role_id: BigInt(role_id),
      });

      res.status(201).json({
        success: true,
        data: programRole,
        message: 'Program role created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create program role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PUT /program-roles/:id - Update a program role
   */
  static async updateProgramRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { role_id } = req.body;

      const programRole = await programRoleService.updateProgramRole(BigInt(id), { role_id: role_id ? BigInt(role_id) : undefined });

      if (!programRole) {
        res.status(404).json({
          success: false,
          error: 'Program role not found',
        });
        return;
      }

      res.json({
        success: true,
        data: programRole,
        message: 'Program role updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update program role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /program-roles/:id - Delete a program role
   */
  static async deleteProgramRole(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await programRoleService.deleteProgramRole(BigInt(id));

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Program role not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Program role deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to delete program role',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:programId/presenters - Get program presenters (deprecated - use role filter)
   */
  static async getProgramPresenters(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;
      // This is deprecated - frontend should filter by role_id instead
      const roles = await programRoleService.getRolesByProgramId(BigInt(programId));
      const presenters = roles.filter(r => r.role_name?.toLowerCase().includes('مقدم') || r.role_name?.toLowerCase().includes('presenter'));

      res.json({
        success: true,
        data: presenters,
        count: presenters.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch presenters',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /programs/:programId/producers - Get program producers (deprecated - use role filter)
   */
  static async getProgramProducers(req: Request, res: Response): Promise<void> {
    try {
      const { programId } = req.params;
      // This is deprecated - frontend should filter by role_id instead
      const roles = await programRoleService.getRolesByProgramId(BigInt(programId));
      const producers = roles.filter(r => r.role_name?.toLowerCase().includes('منتج') || r.role_name?.toLowerCase().includes('producer'));

      res.json({
        success: true,
        data: producers,
        count: producers.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch producers',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
