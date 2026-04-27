import pool from '../../config/database';

export class PermissionService {

  /**
   * جلب كل صلاحيات المستخدم (من كل أدواره)
   */
  static async getUserPermissions(userId: bigint): Promise<string[]> {
    const result = await pool.query(
      'SELECT DISTINCT p.name ' +
      'FROM permissions p ' +
      'INNER JOIN role_permissions rp ON p.id = rp.permission_id ' +
      'INNER JOIN user_roles ur ON rp.role_id = ur.role_id ' +
      'WHERE ur.user_id = $1',
      [userId]
    );
    return result.rows.map((r: any) => r.name);
  }

  /**
   * فحص إذا المستخدم عنده صلاحية معينة
   */
  static async userHasPermission(userId: bigint, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * جلب كل أدوار المستخدم
   */
  static async getUserRoles(userId: bigint): Promise<any[]> {
    const result = await pool.query(
      'SELECT r.id, r.name, r.description ' +
      'FROM roles r ' +
      'INNER JOIN user_roles ur ON r.id = ur.role_id ' +
      'WHERE ur.user_id = $1',
      [userId]
    );
    return result.rows;
  }

  /**
   * إضافة دور لمستخدم
   */
  static async addRoleToUser(userId: bigint, roleId: bigint): Promise<void> {
    await pool.query(
      'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, roleId]
    );
  }

  /**
   * حذف دور من مستخدم
   */
  static async removeRoleFromUser(userId: bigint, roleId: bigint): Promise<void> {
    await pool.query(
      'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2',
      [userId, roleId]
    );
  }

  /**
   * جلب كل الصلاحيات المتاحة
   */
  static async getAllPermissions(): Promise<any[]> {
    const result = await pool.query('SELECT * FROM permissions ORDER BY name');
    return result.rows;
  }

  /**
   * جلب صلاحيات دور معين
   */
  static async getRolePermissions(roleId: bigint): Promise<string[]> {
    const result = await pool.query(
      'SELECT p.name FROM permissions p ' +
      'INNER JOIN role_permissions rp ON p.id = rp.permission_id ' +
      'WHERE rp.role_id = $1',
      [roleId]
    );
    return result.rows.map((r: any) => r.name);
  }
}
