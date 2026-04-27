/**
 * Sources Controller
 * التحكم بطلبات المصادر
 */

import { Request, Response } from 'express';
import { SourceService } from '../../services/database/database.service';

export class SourcesController {
  /**
   * الحصول على جميع المصادر
   */
  static async getAllSources(req: Request, res: Response) {
    try {
      const sources = await SourceService.getAll();
      res.json({
        success: true,
        data: sources,
        count: sources.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على مصدر بالـ ID
   */
  static async getSourceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const source = await SourceService.getById(parseInt(id));

      if (!source) {
        return res.status(404).json({
          success: false,
          error: 'Source not found',
        });
      }

      res.json({
        success: true,
        data: source,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على المصادر النشطة
   */
  static async getActiveSources(req: Request, res: Response) {
    try {
      const sources = await SourceService.getActive();
      res.json({
        success: true,
        data: sources,
        count: sources.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على معلومات المصادر مع آخر وقت سحب
   */
  static async getSourcesWithFetchInfo(req: Request, res: Response) {
    try {
      const sources = await SourceService.getAll();
      
      // تنسيق البيانات لتتضمن معلومات واضحة عن آخر سحب
      const sourcesWithInfo = sources.map(source => {
        let lastFetchedFormatted = 'لم يتم السحب بعد';
        let isRecentlyFetched = false;
        
        if (source.last_fetched_at) {
          const lastFetchedDate = new Date(source.last_fetched_at);
          const now = new Date();
          const diffMs = now.getTime() - lastFetchedDate.getTime();
          const diffMinutes = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMs / 3600000);
          const diffDays = Math.floor(diffMs / 86400000);
          
          // تنسيق نسبي للوقت
          if (diffMinutes < 1) {
            lastFetchedFormatted = 'الآن';
            isRecentlyFetched = true;
          } else if (diffMinutes < 60) {
            lastFetchedFormatted = `منذ ${diffMinutes} دقيقة`;
            isRecentlyFetched = true;
          } else if (diffHours < 24) {
            lastFetchedFormatted = `منذ ${diffHours} ساعة`;
            isRecentlyFetched = diffHours < 2;
          } else if (diffDays < 7) {
            lastFetchedFormatted = `منذ ${diffDays} يوم`;
          } else {
            // تنسيق التاريخ الكامل
            lastFetchedFormatted = lastFetchedDate.toLocaleString('ar-SA', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          }
        }
        
        return {
          id: source.id,
          name: source.name,
          url: source.url,
          type: source.source_type_name || 'RSS',
          is_active: source.is_active,
          source_type_id: source.source_type_id,
          default_category_id: source.default_category_id,
          created_at: source.created_at,
          last_fetched_at: source.last_fetched_at,
          last_fetched_formatted: lastFetchedFormatted,
          is_recently_fetched: isRecentlyFetched,
        };
      });

      res.json({
        success: true,
        data: sourcesWithInfo,
        count: sourcesWithInfo.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * إنشاء مصدر جديد
   */
  static async createSource(req: Request, res: Response) {
    try {
      const { source_type_id, url, name, is_active } = req.body;

      if (!source_type_id || !url || !name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const source = await SourceService.create(
        source_type_id,
        url,
        name,
        is_active ?? true
      );

      res.status(201).json({
        success: true,
        data: source,
        message: 'Source created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * تحديث مصدر
   */
  static async updateSource(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = req.body;

      const source = await SourceService.update(parseInt(id), data);

      if (!source) {
        return res.status(404).json({
          success: false,
          error: 'Source not found',
        });
      }

      res.json({
        success: true,
        data: source,
        message: 'Source updated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
