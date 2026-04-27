import { Request, Response } from 'express';
import { PermissionService } from '../../services/management/PermissionService';

export class PermissionController {

  async getAllPermissions(_req: Request, res: Response): Promise<void> {
    try {
      const permissions = await PermissionService.getAllPermissions();
      res.json({ success: true, data: permissions, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async getUserRoles(req: Request, res: Response): Promise<void> {
    try {
      const roles = await PermissionService.getUserRoles(BigInt(req.params.userId));
      res.json({ success: true, data: roles, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async getUserPermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await PermissionService.getUserPermissions(BigInt(req.params.userId));
      res.json({ success: true, data: permissions, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async getRolePermissions(req: Request, res: Response): Promise<void> {
    try {
      const permissions = await PermissionService.getRolePermissions(BigInt(req.params.roleId));
      res.json({ success: true, data: permissions, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async addRoleToUser(req: Request, res: Response): Promise<void> {
    try {
      const { role_id } = req.body;
      if (!role_id) { res.status(400).json({ success: false, error: 'role_id is required' }); return; }
      await PermissionService.addRoleToUser(BigInt(req.params.userId), BigInt(role_id));
      res.json({ success: true, data: { message: 'Role added to user' }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }

  async removeRoleFromUser(req: Request, res: Response): Promise<void> {
    try {
      await PermissionService.removeRoleFromUser(BigInt(req.params.userId), BigInt(req.params.roleId));
      res.json({ success: true, data: { message: 'Role removed from user' }, timestamp: new Date().toISOString() });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(400).json({ success: false, error: message, timestamp: new Date().toISOString() });
    }
  }
}
