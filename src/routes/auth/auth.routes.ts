/**
 * نقاط وصول المصادقة
 * POST /api/auth/login — تسجيل الدخول
 * GET /api/auth/me — جلب بيانات المستخدم الحالي
 */

import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/management/AuthService';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * تسجيل الدخول
 * POST /api/auth/login
 * 
 * الجسم:
 * {
 *   "email": "a.moqadi@najah.edu",
 *   "password": "a.mo1234"
 * }
 * 
 * الرد:
 * {
 *   "success": true,
 *   "data": {
 *     "token": "eyJhbGciOiJIUzI1NiIs...",
 *     "user": {
 *       "id": 57,
 *       "name": "أحمد موقدي",
 *       "email": "a.moqadi@najah.edu",
 *       "roles": [{ "id": 19, "name": "مخرج" }]
 *     }
 *   }
 * }
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const result = await AuthService.login(email, password);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed',
      timestamp: new Date().toISOString(),
    });
  }
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

export default router;
