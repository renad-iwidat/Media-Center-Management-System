/**
 * نقاط وصول المصادقة
 * 
 * ⚠️ ملاحظة مهمة:
 * - اللوجين يتم من نظام الإدارة فقط: https://media-center-management-system.onrender.com/api/auth/login
 * - نظام الأخبار يستقبل التوكن من نظام الإدارة ويستخدمه للتحقق من الصلاحيات
 * - لا يوجد تسجيل دخول مستقل في نظام الأخبار
 * 
 * GET /api/auth/me — جلب بيانات المستخدم الحالي (يتطلب توكن من نظام الإدارة)
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/management/AuthService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * ⚠️ تسجيل الدخول معطّل
 * 
 * اللوجين يجب أن يكون من نظام الإدارة فقط:
 * POST https://media-center-management-system.onrender.com/api/auth/login
 * 
 * هذا الـ endpoint معطّل لأن نظام الأخبار يستقبل التوكن من نظام الإدارة فقط
 * ولا يقوم بتسجيل دخول مستقل.
 */
// router.post('/login', async (req: Request, res: Response): Promise<void> => {
//   // معطّل - استخدم نظام الإدارة للوجين
// });

/**
 * معلومات عن اللوجين
 * GET /api/auth/login-info
 * 
 * يرجع معلومات عن كيفية تسجيل الدخول
 */
router.get('/login-info', (_req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'اللوجين يتم من نظام الإدارة فقط',
    loginUrl: 'https://media-center-management-system.onrender.com/api/auth/login',
    instructions: {
      step1: 'سجّل الدخول من نظام الإدارة',
      step2: 'احصل على التوكن من الرد',
      step3: 'استخدم التوكن في جميع طلبات نظام الأخبار',
      step4: 'أرسل التوكن في الـ Authorization Header: Bearer <token>'
    },
    example: {
      loginRequest: {
        method: 'POST',
        url: 'https://media-center-management-system.onrender.com/api/auth/login',
        body: {
          email: 'user@example.com',
          password: 'your_password'
        }
      },
      loginResponse: {
        success: true,
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 57,
            name: 'أحمد موقدي',
            email: 'a.moqadi@najah.edu',
            roles: [{ id: 19, name: 'مخرج' }]
          }
        }
      },
      newsSystemRequest: {
        method: 'GET',
        url: 'https://automation-and-ai-hub-backend.onrender.com/api/ai-hub/analytics/overview',
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          'Content-Type': 'application/json'
        }
      }
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * جلب بيانات المستخدم الحالي
 * GET /api/auth/me
 * 
 * الهيدر:
 * Authorization: Bearer TOKEN
 * 
 * الرد:
 * {
 *   "success": true,
 *   "data": {
 *     "id": 57,
 *     "name": "أحمد موقدي",
 *     "email": "a.moqadi@najah.edu",
 *     "work_days": "الأحد,الاثنين,الثلاثاء,الأربعاء,الخميس",
 *     "start_time": "08:00",
 *     "end_time": "16:00",
 *     "is_active": true,
 *     "last_login": "2026-04-28T10:00:00.000Z",
 *     "roles": [{ "id": 19, "name": "مخرج" }],
 *     "permissions": ["orders.view", "tasks.view", "shootings.view", "content.view", "content.create", "programs.view"]
 *   }
 * }
 */
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const user = await AuthService.getMe(BigInt(req.user.user_id));

    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch user data',
      timestamp: new Date().toISOString(),
    });
  }
});

// ════════════════════════════════════════════════════════════════
// إدارة صلاحيات الموظفين — news.dashboard permission required
// ════════════════════════════════════════════════════════════════

import { requirePermission } from '../../middleware/auth';
import { PermissionService } from '../../services/management/PermissionService';
import pool from '../../config/database';

/**
 * GET /api/auth/users — جلب كل الموظفين مع صلاحياتهم
 */
router.get('/users', authenticate, requirePermission('news.dashboard'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active, u.role_id, r.name as role_name
       FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.is_active = true
       ORDER BY u.name`
    );

    // Get permissions for each user
    const users = await Promise.all(result.rows.map(async (user: any) => {
      const permissions = await PermissionService.getUserPermissions(BigInt(user.id));
      return { ...user, permissions };
    }));

    res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/auth/permissions — جلب كل الصلاحيات المتاحة
 */
router.get('/permissions', authenticate, requirePermission('news.dashboard'), async (_req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await PermissionService.getAllPermissions();
    res.status(200).json({ success: true, data: permissions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/auth/users/:userId/permissions — تحديث صلاحيات موظف (user_permissions)
 * Body: { permissions: ['news.view', 'news.edit', ...] }
 */
router.put('/users/:userId/permissions', authenticate, requirePermission('news.dashboard'), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId);
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      res.status(400).json({ success: false, error: 'permissions must be an array' });
      return;
    }

    // حذف كل الصلاحيات اليدوية الحالية
    await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

    // إضافة الصلاحيات الجديدة
    if (permissions.length > 0) {
      await pool.query(
        `INSERT INTO user_permissions (user_id, permission_id)
         SELECT $1, p.id FROM permissions p WHERE p.name = ANY($2)
         ON CONFLICT DO NOTHING`,
        [userId, permissions]
      );
    }

    // إرجاع الصلاحيات المحدّثة
    const updatedPermissions = await PermissionService.getUserPermissions(BigInt(userId));

    res.status(200).json({
      success: true,
      message: 'تم تحديث الصلاحيات بنجاح',
      data: { userId, permissions: updatedPermissions },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
