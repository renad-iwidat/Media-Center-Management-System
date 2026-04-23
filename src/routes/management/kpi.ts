import { Router, Request, Response } from 'express';
import { KPIController } from '../../controllers/management/KPIController';

/**
 * KPI Routes
 * 
 * All routes for KPI and Analytics:
 * - Dashboard summary
 * - User KPI
 * - Order KPI
 * - Task KPI
 * - Recalculate operations
 */

const router = Router();
const kpiController = new KPIController();

// ============ Dashboard ============

/**
 * GET /api/kpi/dashboard
 * Get dashboard summary with all metrics
 */
router.get('/dashboard', (req: Request, res: Response) => {
  kpiController.getDashboard(req, res);
});

// ============ User KPI ============

/**
 * GET /api/kpi/users
 * Get all users KPI (leaderboard)
 */
router.get('/users', (req: Request, res: Response) => {
  kpiController.getAllUsersKPI(req, res);
});

/**
 * GET /api/kpi/users/:userId
 * Get KPI for a specific user
 */
router.get('/users/:userId', (req: Request, res: Response) => {
  kpiController.getUserKPI(req, res);
});

/**
 * POST /api/kpi/users/:userId/recalculate
 * Recalculate KPI for a specific user
 */
router.post('/users/:userId/recalculate', (req: Request, res: Response) => {
  kpiController.recalculateUserKPI(req, res);
});

// ============ Order KPI ============

/**
 * GET /api/kpi/orders/:orderId
 * Get KPI for a specific order
 */
router.get('/orders/:orderId', (req: Request, res: Response) => {
  kpiController.getOrderKPI(req, res);
});

/**
 * POST /api/kpi/orders/:orderId/recalculate
 * Recalculate KPI for a specific order
 */
router.post('/orders/:orderId/recalculate', (req: Request, res: Response) => {
  kpiController.recalculateOrderKPI(req, res);
});

// ============ Task KPI ============

/**
 * GET /api/kpi/tasks/:taskId
 * Get KPI for a specific task
 */
router.get('/tasks/:taskId', (req: Request, res: Response) => {
  kpiController.getTaskKPI(req, res);
});

/**
 * POST /api/kpi/tasks/:taskId/recalculate
 * Recalculate KPI for a specific task
 */
router.post('/tasks/:taskId/recalculate', (req: Request, res: Response) => {
  kpiController.recalculateTaskKPI(req, res);
});

// ============ Recalculate All ============

/**
 * POST /api/kpi/recalculate-all
 * Recalculate all KPIs (admin operation)
 */
router.post('/recalculate-all', (req: Request, res: Response) => {
  kpiController.recalculateAll(req, res);
});

export default router;
