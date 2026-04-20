import { query } from '../../config/database';

/**
 * PublishedItemsService
 * إدارة المحتوى المنشور والعرض
 */

interface PublishedItem {
  id: number;
  media_unit_id: number;
  raw_data_id: number;
  queue_id: number | null;
  content_type_id: number;
  title: string;
  content: string;
  tags: string[];
  is_active: boolean;
  published_at: string;
}

interface PublishedItemWithDetails extends PublishedItem {
  image_url: string;
  original_url: string;
  category_name: string;
  media_unit_name: string;
  tag_names: string[];
  flow_type: 'automated' | 'editorial';
}

interface PublishedStats {
  total_published: number;
  automated_count: number;
  editorial_count: number;
  by_category: Array<{
    category: string;
    count: number;
  }>;
  by_media_unit: Array<{
    media_unit: string;
    count: number;
  }>;
}

export class PublishedItemsService {
  /**
   * جلب جميع المحتوى المنشور
   */
  async getAllPublished(limit: number = 50): Promise<PublishedItemWithDetails[]> {
    try {
      const result = await query(
        `SELECT 
          pi.id,
          pi.media_unit_id,
          pi.raw_data_id,
          pi.queue_id,
          pi.content_type_id,
          pi.title,
          pi.content,
          pi.tags,
          pi.is_active,
          pi.published_at,
          rd.image_url,
          rd.url as original_url,
          c.name as category_name,
          mu.name as media_unit_name,
          CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
          pi.tags as tag_names
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.is_active = true
        ORDER BY pi.published_at DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ خطأ في جلب المحتوى المنشور:', error);
      throw error;
    }
  }

  /**
   * جلب محتوى منشور واحد
   */
  async getPublishedItem(
    itemId: number
  ): Promise<PublishedItemWithDetails | null> {
    try {
      const result = await query(
        `SELECT 
          pi.id,
          pi.media_unit_id,
          pi.raw_data_id,
          pi.queue_id,
          pi.content_type_id,
          pi.title,
          pi.content,
          pi.tags,
          pi.is_active,
          pi.published_at,
          rd.image_url,
          rd.url as original_url,
          c.name as category_name,
          mu.name as media_unit_name,
          CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
          pi.tags as tag_names
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.id = $1 AND pi.is_active = true`,
        [itemId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ خطأ في جلب المحتوى ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * جلب المحتوى المنشور حسب الفئة
   */
  async getPublishedByCategory(
    categoryName: string,
    limit: number = 50
  ): Promise<PublishedItemWithDetails[]> {
    try {
      const result = await query(
        `SELECT 
          pi.id,
          pi.media_unit_id,
          pi.raw_data_id,
          pi.queue_id,
          pi.content_type_id,
          pi.title,
          pi.content,
          pi.tags,
          pi.is_active,
          pi.published_at,
          rd.image_url,
          rd.url as original_url,
          c.name as category_name,
          mu.name as media_unit_name,
          CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
          pi.tags as tag_names
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.is_active = true AND c.name = $1
        ORDER BY pi.published_at DESC
        LIMIT $2`,
        [categoryName, limit]
      );
      return result.rows;
    } catch (error) {
      console.error(`❌ خطأ في جلب المحتوى من فئة ${categoryName}:`, error);
      throw error;
    }
  }

  /**
   * جلب المحتوى المنشور حسب وحدة الإعلام
   */
  async getPublishedByMediaUnit(
    mediaUnitId: number,
    limit: number = 50
  ): Promise<PublishedItemWithDetails[]> {
    try {
      const result = await query(
        `SELECT 
          pi.id,
          pi.media_unit_id,
          pi.raw_data_id,
          pi.queue_id,
          pi.content_type_id,
          pi.title,
          pi.content,
          pi.tags,
          pi.is_active,
          pi.published_at,
          rd.image_url,
          rd.url as original_url,
          c.name as category_name,
          mu.name as media_unit_name,
          CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
          pi.tags as tag_names
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.is_active = true AND pi.media_unit_id = $1
        ORDER BY pi.published_at DESC
        LIMIT $2`,
        [mediaUnitId, limit]
      );
      return result.rows;
    } catch (error) {
      console.error(
        `❌ خطأ في جلب المحتوى من وحدة ${mediaUnitId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * جلب المحتوى المنشور حسب نوع الفلو
   */
  async getPublishedByFlow(
    flowType: 'automated' | 'editorial',
    limit: number = 50
  ): Promise<PublishedItemWithDetails[]> {
    try {
      const queueCondition =
        flowType === 'automated' ? 'IS NULL' : 'IS NOT NULL';

      const result = await query(
        `SELECT 
          pi.id,
          pi.media_unit_id,
          pi.raw_data_id,
          pi.queue_id,
          pi.content_type_id,
          pi.title,
          pi.content,
          pi.tags,
          pi.is_active,
          pi.published_at,
          rd.image_url,
          rd.url as original_url,
          c.name as category_name,
          mu.name as media_unit_name,
          CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
          pi.tags as tag_names
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.is_active = true AND pi.queue_id ${queueCondition}
        ORDER BY pi.published_at DESC
        LIMIT $1`,
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error(`❌ خطأ في جلب المحتوى من نوع ${flowType}:`, error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات المحتوى المنشور
   */
  async getPublishedStats(): Promise<PublishedStats> {
    try {
      // إجمالي المحتوى المنشور
      const totalResult = await query(
        `SELECT COUNT(*) as total FROM published_items WHERE is_active = true`
      );

      // عدد المحتوى الأوتوماتيكي والتحريري
      const flowResult = await query(
        `SELECT 
          COUNT(CASE WHEN queue_id IS NULL THEN 1 END) as automated_count,
          COUNT(CASE WHEN queue_id IS NOT NULL THEN 1 END) as editorial_count
        FROM published_items 
        WHERE is_active = true`
      );

      // المحتوى حسب الفئة
      const categoryResult = await query(
        `SELECT 
          c.name as category,
          COUNT(*) as count
        FROM published_items pi
        JOIN raw_data rd ON pi.raw_data_id = rd.id
        JOIN categories c ON rd.category_id = c.id
        WHERE pi.is_active = true
        GROUP BY c.name
        ORDER BY count DESC`
      );

      // المحتوى حسب وحدة الإعلام
      const mediaUnitResult = await query(
        `SELECT 
          mu.name as media_unit,
          COUNT(*) as count
        FROM published_items pi
        JOIN media_units mu ON pi.media_unit_id = mu.id
        WHERE pi.is_active = true
        GROUP BY mu.name
        ORDER BY count DESC`
      );

      return {
        total_published: totalResult.rows[0]?.total || 0,
        automated_count: flowResult.rows[0]?.automated_count || 0,
        editorial_count: flowResult.rows[0]?.editorial_count || 0,
        by_category: categoryResult.rows,
        by_media_unit: mediaUnitResult.rows,
      };
    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات المحتوى:', error);
      throw error;
    }
  }

  /**
   * إلغاء تفعيل محتوى منشور
   */
  async deactivateItem(itemId: number): Promise<boolean> {
    try {
      const result = await query(
        `UPDATE published_items 
         SET is_active = false 
         WHERE id = $1 
         RETURNING id`,
        [itemId]
      );

      if (result.rows.length > 0) {
        console.log(`✅ تم إلغاء تفعيل المحتوى ${itemId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`❌ خطأ في إلغاء تفعيل المحتوى ${itemId}:`, error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات النشر والرفض اليومية
   */
  async getDailyStats(mediaUnitId?: number, days: number = 30): Promise<any[]> {
    try {
      const params: any[] = [];
      let mediaUnitFilter = '';

      if (mediaUnitId) {
        mediaUnitFilter = ` AND pi.media_unit_id = $1`;
        params.push(mediaUnitId);
      }

      // جلب جميع الأيام من النشر والرفض معاً
      const result = await query(
        `WITH date_range AS (
          SELECT DISTINCT DATE(published_at) as date FROM published_items 
          WHERE DATE(published_at) >= CURRENT_DATE - INTERVAL '${days} days'${mediaUnitId ? ` AND media_unit_id = $1` : ''}
          UNION
          SELECT DISTINCT DATE(updated_at) as date FROM editorial_queue 
          WHERE status = 'rejected' AND DATE(updated_at) >= CURRENT_DATE - INTERVAL '${days} days'${mediaUnitId ? ` AND media_unit_id = $${params.length > 0 ? 1 : 1}` : ''}
        )
        SELECT 
          dr.date,
          COALESCE(mu.name, 'Unknown') as media_unit_name,
          COALESCE(mu.id, 0) as media_unit_id,
          COALESCE(COUNT(DISTINCT pi.id), 0) as published_count,
          COALESCE(COUNT(DISTINCT CASE WHEN pi.queue_id IS NOT NULL THEN pi.id END), 0) as editorial_count,
          COALESCE(COUNT(DISTINCT CASE WHEN pi.queue_id IS NULL THEN pi.id END), 0) as automated_count,
          COALESCE(COUNT(DISTINCT eq.id), 0) as rejected_count
        FROM date_range dr
        LEFT JOIN published_items pi ON DATE(pi.published_at) = dr.date${mediaUnitFilter}
        LEFT JOIN media_units mu ON pi.media_unit_id = mu.id
        LEFT JOIN editorial_queue eq ON DATE(eq.updated_at) = dr.date AND eq.status = 'rejected' AND eq.media_unit_id = ${mediaUnitId ? '$1' : 'eq.media_unit_id'}
        GROUP BY dr.date, mu.name, mu.id
        ORDER BY dr.date DESC`,
        params
      );

      return result.rows;
    } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات اليومية:', error);
      throw error;
    }
  }
}

export default new PublishedItemsService();
