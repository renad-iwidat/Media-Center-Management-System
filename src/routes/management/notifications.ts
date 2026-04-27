import { Router, Request, Response } from 'express';
import { NotificationController } from '../../controllers/management/NotificationController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

router.use(authenticate);

// إشعاراتي
router.get('/', (req: Request, res: Response) => { notificationController.getMyNotifications(req, res); });
router.get('/unread-count', (req: Request, res: Response) => { notificationController.getUnreadCount(req, res); });
router.patch('/:id/read', (req: Request, res: Response) => { notificationController.markAsRead(req, res); });
router.patch('/read-all', (req: Request, res: Response) => { notificationController.markAllAsRead(req, res); });

// فحص المواعيد القريبة — للإدارة فقط
router.post('/check-deadlines', requirePermission('kpi.view'), (req: Request, res: Response) => { notificationController.checkDeadlines(req, res); });

export default router;
