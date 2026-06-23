import jwt from 'jsonwebtoken';
import { query } from '../../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'media-center-secret-key-change-in-production';

export interface AuthPayload {
  user_id: string;
  email: string;
  role_id: string;
  role_name: string;
}

/**
 * AuthService — نظام الأخبار/AI
 * ════════════════════════════════════════════════════════════════
 * ⚠️ تسجيل الدخول (login) وإنشاء الحسابات وإدارة كلمات السر
 *    تتم في نظام الإدارة المنفصل فقط — وليس هنا.
 *
 * هذا السيرفر يستقبل توكن صادر من نظام الإدارة، فيتحقق منه (verifyToken)
 * ويجلب بيانات المستخدم (getMe) للتحقق من الصلاحيات لا أكثر.
 */
export class AuthService {

  /**
   * التحقق من التوكن
   * بيفك التوكن وبيرجع بيانات المستخدم
   */
  static verifyToken(token: string): AuthPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * جلب بيانات المستخدم الحالي من التوكن
   */
  static async getMe(userId: bigint): Promise<any> {
    const result = await query(
      'SELECT u.id, u.name, u.email, u.work_days, u.start_time, u.end_time, u.is_active, u.last_login, u.created_at ' +
      'FROM users u WHERE u.id = $1',
      [userId]
    );
    if (result.rows.length === 0) throw new Error('User not found');

    const user = result.rows[0];

    // جلب كل أدوار المستخدم
    const rolesResult = await query(
      'SELECT r.id, r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [userId]
    );

    // جلب كل صلاحيات المستخدم (من أدواره + role_id + user_permissions)
    const permsResult = await query(
      `SELECT DISTINCT p.name FROM permissions p
       WHERE p.id IN (
         SELECT rp.permission_id FROM role_permissions rp
         INNER JOIN user_roles ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = $1
         UNION
         SELECT rp.permission_id FROM role_permissions rp
         INNER JOIN users u ON rp.role_id = u.role_id
         WHERE u.id = $1
         UNION
         SELECT up.permission_id FROM user_permissions up
         WHERE up.user_id = $1
       )`,
      [userId]
    );

    return {
      ...user,
      roles: rolesResult.rows,
      permissions: permsResult.rows.map((r: any) => r.name),
    };
  }
}
