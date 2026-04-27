import { Router, Request, Response } from 'express';
import { OrderController } from '../../controllers/management/OrderController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const orderController = new OrderController();

// كل نقاط الوصول محمية
router.use(authenticate);

// CRUD
router.post('/', requirePermission('orders.create'), (req: Request, res: Response) => { orderController.createOrder(req, res); });
router.get('/', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getAllOrders(req, res); });
router.get('/statuses', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrderStatuses(req, res); });
router.get('/all-with-kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getAllOrdersWithKPI(req, res); });
router.get('/desk/:deskId', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrdersByDesk(req, res); });
router.get('/status/:statusId', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrdersByStatus(req, res); });
router.get('/program/:programId', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrdersByProgram(req, res); });
router.get('/:id', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrder(req, res); });
router.put('/:id', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.updateOrder(req, res); });
router.delete('/:id', requirePermission('orders.delete'), (req: Request, res: Response) => { orderController.deleteOrder(req, res); });

// Status
router.patch('/:id/status', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.changeOrderStatus(req, res); });
router.patch('/:id/cancel', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.cancelOrder(req, res); });
router.patch('/:id/auto-status', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.updateOrderStatusBasedOnTasks(req, res); });
router.get('/:id/history', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrderHistory(req, res); });

// Business Logic
router.get('/:id/progress', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.calculateOrderProgress(req, res); });
router.get('/:id/deadline', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.validateOrderDeadline(req, res); });
router.get('/:id/can-delete', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.canDeleteOrder(req, res); });
router.get('/:id/details', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrderWithDetails(req, res); });

// KPI
router.get('/:id/kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getOrderKPI(req, res); });
router.get('/:id/statistics', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getOrderStatistics(req, res); });
router.get('/:id/full-details', requirePermission('orders.view'), (req: Request, res: Response) => { orderController.getOrderFullDetails(req, res); });

// Archive
router.post('/:id/archive', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.archiveOrder(req, res); });

export default router;
