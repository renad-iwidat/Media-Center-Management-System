import { Router, Request, Response } from 'express';
import { PermissionController } from '../../controllers/management/PermissionController';
import { authenticate, requirePermission } from '../../middleware/auth';

const router = Router();
const permissionController = new PermissionController();

router.use(authenticate);

// عرض الصلاحيات — للإدارة فقط
router.get('/', requirePermission('roles.manage'), (req: Request, res: Response) => { permissionController.getAllPermissions(req, res); });
router.get('/roles/:roleId', requirePermission('roles.manage'), (req: Request, res: Response) => { permissionController.getRolePermissions(req, res); });
router.get('/users/:userId/roles', requirePermission('users.manage'), (req: Request, res: Response) => { permissionController.getUserRoles(req, res); });
router.get('/users/:userId/permissions', requirePermission('users.manage'), (req: Request, res: Response) => { permissionController.getUserPermissions(req, res); });

// إدارة أدوار المستخدمين — للإدارة فقط
router.post('/users/:userId/roles', requirePermission('roles.manage'), (req: Request, res: Response) => { permissionController.addRoleToUser(req, res); });
router.delete('/users/:userId/roles/:roleId', requirePermission('roles.manage'), (req: Request, res: Response) => { permissionController.removeRoleFromUser(req, res); });

export default router;
