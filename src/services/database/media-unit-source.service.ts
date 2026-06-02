/**
 * Media Unit Source Service
 * خدمة إدارة ربط المصادر بالوحدات الإعلامية
 * 
 * كل وحدة إعلامية لها مصادرها الخاصة
 * السحب يتم بناءً على المصادر المرتبطة بكل وحدة
 */

import { query } from '../../config/database';

export interface MediaUnitSource {
  id: number;
  media_unit_id: number;
  source_id: number;
  priority: number;
  is_active: boolean;
  created_at: Date;
}

export interface MediaUnitWithSources {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  sources: Array<{
    id: number;
    source_id: number;
    source_name: string;
    source_slug: string;
    source_url: string;
    priority: number;
    is_active: boolean;
  }>;
}

export interface MediaUnitInfo {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export class MediaUnitSourceService {
  /**
   * جلب كل الوحدات الإعلامية النشطة مع مصادرها
   */
  static async getAllWithSources(): Promise<MediaUnitWithSources[]> {
    const unitsResult = await query(
      `SELECT id, name, slug, is_active FROM media_units WHERE is_active = true ORDER BY id`
    );

    const units: MediaUnitWithSources[] = [];

    for (const unit of unitsResult.rows) {
      const sourcesResult = await query(
        `SELECT mus.id, mus.source_id, s.name as source_name, s.slug as source_slug, 
                s.url as source_url, mus.priority, mus.is_active
         FROM media_unit_sources mus
         JOIN sources s ON mus.source_id = s.id
         WHERE mus.media_unit_id = $1 AND mus.is_active = true
         ORDER BY mus.priority ASC, s.name ASC`,
        [unit.id]
      );

      units.push({
        ...unit,
        sources: sourcesResult.rows,
      });
    }

    return units;
  }

  /**
   * جلب وحدة إعلامية واحدة مع مصادرها
   */
  static async getBySlugWithSources(slug: string): Promise<MediaUnitWithSources | null> {
    const unitResult = await query(
      `SELECT id, name, slug, is_active FROM media_units WHERE slug = $1`,
      [slug]
    );

    if (unitResult.rows.length === 0) return null;

    const unit = unitResult.rows[0];
    const sourcesResult = await query(
      `SELECT mus.id, mus.source_id, s.name as source_name, s.slug as source_slug, 
              s.url as source_url, mus.priority, mus.is_active
       FROM media_unit_sources mus
       JOIN sources s ON mus.source_id = s.id
       WHERE mus.media_unit_id = $1 AND mus.is_active = true
       ORDER BY mus.priority ASC, s.name ASC`,
      [unit.id]
    );

    return {
      ...unit,
      sources: sourcesResult.rows,
    };
  }

  /**
   * جلب الوحدات الإعلامية المرتبطة بمصدر معين
   */
  static async getMediaUnitsBySourceId(sourceId: number): Promise<MediaUnitInfo[]> {
    const result = await query(
      `SELECT mu.id, mu.name, mu.slug, mu.is_active
       FROM media_units mu
       JOIN media_unit_sources mus ON mu.id = mus.media_unit_id
       WHERE mus.source_id = $1 AND mus.is_active = true AND mu.is_active = true
       ORDER BY mu.name`,
      [sourceId]
    );
    return result.rows;
  }

  /**
   * جلب الوحدات الإعلامية المرتبطة بمصدر عبر الـ slug
   */
  static async getMediaUnitsBySourceSlug(sourceSlug: string): Promise<MediaUnitInfo[]> {
    const result = await query(
      `SELECT mu.id, mu.name, mu.slug, mu.is_active
       FROM media_units mu
       JOIN media_unit_sources mus ON mu.id = mus.media_unit_id
       JOIN sources s ON mus.source_id = s.id
       WHERE s.slug = $1 AND mus.is_active = true AND mu.is_active = true
       ORDER BY mu.name`,
      [sourceSlug]
    );
    return result.rows;
  }

  /**
   * ربط مصدر بوحدة إعلامية
   */
  static async linkSource(mediaUnitId: number, sourceId: number, priority: number = 1): Promise<MediaUnitSource> {
    const result = await query(
      `INSERT INTO media_unit_sources (media_unit_id, source_id, priority, is_active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (media_unit_id, source_id) 
       DO UPDATE SET is_active = true, priority = $3
       RETURNING *`,
      [mediaUnitId, sourceId, priority]
    );
    return result.rows[0];
  }

  /**
   * إلغاء ربط مصدر من وحدة إعلامية (soft delete)
   */
  static async unlinkSource(mediaUnitId: number, sourceId: number): Promise<boolean> {
    const result = await query(
      `UPDATE media_unit_sources SET is_active = false WHERE media_unit_id = $1 AND source_id = $2`,
      [mediaUnitId, sourceId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * جلب slugs المصادر المرتبطة بوحدة إعلامية
   * يُستخدم لفلترة الأخبار من الـ API
   */
  static async getSourceSlugsForUnit(mediaUnitId: number): Promise<string[]> {
    const result = await query(
      `SELECT s.slug 
       FROM media_unit_sources mus
       JOIN sources s ON mus.source_id = s.id
       WHERE mus.media_unit_id = $1 AND mus.is_active = true AND s.is_active = true AND s.slug != ''
       ORDER BY mus.priority ASC`,
      [mediaUnitId]
    );
    return result.rows.map((r: any) => r.slug);
  }

  /**
   * جلب كل الوحدات الإعلامية النشطة مع slugs مصادرها
   * يُستخدم في الـ pipeline لسحب الأخبار per media unit
   */
  static async getActiveUnitsWithSourceSlugs(): Promise<Array<{
    id: number;
    name: string;
    slug: string;
    source_slugs: string[];
  }>> {
    const unitsResult = await query(
      `SELECT id, name, slug FROM media_units WHERE is_active = true AND slug != '' ORDER BY id`
    );

    const units: Array<{ id: number; name: string; slug: string; source_slugs: string[] }> = [];

    for (const unit of unitsResult.rows) {
      const slugs = await this.getSourceSlugsForUnit(unit.id);
      if (slugs.length > 0) {
        units.push({ ...unit, source_slugs: slugs });
      }
    }

    return units;
  }

  /**
   * جلب وحدة إعلامية بالـ ID
   */
  static async getById(id: number): Promise<MediaUnitInfo | null> {
    const result = await query(
      `SELECT id, name, slug, is_active FROM media_units WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * جلب وحدة إعلامية بالـ slug
   */
  static async getBySlug(slug: string): Promise<MediaUnitInfo | null> {
    const result = await query(
      `SELECT id, name, slug, is_active FROM media_units WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  }
}
