/**
 * NewsDesk Sync Service
 * طبقة المزامنة الموحّدة بين NewsDesk API الخارجي والداتابيس المحلي
 *
 * المسؤوليات:
 * 1. مزامنة التصنيفات (categories) — بالـ slug
 * 2. مزامنة النطاقات الجغرافية (geographic_scopes) — بالـ slug
 * 3. مزامنة الوحدات الإعلامية (media_units) — بالـ slug
 * 4. مزامنة المصادر (sources) + ربطها بالوحدات (media_unit_sources)
 *
 * كل المزامنة تعتمد على الـ slug (وليس الـ id) لضمان الاستقرار
 * حتى لو أعيد إنشاء الجداول من الصفر.
 */

import { query } from '../../config/database';
import { newsDeskApiService } from './newsdesk-api.service';
import { SourceService } from '../database/database.service';
import { MediaUnitSourceService } from '../database/media-unit-source.service';

/**
 * خريطة الـ flow حسب slug التصنيف (مستقرة — لا تعتمد على الـ id)
 * editorial = يروح لقسم التحرير | automated = نشر تلقائي
 */
const CATEGORY_FLOW_BY_SLUG: Record<string, 'automated' | 'editorial'> = {
  // تحريري
  politics: 'editorial',
  society: 'editorial',     // محلي
  security: 'editorial',    // أمن وعسكري
  other: 'editorial',       // دولي/أخرى
  religion: 'editorial',
  // أوتوماتيكي
  economy: 'automated',
  sports: 'automated',
  health: 'automated',
  technology: 'automated',
  culture: 'automated',
  environment: 'automated',
  food: 'automated',
};

const DEFAULT_FLOW: 'automated' | 'editorial' = 'editorial';

export interface SyncResult {
  categories: number;
  geoScopes: number;
  mediaUnits: number;
  sources: number;
  links: number;
  errors: string[];
}

class NewsDeskSyncService {
  /**
   * مزامنة كاملة — تُستدعى في بداية كل دورة scheduler
   */
  async syncAll(): Promise<SyncResult> {
    const result: SyncResult = {
      categories: 0,
      geoScopes: 0,
      mediaUnits: 0,
      sources: 0,
      links: 0,
      errors: [],
    };

    await this.syncCategories(result);
    await this.syncGeoScopes(result);
    await this.syncMediaUnitsAndSources(result);

    // إصلاح الروابط الناقصة في الأخبار الموجودة (backfill)
    await this.backfillRawDataLinks(result);

    return result;
  }

  /**
   * ربط الأخبار الموجودة (raw_data) بالـ geo_scope_id و category_id
   * بناءً على الـ slugs المحفوظة — يصلح الأخبار اللي اتخزنت قبل المزامنة
   */
  private async backfillRawDataLinks(result: SyncResult): Promise<void> {
    try {
      // 1. ربط geo_scope_id من geo_scope_slug
      await query(
        `UPDATE raw_data r
         SET geo_scope_id = gs.id
         FROM geographic_scopes gs
         WHERE r.geo_scope_slug = gs.slug
           AND r.geo_scope_id IS NULL
           AND COALESCE(r.geo_scope_slug, '') != ''`
      );

      // 2. ربط category_id من category_slug
      await query(
        `UPDATE raw_data r
         SET category_id = c.id
         FROM categories c
         WHERE r.category_slug = c.slug
           AND r.category_id IS NULL
           AND COALESCE(r.category_slug, '') != ''`
      );

      // 3. ربط source_id من source_slug (للأخبار اللي اتخزنت بدون source_id)
      await query(
        `UPDATE raw_data r
         SET source_id = s.id
         FROM sources s
         WHERE r.source_slug = s.slug
           AND r.source_id IS NULL
           AND COALESCE(r.source_slug, '') != ''`
      );

      // 4. ربط media_unit_id من المصدر (للأخبار بدون وحدة — نربطها بأول وحدة مرتبطة بمصدرها)
      await query(
        `UPDATE raw_data r
         SET media_unit_id = sub.media_unit_id
         FROM (
           SELECT DISTINCT ON (mus.source_id) mus.source_id, mus.media_unit_id
           FROM media_unit_sources mus
           WHERE mus.is_active = true
           ORDER BY mus.source_id, mus.priority ASC
         ) sub
         WHERE r.source_id = sub.source_id
           AND r.media_unit_id IS NULL
           AND r.source_id IS NOT NULL`
      );
    } catch (err) {
      result.errors.push(`backfillRawDataLinks: ${err instanceof Error ? err.message : err}`);
      console.warn(`   ⚠️  فشل إصلاح روابط الأخبار:`, err instanceof Error ? err.message : err);
    }
  }

  /**
   * مزامنة التصنيفات (categories) — بالـ slug + الـ flow الصحيح
   */
  async syncCategories(result: SyncResult): Promise<void> {
    try {
      const apiCategories = await newsDeskApiService.getCategories(false);
      if (!Array.isArray(apiCategories)) return;

      for (const cat of apiCategories) {
        const slug = cat.slug || '';
        if (!slug) continue;

        const nameAr = cat.name_ar || cat.name || slug;
        const flow = CATEGORY_FLOW_BY_SLUG[slug] || DEFAULT_FLOW;

        try {
          const existing = await query(
            `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
            [slug]
          );

          if (existing.rows.length > 0) {
            await query(
              `UPDATE categories SET name = $1, flow = $2, is_active = true WHERE slug = $3`,
              [nameAr, flow, slug]
            );
          } else {
            await query(
              `INSERT INTO categories (name, slug, flow, is_active) VALUES ($1, $2, $3, true)`,
              [nameAr, slug, flow]
            );
          }
          result.categories++;
        } catch (err) {
          result.errors.push(`category "${slug}": ${err instanceof Error ? err.message : err}`);
        }
      }
      console.log(`   ✅ تصنيفات: ${result.categories}`);
    } catch (err) {
      result.errors.push(`syncCategories: ${err instanceof Error ? err.message : err}`);
      console.warn(`   ⚠️  فشل مزامنة التصنيفات:`, err instanceof Error ? err.message : err);
    }
  }

  /**
   * مزامنة النطاقات الجغرافية (geographic_scopes) — بالـ slug
   */
  async syncGeoScopes(result: SyncResult): Promise<void> {
    try {
      const apiScopes = await newsDeskApiService.getGeographicScopes();
      if (!Array.isArray(apiScopes)) return;

      for (const scope of apiScopes) {
        const slug = scope.slug || '';
        if (!slug) continue;

        const nameAr = scope.name_ar || scope.name || slug;
        const nameEn = scope.name_en || '';
        const scopeLevel = scope.scope_level || 'local';
        const countryCode = scope.country_code || null;

        try {
          const existing = await query(
            `SELECT id FROM geographic_scopes WHERE slug = $1 LIMIT 1`,
            [slug]
          );

          if (existing.rows.length > 0) {
            await query(
              `UPDATE geographic_scopes 
               SET name_ar = $1, name_en = $2, scope_level = $3, country_code = $4, is_active = true 
               WHERE slug = $5`,
              [nameAr, nameEn, scopeLevel, countryCode, slug]
            );
          } else {
            await query(
              `INSERT INTO geographic_scopes (slug, name_ar, name_en, scope_level, country_code, is_active) 
               VALUES ($1, $2, $3, $4, $5, true)`,
              [slug, nameAr, nameEn, scopeLevel, countryCode]
            );
          }
          result.geoScopes++;
        } catch (err) {
          result.errors.push(`geo_scope "${slug}": ${err instanceof Error ? err.message : err}`);
        }
      }
      console.log(`   ✅ نطاقات جغرافية: ${result.geoScopes}`);
    } catch (err) {
      result.errors.push(`syncGeoScopes: ${err instanceof Error ? err.message : err}`);
      console.warn(`   ⚠️  فشل مزامنة النطاقات الجغرافية:`, err instanceof Error ? err.message : err);
    }
  }

  /**
   * مزامنة الوحدات الإعلامية ومصادرها وربطها
   */
  async syncMediaUnitsAndSources(result: SyncResult): Promise<void> {
    try {
      const apiMediaUnits = await newsDeskApiService.getAdminMediaUnits(false);
      if (!Array.isArray(apiMediaUnits)) {
        // fallback: المصادر المنفردة فقط
        await this.syncStandaloneSources(result);
        return;
      }

      for (const apiUnit of apiMediaUnits) {
        const slug = apiUnit.slug || (apiUnit.name?.toLowerCase().replace(/\s+/g, '-') ?? '');
        if (!slug) continue;

        try {
          // إنشاء/تحديث الوحدة الإعلامية بالـ slug
          const localUnitId = await this.upsertMediaUnit(
            slug,
            apiUnit.name || slug,
            apiUnit.is_active !== false
          );
          result.mediaUnits++;

          // ربط المصادر بالوحدة
          const apiSources = apiUnit.sources || [];
          for (const apiSource of apiSources) {
            const sourceSlug = apiSource.source_slug || apiSource.slug || '';
            if (!sourceSlug) continue;

            try {
              const localSource = await SourceService.findOrCreateBySlug(
                sourceSlug,
                apiSource.source_name || apiSource.name || sourceSlug,
                apiSource.source_url || apiSource.base_url || ''
              );
              result.sources++;

              await MediaUnitSourceService.linkSource(
                localUnitId,
                localSource.id,
                apiSource.priority || 1
              );
              result.links++;
            } catch (srcErr) {
              result.errors.push(`source "${sourceSlug}": ${srcErr instanceof Error ? srcErr.message : srcErr}`);
            }
          }
        } catch (unitErr) {
          result.errors.push(`media_unit "${slug}": ${unitErr instanceof Error ? unitErr.message : unitErr}`);
        }
      }

      // مزامنة المصادر المنفردة كمان (للتأكد من اكتمال جدول sources)
      await this.syncStandaloneSources(result);

      console.log(`   ✅ وحدات: ${result.mediaUnits} | مصادر: ${result.sources} | ربط: ${result.links}`);
    } catch (err) {
      result.errors.push(`syncMediaUnitsAndSources: ${err instanceof Error ? err.message : err}`);
      console.warn(`   ⚠️  فشل مزامنة الوحدات:`, err instanceof Error ? err.message : err);
    }
  }

  /**
   * مزامنة كل المصادر المنفردة من /sources (للتأكد من اكتمال جدول sources)
   */
  private async syncStandaloneSources(result: SyncResult): Promise<void> {
    try {
      const apiSources = await newsDeskApiService.getSources(false);
      if (!Array.isArray(apiSources)) return;

      for (const src of apiSources) {
        const srcSlug = src.slug || '';
        if (!srcSlug) continue;
        try {
          await SourceService.findOrCreateBySlug(srcSlug, src.name || srcSlug, src.base_url || '');
        } catch { /* تجاهل الأخطاء الفردية */ }
      }
    } catch { /* تجاهل */ }
  }

  /**
   * إنشاء أو تحديث وحدة إعلامية بالـ slug (يتعامل مع غياب updated_at)
   */
  private async upsertMediaUnit(slug: string, name: string, isActive: boolean): Promise<number> {
    const existing = await query(
      `SELECT id FROM media_units WHERE slug = $1 LIMIT 1`,
      [slug]
    );

    if (existing.rows.length > 0) {
      await query(
        `UPDATE media_units SET name = $1, is_active = $2 WHERE slug = $3`,
        [name, isActive, slug]
      );
      return existing.rows[0].id;
    }

    const inserted = await query(
      `INSERT INTO media_units (name, slug, is_active, created_at) 
       VALUES ($1, $2, $3, NOW()) RETURNING id`,
      [name, slug, isActive]
    );
    return inserted.rows[0].id;
  }
}

export const newsDeskSyncService = new NewsDeskSyncService();
export default newsDeskSyncService;
