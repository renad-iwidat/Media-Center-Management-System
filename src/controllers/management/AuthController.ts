import { Request, Response } from 'express';
import { AuthService } from '../../services/management/AuthService';

export class AuthController {

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        this.sendError(res, 'Email and password are required', 400);
        return;
      }

      const result = await AuthService.login(email, password);
      this.sendSuccess(res, result);
    } catch (error) {
      this.sendError(res, error, 401);
    }
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role_id, work_days, start_time, end_time } = req.body;

      if (!name || !email || !password) {
        this.sendError(res, 'Name, email, and password are required', 400);
        return;
      }

      if (password.length < 6) {
        this.sendError(res, 'Password must be at least 6 characters', 400);
        return;
      }

      const user = await AuthService.register({
        name, email, password,
        role_id: role_id ? BigInt(role_id) : undefined,
        work_days, start_time, end_time,
      });

      this.sendSuccess(res, user, 201);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { old_password, new_password } = req.body;

      if (!old_password || !new_password) {
        this.sendError(res, 'Old password and new password are required', 400);
        return;
      }

      if (new_password.length < 6) {
        this.sendError(res, 'New password must be at least 6 characters', 400);
        return;
      }

      await AuthService.changePassword(BigInt(req.user!.user_id), old_password, new_password);
      this.sendSuccess(res, { message: 'Password changed successfully' });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async setPassword(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        this.sendError(res, 'Password must be at least 6 characters', 400);
        return;
      }

      await AuthService.setPassword(BigInt(userId), new_password);
      this.sendSuccess(res, { message: 'Password set successfully' });
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    try {
      const user = await AuthService.getMe(BigInt(req.user!.user_id));
      this.sendSuccess(res, user);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() });
  }

  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({ success: false, error: message, timestamp: new Date().toISOString() });
  }
}
