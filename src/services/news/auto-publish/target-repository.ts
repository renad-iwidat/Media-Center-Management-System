/**
 * Target Repository
 * عمليات CRUD لأهداف النشر الخارجية (auto_publish_targets)
 */

import { query } from '../../../config/database';
import {
  AutoPublishTarget,
  AutoPublishArticle,
  CreateTargetDTO,
  UpdateTargetDTO,
  ExternalCategory,
  AutoPublishStats,
} from './types';
import { SystemSettingsService } from '../../database/system-settings.service';

export class TargetRepository {

  // ══════════════════════════════════════════════════════════════════════════════
  // Read Operations
  // ══════════════════════════════════════════════════════════════════════════════

  async getAll(): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       ORDER BY apt.media_unit_id, apt.name`
    );
    return result.rows;
  }

  async getByMediaUnit(mediaUnitId: number): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.media_unit_id = $1
       ORDER BY apt.name`,
      [mediaUnitId]
    );
    return result.rows;
  }

  async getById(targetId: number): Promise<AutoPublishTarget | null> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.id = $1`,
      [targetId]
    );
    return result.rows[0] || null;
  }

  async getEnabledForAutoPublish(): Promise<AutoPublishTarget[]> {
    const result = await query(
      `SELECT apt.*, mu.name as media_unit_name
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       WHERE apt.auto_enabled = true`
    );
    return result.rows;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Write Operations
  // ══════════════════════════════════════════════════════════════════════════════

  async create(data: CreateTargetDTO): Promise<AutoPublishTarget> {
    const manualEnabled = data.manual_enabled ?? data.is_enabled ?? false;
    const autoEnabled = data.auto_enabled ?? data.is_enabled ?? false;

    const result = await query(
      `INSERT INTO auto_publish_targets
         (media_unit_id, name, api_url, api_token, auth_type,
          default_category_id, category_mappings, default_auto_publish, default_pin,
          categories_api_url, publish_mode, manual_enabled, auto_enabled, is_enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        data.media_unit_id,
        data.name,
        data.api_url,
        data.api_token,
        data.auth_type || 'bearer',
        data.default_category_id || 1,
        JSON.stringify(data.category_mappings || {}),
        data.default_auto_publish ?? true,
        data.default_pin ?? 0,
        data.categories_api_url || null,
        data.publish_mode || 'automated',
        manualEnabled,
        autoEnabled,
        manualEnabled || autoEnabled,
      ]
    );
    return result.rows[0];
  }

  async update(targetId: number, data: UpdateTargetDTO): Promise<AutoPublishTarget | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined)                { fields.push(`name = $${paramIndex++}`);                values.push(data.name); }
    if (data.api_url !== undefined)             { fields.push(`api_url = $${paramIndex++}`);             values.push(data.api_url); }
    if (data.api_token !== undefined)           { fields.push(`api_token = $${paramIndex++}`);           values.push(data.api_token); }
    if (data.auth_type !== undefined)           { fields.push(`auth_type = $${paramIndex++}`);           values.push(data.auth_type); }
    if (data.default_category_id !== undefined) { fields.push(`default_category_id = $${paramIndex++}`); values.push(data.default_category_id); }
    if (data.category_mappings !== undefined)   { fields.push(`category_mappings = $${paramIndex++}`);   values.push(JSON.stringify(data.category_mappings)); }
    if (data.default_auto_publish !== undefined){ fields.push(`default_auto_publish = $${paramIndex++}`); values.push(data.default_auto_publish); }
    if (data.default_pin !== undefined)         { fields.push(`default_pin = $${paramIndex++}`);         values.push(data.default_pin); }
    if (data.categories_api_url !== undefined)  { fields.push(`categories_api_url = $${paramIndex++}`);  values.push(data.categories_api_url); }
    if (data.publish_mode !== undefined)        { fields.push(`publish_mode = $${paramIndex++}`);        values.push(data.publish_mode); }
    if (data.manual_enabled !== undefined)      { fields.push(`manual_enabled = $${paramIndex++}`);      values.push(data.manual_enabled); }
    if (data.auto_enabled !== undefined)        { fields.push(`auto_enabled = $${paramIndex++}`);        values.push(data.auto_enabled); }
    if (data.daily_auto_limit !== undefined)    { fields.push(`daily_auto_limit = $${paramIndex++}`);    values.push(data.daily_auto_limit); }

    // is_enabled = manual_enabled OR auto_enabled (يُحدَّث تلقائياً)
    if (data.manual_enabled !== undefined || data.auto_enabled !== undefined) {
      fields.push(`is_enabled = (
        COALESCE($${paramIndex}::boolean, manual_enabled) OR COALESCE($${paramIndex + 1}::boolean, auto_enabled)
      )`);
      values.push(data.manual_enabled !== undefined ? data.manual_enabled : null);
      values.push(data.auto_enabled !== undefined ? data.auto_enabled : null);
      paramIndex += 2;
    } else if (data.is_enabled !== undefined) {
      fields.push(`is_enabled = $${paramIndex++}`);
      values.push(data.is_enabled);
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = NOW()`);
    values.push(targetId);

    const result = await query(
      `UPDATE auto_publish_targets SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  async delete(targetId: number): Promise<boolean> {
    await query('DELETE FROM auto_publish_log WHERE target_id = $1', [targetId]);
    const result = await query('DELETE FROM auto_publish_targets WHERE id = $1', [targetId]);
    return (result.rowCount ?? 0) > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Articles Query
  // ══════════════════════════════════════════════════════════════════════════════

  /**
   * جلب الأخبار الجاهزة للنشر التلقائي على هدف معين
   * فقط: أوتوماتيكية + معاد صياغتها + اليوم + لم تُنشر بعد
   */
  async getUnpublishedArticles(targetId: number, mediaUnitId: number, limit: number = 20): Promise<AutoPublishArticle[]> {
    const result = await query(
      `SELECT rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.category_id,
              c.slug as category_slug, pi.media_unit_id
       FROM published_items pi
       JOIN raw_data rd ON rd.id = pi.raw_data_id
       JOIN categories c ON c.id = rd.category_id
       WHERE pi.media_unit_id = $1
         AND pi.is_active = true
         AND c.flow = 'automated'
         AND rd.is_rewritten = true
         AND pi.published_at >= CURRENT_DATE
         AND rd.id NOT IN (
           SELECT raw_data_id FROM auto_publish_log
           WHERE target_id = $2 AND status = 'success'
         )
       ORDER BY pi.published_at DESC
       LIMIT $3`,
      [mediaUnitId, targetId, limit]
    );

    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: row.media_unit_id,
    }));
  }

  /**
   * جلب خبر واحد بالـ ID (للنشر اليدوي)
   * يفضّل النسخة المعدّلة من published_items
   */
  async getArticleForManualPublish(rawDataId: number): Promise<AutoPublishArticle | null> {
    const result = await query(
      `SELECT rd.id,
              COALESCE(pi.title, rd.title)         AS title,
              COALESCE(pi.content, rd.content)     AS content,
              COALESCE(pi.image_url, rd.image_url) AS image_url,
              COALESCE(pi.tags, rd.tags)           AS tags,
              rd.category_id,
              c.slug as category_slug
       FROM raw_data rd
       LEFT JOIN categories c ON c.id = rd.category_id
       LEFT JOIN LATERAL (
         SELECT title, content, image_url, tags
         FROM published_items
         WHERE raw_data_id = rd.id AND is_active = true
         ORDER BY published_at DESC
         LIMIT 1
       ) pi ON TRUE
       WHERE rd.id = $1`,
      [rawDataId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      image_url: row.image_url || null,
      tags: row.tags || [],
      category_id: row.category_id,
      category_slug: row.category_slug,
      media_unit_id: 0, // سيُملأ من الـ target
    };
  }

  /**
   * فحص إذا الخبر منشور مسبقاً على هدف معين
   */
  async isAlreadyPublished(targetId: number, rawDataId: number): Promise<boolean> {
    const result = await query(
      `SELECT id FROM auto_publish_log WHERE target_id = $1 AND raw_data_id = $2 AND status = 'success'`,
      [targetId, rawDataId]
    );
    return result.rows.length > 0;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // External Categories
  // ══════════════════════════════════════════════════════════════════════════════

  async fetchExternalCategories(targetId: number): Promise<ExternalCategory[]> {
    const target = await this.getById(targetId);
    if (!target || !target.categories_api_url) return [];

    const authHeader = target.auth_type === 'token'
      ? `Token ${target.api_token}`
      : `Bearer ${target.api_token}`;

    const allCategories: any[] = [];
    let nextUrl: string | null = target.categories_api_url;

    try {
      while (nextUrl) {
        const fetchRes = await fetch(nextUrl, {
          headers: { 'Accept': 'application/json', 'Authorization': authHeader },
          signal: AbortSignal.timeout(10000),
        });

        if (!fetchRes.ok) {
          console.error(`❌ فشل جلب التصنيفات (${fetchRes.status}) من: ${nextUrl}`);
          break;
        }

        const pageData = await fetchRes.json() as any;
        const results = pageData.results || (Array.isArray(pageData) ? pageData : []);
        allCategories.push(...results);

        const maybeNext = pageData.next;
        nextUrl = (typeof maybeNext === 'string' && maybeNext.startsWith('http')) ? maybeNext : null;
      }
    } catch (err) {
      console.error('❌ خطأ في جلب التصنيفات الخارجية:', err);
    }

    // تسطيح الشجرة
    const flat: ExternalCategory[] = [];
    for (const cat of allCategories) {
      flat.push({ id: cat.id, title: cat.title, parent_id: null, children: cat.children || [] });
      if (cat.children?.length > 0) {
        for (const child of cat.children) {
          flat.push({ id: child.id, title: child.title, parent_id: cat.id });
        }
      }
    }

    return flat;
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // Stats
  // ══════════════════════════════════════════════════════════════════════════════

  async getStats(): Promise<AutoPublishStats> {
    const masterEnabled = await SystemSettingsService.getBoolean('auto_publish_enabled', false);

    const result = await query(
      `SELECT
         apt.id, apt.name, apt.is_enabled, apt.manual_enabled, apt.auto_enabled,
         apt.default_auto_publish, apt.default_pin, apt.auth_type, apt.daily_auto_limit,
         mu.name as media_unit_name,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success') as total_published,
         COUNT(apl.id) FILTER (WHERE apl.status = 'failed') as total_failed,
         COUNT(apl.id) FILTER (WHERE apl.status = 'success' AND apl.published_at > NOW() - INTERVAL '24 hours') as published_today,
         MAX(CASE WHEN apl.status = 'success' THEN apl.published_at END) as last_published_at
       FROM auto_publish_targets apt
       JOIN media_units mu ON mu.id = apt.media_unit_id
       LEFT JOIN auto_publish_log apl ON apl.target_id = apt.id
       GROUP BY apt.id, apt.name, apt.is_enabled, apt.manual_enabled, apt.auto_enabled,
                apt.default_auto_publish, apt.default_pin, apt.auth_type, apt.daily_auto_limit, mu.name
       ORDER BY apt.media_unit_id, apt.name`
    );

    return {
      masterEnabled,
      targets: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        mediaUnitName: row.media_unit_name,
        isEnabled: row.is_enabled,
        manualEnabled: row.manual_enabled ?? false,
        autoEnabled: row.auto_enabled ?? false,
        defaultAutoPublish: row.default_auto_publish ?? true,
        defaultPin: row.default_pin ?? 0,
        authType: row.auth_type || 'bearer',
        dailyAutoLimit: row.daily_auto_limit ?? null,
        totalPublished: parseInt(row.total_published) || 0,
        totalFailed: parseInt(row.total_failed) || 0,
        publishedToday: parseInt(row.published_today) || 0,
        lastPublishedAt: row.last_published_at || null,
      })),
    };
  }
}

export const targetRepository = new TargetRepository();
