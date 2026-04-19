import { Request, Response } from 'express';
import FlowRouterService from '../../services/news/flow-router.service';
import EditorialQueueService from '../../services/news/editorial-queue.service';
import PublishedItemsService from '../../services/news/published-items.service';

/**
 * FlowController
 * التحكم في فلو معالجة الأخبار
 */

export class FlowController {
  /**
   * POST /api/flow/process
   * تشغيل فلو معالجة الأخبار الجديدة
   */
  static async processNewArticles(req: Request, res: Response): Promise<void> {
    try {
      console.log('🚀 بدء معالجة الأخبار الجديدة...');
      const result = await FlowRouterService.processNewArticles();

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: {
          processedCount: result.processedCount,
          automatedCount: result.automatedCount,
          editorialCount: result.editorialCount,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error('❌ خطأ في معالجة الأخبار:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في معالجة الأخبار',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/queue/pending
   * جلب العناصر المعلقة في الطابور
   */
  static async getPendingQueue(req: Request, res: Response): Promise<void> {
    try {
      const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;
      const pendingItems = await EditorialQueueService.getPendingItems(mediaUnitId);

      res.status(200).json({
        success: true,
        data: pendingItems,
        count: pendingItems.length,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الطابور:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الطابور',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/queue/stats
   * جلب إحصائيات الطابور
   */
  static async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await EditorialQueueService.getQueueStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات الطابور:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب إحصائيات الطابور',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/queue/:id
   * جلب عنصر واحد من الطابور
   */
  static async getQueueItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await EditorialQueueService.getQueueItem(parseInt(id));

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'العنصر غير موجود',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب العنصر:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب العنصر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/flow/queue/:id/approve
   * موافقة المحرر على خبر
   */
  static async approveQueueItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { policyId, editorNotes, finalContent, finalTitle, finalImageUrl } = req.body;

      const result = await EditorialQueueService.approveItem(
        parseInt(id),
        policyId || null,
        editorNotes,
        finalContent,
        finalTitle,
        finalImageUrl
      );

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: { queueId: result.queueId },
      });
    } catch (error) {
      console.error('❌ خطأ في الموافقة:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في الموافقة على الخبر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/flow/queue/:id/reject
   * رفض المحرر لخبر
   */
  static async rejectQueueItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { editorNotes } = req.body;

      const result = await EditorialQueueService.rejectItem(
        parseInt(id),
        editorNotes
      );

      res.status(200).json({
        success: result.success,
        message: result.message,
        data: { queueId: result.queueId },
      });
    } catch (error) {
      console.error('❌ خطأ في الرفض:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في رفض الخبر',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/published
   * جلب المحتوى المنشور
   */
  static async getPublished(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;
      
      let published;
      if (mediaUnitId) {
        published = await PublishedItemsService.getPublishedByMediaUnit(mediaUnitId, limit);
      } else {
        published = await PublishedItemsService.getAllPublished(limit);
      }

      res.status(200).json({
        success: true,
        data: published,
        count: published.length,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المحتوى المنشور:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المحتوى المنشور',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/published/:id
   * جلب محتوى منشور واحد
   */
  static async getPublishedItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await PublishedItemsService.getPublishedItem(parseInt(id));

      if (!item) {
        res.status(404).json({
          success: false,
          message: 'المحتوى غير موجود',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المحتوى:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المحتوى',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/published/category/:category
   * جلب المحتوى المنشور حسب الفئة
   */
  static async getPublishedByCategory(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const published = await PublishedItemsService.getPublishedByCategory(
        category,
        limit
      );

      res.status(200).json({
        success: true,
        data: published,
        count: published.length,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المحتوى:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب المحتوى',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/published/stats
   * جلب إحصائيات المحتوى المنشور
   */
  static async getPublishedStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await PublishedItemsService.getPublishedStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/flow/daily-stats
   * جلب إحصائيات النشر والرفض اليومية لكل وحدة إعلامية
   */
  static async getDailyStats(req: Request, res: Response): Promise<void> {
    try {
      const mediaUnitId = req.query.media_unit_id ? parseInt(req.query.media_unit_id as string) : undefined;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const stats = await PublishedItemsService.getDailyStats(mediaUnitId, days);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات اليومية:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في جلب الإحصائيات اليومية',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default FlowController;
