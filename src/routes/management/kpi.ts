import { Router, Request, Response } from 'express';
import { KPIController } from '../../controllers/management/KPIController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const kpiController = new KPIController();

// كل نقاط الوصول محمية — فقط للإدارة
router.use(authenticate);
router.use(requirePermission('kpi.view'));

router.get('/dashboard', (req: Request, res: Response) => { kpiController.getDashboard(req, res); });
router.get('/users', (req: Request, res: Response) => { kpiController.getAllUsersKPI(req, res); });
router.get('/users/:userId', (req: Request, res: Response) => { kpiController.getUserKPI(req, res); });
router.post('/users/:userId/recalculate', (req: Request, res: Response) => { kpiController.recalculateUserKPI(req, res); });
router.get('/orders/:orderId', (req: Request, res: Response) => { kpiController.getOrderKPI(req, res); });
router.post('/orders/:orderId/recalculate', (req: Request, res: Response) => { kpiController.recalculateOrderKPI(req, res); });
router.get('/tasks/:taskId', (req: Request, res: Response) => { kpiController.getTaskKPI(req, res); });
router.post('/tasks/:taskId/recalculate', (req: Request, res: Response) => { kpiController.recalculateTaskKPI(req, res); });
router.post('/recalculate-all', (req: Request, res: Response) => { kpiController.recalculateAll(req, res); });

export default router;
