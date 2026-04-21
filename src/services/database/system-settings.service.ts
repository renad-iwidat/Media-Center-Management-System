/**
 * System Settings Service
 * خدمة إدارة إعدادات النظام من الداتابيس
 */

import { query } from '../../config/database';

export interface SystemSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
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
   * تحديث قيمة إعداد
   */
  static async set(key: string, value: string): Promise<SystemSetting | null> {
    const result = await query(
      `UPDATE system_settings 
       SET value = $1, updated_at = NOW() 
       WHERE key = $2 
       RETURNING *`,
      [value, key]
    );
    return result.rows[0] ?? null;
  }

  /**
   * تحديث قيمة boolean لإعداد
   */
  static async setBoolean(key: string, value: boolean): Promise<SystemSetting | null> {
    return this.set(key, value ? 'true' : 'false');
  }

  /**
   * جلب حالة جميع الـ toggles والإعدادات دفعة واحدة
   */
  static async getToggles(): Promise<{
    scheduler_enabled: boolean;
    classifier_enabled: boolean;
    flow_enabled: boolean;
    scheduler_interval_minutes: number;
    articles_per_source: number;
  }> {
    const result = await query(
      `SELECT key, value FROM system_settings 
       WHERE key IN ('scheduler_enabled', 'classifier_enabled', 'flow_enabled', 'scheduler_interval_minutes', 'articles_per_source')`
    );

    const defaults: Record<string, any> = {
      scheduler_enabled: true,
      classifier_enabled: true,
      flow_enabled: true,
      scheduler_interval_minutes: 15,
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
      scheduler_interval_minutes: number;
      articles_per_source: number;
    };
  }
}
