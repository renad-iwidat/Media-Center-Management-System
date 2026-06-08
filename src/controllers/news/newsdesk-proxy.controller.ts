/**
 * NewsDesk Proxy Controller
 * يمرر الطلبات من الفرونت اند إلى NewsDesk API الخارجي
 * 
 * هاد الكنترولر بيعمل bridge بين المشروع والـ API الخارجي
 * عشان الفرونت اند يقدر يتحكم بالمصادر والسحب والتصنيف
 */

import { Request, Response } from 'express';
import { newsDeskApiService } from '../../services/news/newsdesk-api.service';

export class NewsDeskProxyController {

  // ══════════════════════════════════════════════════════════════════════════
  // Health
  // ══════════════════════════════════════════════════════════════════════════

  static async health(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.healthCheck();
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل الاتصال بـ NewsDesk API', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Sources
  // ══════════════════════════════════════════════════════════════════════════

  static async listSources(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active_only === 'true';
      const data = await newsDeskApiService.getSources(activeOnly);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المصادر', error: (error as Error).message });
    }
  }

  static async getSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getSourceBySlug(req.params.slug);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المصدر', error: (error as Error).message });
    }
  }

  static async createSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.createSource(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل إنشاء المصدر', error: (error as Error).message });
    }
  }

  static async updateSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.updateSource(req.params.slug, req.body);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تحديث المصدر', error: (error as Error).message });
    }
  }

  static async deleteSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.deleteSource(req.params.slug);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل حذف المصدر', error: (error as Error).message });
    }
  }

  static async activateSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.activateSource(req.params.slug);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تفعيل المصدر', error: (error as Error).message });
    }
  }

  static async deactivateSource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.deactivateSource(req.params.slug);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل إيقاف المصدر', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Articles
  // ══════════════════════════════════════════════════════════════════════════

  static async listArticles(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getArticles(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المقالات', error: (error as Error).message });
    }
  }

  static async getArticle(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getArticleById(parseInt(req.params.id));
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المقالة', error: (error as Error).message });
    }
  }

  static async articlesBySource(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getArticlesBySource(req.params.slug, req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المقالات', error: (error as Error).message });
    }
  }

  static async articlesByCategory(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getArticlesByCategory(req.params.slug, req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب المقالات', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Scraper Control
  // ══════════════════════════════════════════════════════════════════════════

  static async triggerFetch(req: Request, res: Response): Promise<void> {
    try {
      const sourceSlug = req.query.source_slug as string | undefined;
      const data = await newsDeskApiService.triggerFetch(sourceSlug);
      res.json({ success: true, message: 'تم تشغيل السحب', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تشغيل السحب', error: (error as Error).message });
    }
  }

  static async triggerFetchAsync(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.triggerFetchAsync();
      res.json({ success: true, message: 'تم تشغيل السحب بالخلفية', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تشغيل السحب', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Scheduler (Remote)
  // ══════════════════════════════════════════════════════════════════════════

  static async getRemoteSchedulerStatus(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getRemoteSchedulerStatus();
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب حالة الـ scheduler', error: (error as Error).message });
    }
  }

  static async startRemoteScheduler(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.startRemoteScheduler();
      res.json({ success: true, message: 'تم تشغيل الـ scheduler', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تشغيل الـ scheduler', error: (error as Error).message });
    }
  }

  static async stopRemoteScheduler(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.stopRemoteScheduler();
      res.json({ success: true, message: 'تم إيقاف الـ scheduler', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل إيقاف الـ scheduler', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Categories & Geo Scopes
  // ══════════════════════════════════════════════════════════════════════════

  static async listCategories(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active_only === 'true';
      const data = await newsDeskApiService.getCategories(activeOnly);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب التصنيفات', error: (error as Error).message });
    }
  }

  static async listGeoScopes(req: Request, res: Response): Promise<void> {
    try {
      const scopeLevel = req.query.scope_level as string | undefined;
      const data = await newsDeskApiService.getGeographicScopes(scopeLevel);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب النطاقات الجغرافية', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Admin
  // ══════════════════════════════════════════════════════════════════════════

  static async adminStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getAdminStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب الإحصائيات', error: (error as Error).message });
    }
  }

  static async adminSettings(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getAdminSettings();
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب الإعدادات', error: (error as Error).message });
    }
  }

  static async updateAdminSettings(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.updateAdminSettings(req.body);
      res.json({ success: true, message: 'تم تحديث الإعدادات', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تحديث الإعدادات', error: (error as Error).message });
    }
  }

  static async adminLogs(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getAdminLogs(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب السجلات', error: (error as Error).message });
    }
  }

  static async runClassifier(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const data = await newsDeskApiService.runClassifier(limit);
      res.json({ success: true, message: 'تم تشغيل التصنيف', data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل تشغيل التصنيف', error: (error as Error).message });
    }
  }

  static async classifierStats(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getClassifierStats();
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب إحصائيات التصنيف', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Media Units (من الـ API الخارجي)
  // ══════════════════════════════════════════════════════════════════════════

  static async listMediaUnits(req: Request, res: Response): Promise<void> {
    try {
      const activeOnly = req.query.active_only === 'true';
      const data = await newsDeskApiService.getAdminMediaUnits(activeOnly);
      res.json({ success: true, count: Array.isArray(data) ? data.length : 0, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب الوحدات الإعلامية', error: (error as Error).message });
    }
  }

  static async getMediaUnit(req: Request, res: Response): Promise<void> {
    try {
      const data = await newsDeskApiService.getAdminMediaUnitBySlug(req.params.slug);
      res.json({ success: true, data });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل جلب الوحدة الإعلامية', error: (error as Error).message });
    }
  }

  /**
   * POST /api/newsdesk/sync/all
   * مزامنة كاملة: وحدات إعلامية + مصادر + ربط
   * يجلب من الـ API الخارجي ويحفظ في الداتابيس المحلي
   */
  static async syncAll(req: Request, res: Response): Promise<void> {
    try {
      const { SourceService } = await import('../../services/database/database.service');
      const { MediaUnitSourceService } = await import('../../services/database/media-unit-source.service');
      const { query } = await import('../../config/database');

      // جلب كل الوحدات مع مصادرها من الـ API الخارجي
      const { mediaUnits } = await newsDeskApiService.syncAllMediaUnitsAndSources();

      let syncedUnits = 0;
      let syncedSources = 0;
      let syncedLinks = 0;
      const errors: string[] = [];

      for (const apiUnit of mediaUnits) {
        try {
          // 1. إنشاء/تحديث الوحدة الإعلامية محلياً
          const slug = apiUnit.slug || apiUnit.name?.toLowerCase().replace(/\s+/g, '-') || '';
          if (!slug) {
            errors.push(`تخطي وحدة بدون slug: ${apiUnit.name}`);
            continue;
          }

          // التحقق من وجود الوحدة محلياً
          const existingUnit = await query(
            `SELECT id FROM media_units WHERE slug = $1 LIMIT 1`,
            [slug]
          );

          let localUnitId: number;

          if (existingUnit.rows.length > 0) {
            // تحديث الوحدة الموجودة (بدون updated_at لأن الجدول قد لا يحتويه)
            await query(
              `UPDATE media_units SET name = $1, is_active = $2 WHERE slug = $3`,
              [apiUnit.name, apiUnit.is_active !== false, slug]
            );
            localUnitId = existingUnit.rows[0].id;
          } else {
            // إنشاء وحدة جديدة
            const insertResult = await query(
              `INSERT INTO media_units (name, slug, is_active, created_at)
               VALUES ($1, $2, $3, NOW())
               RETURNING id`,
              [apiUnit.name, slug, apiUnit.is_active !== false]
            );
            localUnitId = insertResult.rows[0].id;
          }

          syncedUnits++;

          // 2. مزامنة المصادر المرتبطة بالوحدة
          const apiSources = apiUnit.sources || [];
          for (const apiSource of apiSources) {
            try {
              const sourceSlug = apiSource.source_slug || apiSource.slug || '';
              if (!sourceSlug) continue;

              // البحث عن أو إنشاء المصدر محلياً
              const localSource = await SourceService.findOrCreateBySlug(
                sourceSlug,
                apiSource.source_name || apiSource.name || sourceSlug,
                apiSource.source_url || apiSource.base_url || ''
              );

              syncedSources++;

              // ربط المصدر بالوحدة
              await MediaUnitSourceService.linkSource(
                localUnitId,
                localSource.id,
                apiSource.priority || 1
              );
              syncedLinks++;
            } catch (sourceError) {
              errors.push(`خطأ في مصدر "${apiSource.source_name || apiSource.slug}": ${sourceError}`);
            }
          }
        } catch (unitError) {
          errors.push(`خطأ في وحدة "${apiUnit.name}": ${unitError}`);
        }
      }

      res.json({
        success: true,
        message: `تمت المزامنة: ${syncedUnits} وحدة، ${syncedSources} مصدر، ${syncedLinks} ربط`,
        data: {
          synced_units: syncedUnits,
          synced_sources: syncedSources,
          synced_links: syncedLinks,
          total_api_units: mediaUnits.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل المزامنة الكاملة', error: (error as Error).message });
    }
  }

  /**
   * POST /api/newsdesk/sync/sources
   * مزامنة المصادر فقط من الـ API الخارجي إلى الداتابيس المحلي
   */
  static async syncSources(req: Request, res: Response): Promise<void> {
    try {
      const { SourceService } = await import('../../services/database/database.service');

      const apiSources = await newsDeskApiService.getSources(false);
      let synced = 0;
      const errors: string[] = [];

      for (const apiSource of apiSources) {
        try {
          const slug = apiSource.slug || apiSource.name?.toLowerCase().replace(/\s+/g, '-') || '';
          if (!slug) continue;

          await SourceService.findOrCreateBySlug(
            slug,
            apiSource.name || slug,
            apiSource.base_url || ''
          );
          synced++;
        } catch (err) {
          errors.push(`خطأ في مصدر "${apiSource.name}": ${err}`);
        }
      }

      res.json({
        success: true,
        message: `تمت مزامنة ${synced} مصدر`,
        data: {
          synced,
          total: apiSources.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      });
    } catch (error) {
      res.status(502).json({ success: false, message: 'فشل مزامنة المصادر', error: (error as Error).message });
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // Sync State & Logs (حالة المزامنة التدريجية)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * GET /api/newsdesk/sync/status
   * جلب حالة المزامنة لكل وحدة إعلامية + إحصائيات عامة
   */
  static async getSyncStatus(req: Request, res: Response): Promise<void> {
    try {
      const { syncStateService } = await import('../../services/news/sync-state.service');

      const [states, stats] = await Promise.all([
        syncStateService.getAllStates(),
        syncStateService.getSyncStats(),
      ]);

      res.json({
        success: true,
        data: {
          states,
          stats,
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'فشل جلب حالة المزامنة', error: (error as Error).message });
    }
  }

  /**
   * GET /api/newsdesk/sync/logs
   * جلب سجلات المزامنة الأخيرة
   * Query: ?limit=50&media_unit_id=1
   */
  static async getSyncLogs(req: Request, res: Response): Promise<void> {
    try {
      const { syncStateService } = await import('../../services/news/sync-state.service');

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;

      const logs = await syncStateService.getRecentLogs(limit, mediaUnitId);

      res.json({
        success: true,
        data: logs,
        count: logs.length,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'فشل جلب سجلات المزامنة', error: (error as Error).message });
    }
  }
}

export default NewsDeskProxyController;
