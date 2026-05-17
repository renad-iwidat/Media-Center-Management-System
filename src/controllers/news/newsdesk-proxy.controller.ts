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
}

export default NewsDeskProxyController;
