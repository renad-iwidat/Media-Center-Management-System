import { Request, Response } from 'express';
import { KPIService } from '../../services/management/KPIService';

/**
 * KPIController - Handles all KPI and Analytics endpoints
 */
export class KPIController {

  // ============ Dashboard ============

  /**
   * GET /api/kpi/dashboard
   * Get dashboard summary with all KPI metrics
   */
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const summary = await KPIService.getDashboardSummary();
      this.sendSuccess(res, summary, 200);
    } catch (error) {
      this.sendError(res, error, 500);
    }
  }

  // ============ User KPI ============

  /**
   * GET /api/kpi/users/:userId
   * Get KPI for a specific user
   */
  async getUserKPI(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        this.sendError(res, 'User ID is required', 400);
        return;
      }

      const kpi = await KPIService.getUserKPI(BigInt(userId));

      if (!kpi) {
        this.sendError(res, 'KPI not found for this user', 404);
        return;
      }

      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * GET /api/kpi/users
   * Get all users KPI (leaderboard)
   */
  async getAllUsersKPI(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const kpis = await KPIService.getAllUsersKPI(limit, offset);
      this.sendSuccess(res, kpis, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/kpi/users/:userId/recalculate
   * Recalculate KPI for a specific user
   */
  async recalculateUserKPI(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        this.sendError(res, 'User ID is required', 400);
        return;
      }

      const kpi = await KPIService.calculateUserKPI(BigInt(userId));
      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Order KPI ============

  /**
   * GET /api/kpi/orders/:orderId
   * Get KPI for a specific order
   */
  async getOrderKPI(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const kpi = await KPIService.getOrderKPI(BigInt(orderId));

      if (!kpi) {
        this.sendError(res, 'KPI not found for this order', 404);
        return;
      }

      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/kpi/orders/:orderId/recalculate
   * Recalculate KPI for a specific order
   */
  async recalculateOrderKPI(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        this.sendError(res, 'Order ID is required', 400);
        return;
      }

      const kpi = await KPIService.calculateOrderKPI(BigInt(orderId));
      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Task KPI ============

  /**
   * GET /api/kpi/tasks/:taskId
   * Get KPI for a specific task
   */
  async getTaskKPI(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const kpi = await KPIService.getTaskKPI(BigInt(taskId));

      if (!kpi) {
        this.sendError(res, 'KPI not found for this task', 404);
        return;
      }

      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  /**
   * POST /api/kpi/tasks/:taskId/recalculate
   * Recalculate KPI for a specific task
   */
  async recalculateTaskKPI(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      if (!taskId) {
        this.sendError(res, 'Task ID is required', 400);
        return;
      }

      const kpi = await KPIService.calculateTaskKPI(BigInt(taskId));
      this.sendSuccess(res, kpi, 200);
    } catch (error) {
      this.sendError(res, error, 400);
    }
  }

  // ============ Recalculate All ============

  /**
   * POST /api/kpi/recalculate-all
   * Recalculate all KPIs (admin operation)
   */
  async recalculateAll(_req: Request, res: Response): Promise<void> {
    try {
      const result = await KPIService.recalculateAllKPIs();
      this.sendSuccess(res, {
        message: 'KPI recalculation completed',
        recalculated: result,
      }, 200);
    } catch (error) {
      this.sendError(res, error, 500);
    }
  }

  // ============ Helpers ============

  private sendSuccess(res: Response, data: any, statusCode: number = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  private sendError(res: Response, error: any, statusCode: number = 400): void {
    const message = error instanceof Error ? error.message : String(error);
    res.status(statusCode).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    });
  }
}
