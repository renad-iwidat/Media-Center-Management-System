import { Router, Request, Response } from 'express';
import { OrderController } from '../../controllers/management/OrderController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const orderController = new OrderController();

// كل نقاط الوصول تحتاج تسجيل دخول فقط
router.use(authenticate);

// إضافة صلاحيات المستخدم للـ request
router.use(async (req, res, next) => {
  if (req.user) {
    try {
      const { PermissionService } = await import('../../services/management/PermissionService');
      req.userPermissions = await PermissionService.getUserPermissions(BigInt(req.user.user_id));
    } catch (error) {
      req.userPermissions = [];
    }
  }
  next();
});

// ============ إنشاء (يحتاج صلاحية) ============
router.post('/', requirePermission('orders.create'), (req: Request, res: Response) => { orderController.createOrder(req, res); });

// ============ عرض - مفتوحة لكل المستخدمين المسجلين ============
router.get('/', (req: Request, res: Response) => { orderController.getAllOrders(req, res); });
router.get('/statuses', (req: Request, res: Response) => { orderController.getOrderStatuses(req, res); });
router.get('/all-with-kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getAllOrdersWithKPI(req, res); });
router.get('/desk/:deskId', (req: Request, res: Response) => { orderController.getOrdersByDesk(req, res); });
router.get('/status/:statusId', (req: Request, res: Response) => { orderController.getOrdersByStatus(req, res); });
router.get('/program/:programId', (req: Request, res: Response) => { orderController.getOrdersByProgram(req, res); });
router.get('/:id', (req: Request, res: Response) => { orderController.getOrder(req, res); });

// ============ تعديل/حذف (تحتاج صلاحيات) ============
router.put('/:id', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.updateOrder(req, res); });
router.delete('/:id', requirePermission('orders.delete'), (req: Request, res: Response) => { orderController.deleteOrder(req, res); });

// ============ Status - مفتوحة للكل ============
router.patch('/:id/status', (req: Request, res: Response) => { orderController.changeOrderStatus(req, res); });
router.patch('/:id/cancel', (req: Request, res: Response) => { orderController.cancelOrder(req, res); });
router.patch('/:id/auto-status', (req: Request, res: Response) => { orderController.updateOrderStatusBasedOnTasks(req, res); });
router.get('/:id/history', (req: Request, res: Response) => { orderController.getOrderHistory(req, res); });

// ============ Business Logic - مفتوحة ============
router.get('/:id/progress', (req: Request, res: Response) => { orderController.calculateOrderProgress(req, res); });
router.get('/:id/deadline', (req: Request, res: Response) => { orderController.validateOrderDeadline(req, res); });
router.get('/:id/can-delete', (req: Request, res: Response) => { orderController.canDeleteOrder(req, res); });
router.get('/:id/can-close', (req: Request, res: Response) => { orderController.canCloseOrder(req, res); });
router.get('/:id/details', (req: Request, res: Response) => { orderController.getOrderWithDetails(req, res); });

// ============ KPI ============
router.get('/:id/kpi', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getOrderKPI(req, res); });
router.get('/:id/statistics', requirePermission('kpi.view'), (req: Request, res: Response) => { orderController.getOrderStatistics(req, res); });
router.get('/:id/full-details', (req: Request, res: Response) => { orderController.getOrderFullDetails(req, res); });

// ============ Archive ============
router.post('/:id/archive', requirePermission('orders.edit'), (req: Request, res: Response) => { orderController.archiveOrder(req, res); });

export default router;
