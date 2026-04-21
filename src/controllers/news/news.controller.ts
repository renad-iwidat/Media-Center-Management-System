/**
 * News Controller
 * التحكم بطلبات الأخبار
 */

import { Request, Response } from 'express';
import { RawDataService } from '../../services/database/database.service';

export class NewsController {
  /**
   * الحصول على جميع الأخبار الخام
   */
  static async getAllNews(req: Request, res: Response) {
    try {
      const news = await RawDataService.getAll();
      res.json({
        success: true,
        data: news,
        count: news.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على خبر بالـ ID
   */
  static async getNewsById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const news = await RawDataService.getById(parseInt(id));

      if (!news) {
        return res.status(404).json({
          success: false,
          error: 'News not found',
        });
      }

      res.json({
        success: true,
        data: news,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * الحصول على أخبار من مصدر معين
   */
  static async getNewsBySource(req: Request, res: Response) {
    try {
      const { sourceId } = req.params;
      const news = await RawDataService.getBySourceId(parseInt(sourceId));

      res.json({
        success: true,
        data: news,
        count: news.length,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * إضافة خبر جديد
   */
  static async createNews(req: Request, res: Response) {
    try {
      const {
        source_id,
        source_type_id,
        category_id,
        url,
        title,
        content,
        image_url,
        tags,
        fetch_status,
      } = req.body;

      if (!source_id || !title || !content) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      const news = await RawDataService.create({
        source_id,
        source_type_id,
        category_id,
        url,
        title,
        content,
        image_url,
        tags: tags || [],
        fetch_status: fetch_status || 'pending',
        pub_date: null,
      });

      res.status(201).json({
        success: true,
        data: news,
        message: 'News created successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
