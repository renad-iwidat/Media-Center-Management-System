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
      const sources = await SourceService.getActive();
      
      // تنسيق البيانات لتتضمن معلومات واضحة عن آخر سحب
      const sourcesWithInfo = sources.map(source => ({
        id: source.id,
        name: source.name,
        url: source.url,
        is_active: source.is_active,
        source_type_id: source.source_type_id,
        default_category_id: source.default_category_id,
        created_at: source.created_at,
        last_fetched_at: source.last_fetched_at,
        last_fetched_formatted: source.last_fetched_at 
          ? new Date(source.last_fetched_at).toLocaleString('ar-SA')
          : 'لم يتم السحب بعد',
        is_recently_fetched: source.last_fetched_at 
          ? (Date.now() - new Date(source.last_fetched_at).getTime()) < 3600000 // آخر ساعة
          : false,
      }));

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
