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
