import { Router, Request, Response } from 'express';
import { AuthController } from '../../controllers/management/AuthController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const authController = new AuthController();

// مفتوح للجميع
router.post('/login', (req: Request, res: Response) => { authController.login(req, res); });

// محمي — لازم تكون مسجل دخول
router.get('/me', authenticate, (req: Request, res: Response) => { authController.getMe(req, res); });
router.post('/change-password', authenticate, (req: Request, res: Response) => { authController.changePassword(req, res); });

// محمي — لازم صلاحية إدارة مستخدمين
router.post('/register', authenticate, requirePermission('users.manage'), (req: Request, res: Response) => { authController.register(req, res); });
router.post('/set-password/:userId', authenticate, requirePermission('users.manage'), (req: Request, res: Response) => { authController.setPassword(req, res); });

export default router;
