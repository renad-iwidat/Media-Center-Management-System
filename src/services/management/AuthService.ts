import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'media-center-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthPayload {
  user_id: string;
  email: string;
  role_id: string;
  role_name: string;
}

export class AuthService {

  /**
   * تسجيل مستخدم جديد (يستخدمه الأدمن فقط)
   * بياخذ بيانات المستخدم + كلمة السر، بيشفر كلمة السر وبيحفظها
   */
  static async register(data: {
    name: string;
    email: string;
    password: string;
    role_id?: bigint;
    work_days?: string;
    start_time?: string;
    end_time?: string;
  }): Promise<any> {
    // نتأكد الإيميل مش مستخدم
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [data.email]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // نشفر كلمة السر
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // ننشئ المستخدم
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role_id, work_days, start_time, end_time, is_active) ' +
      'VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING id, name, email, role_id, is_active, created_at',
      [data.name, data.email, passwordHash, data.role_id || null, data.work_days || null, data.start_time || null, data.end_time || null]
    );

    return result.rows[0];
  }

  /**
   * تسجيل دخول
   * بياخذ الإيميل وكلمة السر، بيتحقق منهم، وبيرجع توكن
   */
  static async login(email: string, password: string): Promise<{ token: string; user: any }> {
    // نجيب المستخدم
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.password_hash, u.is_active FROM users u WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid email or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new Error('Account is disabled');
    }

    if (!user.password_hash) {
      throw new Error('Password not set. Please contact admin to set your password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // نجيب كل أدوار المستخدم
    const rolesResult = await pool.query(
      'SELECT r.id, r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [user.id]
    );
    const roles = rolesResult.rows;
    const primaryRole = roles[0] || { id: null, name: 'Other Staff' };

    const payload: AuthPayload = {
      user_id: String(user.id),
      email: user.email,
      role_id: String(primaryRole.id),
      role_name: primaryRole.name,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roles: roles,
      },
    };
  }

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
   * تغيير كلمة السر
   */
  static async changePassword(userId: bigint, oldPassword: string, newPassword: string): Promise<void> {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0];

    // إذا المستخدم ما عنده كلمة سر (مستخدم قديم) — نحط الجديدة مباشرة
    if (user.password_hash) {
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
    }

    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, userId]);
  }

  /**
   * تعيين كلمة سر لمستخدم (يستخدمه الأدمن)
   * مفيد للمستخدمين القدام اللي ما عندهم كلمة سر
   */
  static async setPassword(userId: bigint, newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
  }

  /**
   * جلب بيانات المستخدم الحالي من التوكن
   */
  static async getMe(userId: bigint): Promise<any> {
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.work_days, u.start_time, u.end_time, u.is_active, u.last_login, u.created_at ' +
      'FROM users u WHERE u.id = $1',
      [userId]
    );
    if (result.rows.length === 0) throw new Error('User not found');

    const user = result.rows[0];

    // جلب كل أدوار المستخدم
    const rolesResult = await pool.query(
      'SELECT r.id, r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
      [userId]
    );

    // جلب كل صلاحيات المستخدم
    const permsResult = await pool.query(
      'SELECT DISTINCT p.name FROM permissions p ' +
      'INNER JOIN role_permissions rp ON p.id = rp.permission_id ' +
      'INNER JOIN user_roles ur ON rp.role_id = ur.role_id ' +
      'WHERE ur.user_id = $1',
      [userId]
    );

    return {
      ...user,
      roles: rolesResult.rows,
      permissions: permsResult.rows.map((r: any) => r.name),
    };
  }
}
