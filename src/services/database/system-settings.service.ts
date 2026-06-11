/**
 * System Settings Service
 * خدمة إدارة إعدادات النظام من الداتابيس
 * + تتبع التغييرات (Audit Log)
 */

import { query } from '../../config/database';

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by?: number | null;
  updated_by_email?: string | null;
}

export interface SettingsAuditEntry {
  id: number;
  setting_key: string;
  old_value: string | null;
  new_value: string;
  action_type: string;
  changed_by: number | null;
  changed_by_email: string | null;
  changed_by_role: string | null;
  description: string | null;
  created_at: string;
}

export interface AuditUserInfo {
  user_id?: number | string;
  email?: string;
  role_name?: string;
}

export class SystemSettingsService {
  /**
   * جلب جميع الإعدادات
   */
  static async getAll(): Promise<SystemSetting[]> {
    const result = await query(
      'SELECT * FROM system_settings ORDER BY key'
    );
    return result.rows;
  }

  /**
   * جلب قيمة إعداد واحد
   */
  static async get(key: string): Promise<string | null> {
    const result = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [key]
    );
    return result.rows[0]?.value ?? null;
  }

  /**
   * جلب قيمة boolean لإعداد
   */
  static async getBoolean(key: string, defaultValue: boolean = true): Promise<boolean> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    return value === 'true';
  }

  /**
   * جلب قيمة رقمية لإعداد
   */
  static async getNumber(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key);
    if (value === null) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * تحديث قيمة إعداد مع تسجيل التغيير
   */
  static async set(key: string, value: string, userInfo?: AuditUserInfo, description?: string): Promise<SystemSetting | null> {
    // جلب القيمة القديمة قبل التحديث
    const oldValue = await this.get(key);

    // لو القيمة ما تغيّرت، ما نسجّل شي
    if (oldValue === value) {
      const current = await query('SELECT * FROM system_settings WHERE key = $1', [key]);
      return current.rows[0] ?? null;
    }

    const userId = userInfo?.user_id ? Number(userInfo.user_id) : null;
    const email = userInfo?.email || null;

    // تحديث الإعداد
    const result = await query(
      `UPDATE system_settings 
       SET value = $1, updated_at = NOW(), updated_by = $3, updated_by_email = $4
       WHERE key = $2 
       RETURNING *`,
      [value, key, userId, email]
    );

    // تسجيل التغيير في الـ audit log
    await this.logChange({
      setting_key: key,
      old_value: oldValue,
      new_value: value,
      action_type: 'update',
      changed_by: userId,
      changed_by_email: email,
      changed_by_role: userInfo?.role_name || null,
      description: description || null,
    });

    return result.rows[0] ?? null;
  }

  /**
   * تحديث قيمة boolean لإعداد
   */
  static async setBoolean(key: string, value: boolean, userInfo?: AuditUserInfo, description?: string): Promise<SystemSetting | null> {
    return this.set(key, value ? 'true' : 'false', userInfo, description);
  }

  /**
   * تسجيل تغيير في الـ audit log
   */
  static async logChange(entry: {
    setting_key: string;
    old_value: string | null;
    new_value: string;
    action_type: string;
    changed_by: number | null;
    changed_by_email: string | null;
    changed_by_role: string | null;
    description: string | null;
  }): Promise<void> {
    try {
      await query(
        `INSERT INTO settings_audit_log 
           (setting_key, old_value, new_value, action_type, changed_by, changed_by_email, changed_by_role, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          entry.setting_key,
          entry.old_value,
          entry.new_value,
          entry.action_type,
          entry.changed_by,
          entry.changed_by_email,
          entry.changed_by_role,
          entry.description,
        ]
      );
    } catch (err) {
      // لا نوقف الـ flow إذا فشل الـ audit — فقط ننبه
      console.error('⚠️ فشل تسجيل التغيير في audit log:', err);
    }
  }

  /**
   * جلب سجل التغييرات (Audit Log)
   */
  static async getAuditLog(options?: {
    limit?: number;
    offset?: number;
    setting_key?: string;
  }): Promise<{ entries: SettingsAuditEntry[]; total: number }> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;
    const keyFilter = options?.setting_key;

    const whereClause = keyFilter ? 'WHERE setting_key = $3' : '';
    const params: any[] = [limit, offset];
    if (keyFilter) params.push(keyFilter);

    const [dataResult, countResult] = await Promise.all([
      query(
        `SELECT * FROM settings_audit_log ${whereClause}
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        params
      ),
      query(
        `SELECT COUNT(*) as total FROM settings_audit_log ${whereClause}`,
        keyFilter ? [keyFilter] : []
      ),
    ]);

    return {
      entries: dataResult.rows,
      total: parseInt(countResult.rows[0]?.total || '0', 10),
    };
  }

  /**
   * جلب حالة جميع الـ toggles والإعدادات دفعة واحدة
   */
  static async getToggles(): Promise<{
    scheduler_enabled: boolean;
    classifier_enabled: boolean;
    flow_enabled: boolean;
    auto_publish_enabled: boolean;
    scheduler_interval_minutes: number;
    articles_per_source: number;
  }> {
    const result = await query(
      `SELECT key, value FROM system_settings 
       WHERE key IN ('scheduler_enabled', 'classifier_enabled', 'flow_enabled', 'auto_publish_enabled', 'scheduler_interval_minutes', 'articles_per_source')`
    );

    const defaults: Record<string, any> = {
      scheduler_enabled: true,
      classifier_enabled: true,
      flow_enabled: true,
      auto_publish_enabled: false,
      scheduler_interval_minutes: 5,
      articles_per_source: 20,
    };

    for (const row of result.rows) {
      if (row.key === 'scheduler_interval_minutes' || row.key === 'articles_per_source') {
        const parsed = parseInt(row.value, 10);
        defaults[row.key] = isNaN(parsed) ? defaults[row.key] : parsed;
      } else {
        defaults[row.key] = row.value === 'true';
      }
    }

    return defaults as {
      scheduler_enabled: boolean;
      classifier_enabled: boolean;
      flow_enabled: boolean;
      auto_publish_enabled: boolean;
      scheduler_interval_minutes: number;
      articles_per_source: number;
    };
  }
}
