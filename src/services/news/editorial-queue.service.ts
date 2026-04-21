import { query } from '../../config/database';

/**
 * EditorialQueueService
 * إدارة طابور التحرير والموافقات
 *
 * الحالات في editorial_queue:
 * - pending: وصل للطابور، بانتظار قرار (أوتوماتيك أو محرر)
 * - incomplete: الخبر ناقص، محتاج تدخل المحرر
 * - in_review: المحرر شغّال عليه
 * - approved: موافق، جاهز للنشر
 * - rejected: مرفوض، ما رح ينشر
 */

type QueueStatus = 'pending' | 'incomplete' | 'in_review' | 'approved' | 'rejected';

interface QueueItem {
  id: number;
  media_unit_id: number;
  raw_data_id: number;
  policy_id: number | null;
  status: QueueStatus;
  editor_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface QueueItemWithDetails extends QueueItem {
  title: string;
  content: string;
  image_url: string;
  url: string;
  pub_date: string;
  category_name: string;
  category_flow: string;
  media_unit_name: string;
  source_name?: string;
}

interface ApprovalResult {
  success: boolean;
  message: string;
  queueId: number;
}

interface RejectionResult {
  success: boolean;
  message: string;
  queueId: number;
}

export class EditorialQueueService {

  /**
   * التحقق من وجود خبر في الطابور لوحدة إعلام معينة
   */
  async existsInQueue(rawDataId: number, mediaUnitId: number): Promise<boolean> {
    const result = await query(
      `SELECT id FROM editorial_queue WHERE raw_data_id = $1 AND media_unit_id = $2`,
      [rawDataId, mediaUnitId]
    );
    return result.rows.length > 0;
  }

  /**
   * جلب جميع العناصر المعلقة في الطابور (pending فقط)
   */
  async getPendingItems(mediaUnitId?: number): Promise<QueueItemWithDetails[]> {
    try {
      let sql = `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.created_at,
          eq.updated_at,
          rd.title,
          rd.content,
          rd.image_url,
          rd.url,
          rd.pub_date,
          c.name as category_name,
          c.flow as category_flow,
          mu.name as media_unit_name,
          COALESCE(s.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        WHERE eq.status = 'pending'`;
      
      const params: any[] = [];
      if (mediaUnitId) {
        params.push(mediaUnitId);
        sql += ` AND eq.media_unit_id = $${params.length}`;
      }
      sql += ` ORDER BY eq.created_at ASC`;

      const result = await query(sql, params);
      console.log('📊 البيانات المرجعة من getPendingItems:', result.rows.length, 'عنصر');
      return result.rows;
    } catch (error) {
      console.error('❌ خطأ في جلب العناصر المعلقة:', error);
      throw error;
    }
  }

  /**
   * جلب العناصر الناقصة (incomplete) من الطابور
   */
  async getIncompleteItems(mediaUnitId?: number): Promise<QueueItemWithDetails[]> {
    return this.getItemsByStatus('incomplete', mediaUnitId);
  }

  /**
   * جلب عناصر الطابور حسب الحالة
   */
  async getItemsByStatus(status: QueueStatus, mediaUnitId?: number): Promise<QueueItemWithDetails[]> {
    try {
      let sql = `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.created_at,
          eq.updated_at,
          rd.title,
          rd.content,
          rd.image_url,
          rd.url,
          rd.pub_date,
          c.name as category_name,
          c.flow as category_flow,
          mu.name as media_unit_name,
          COALESCE(s.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        WHERE eq.status = $1`;
      
      const params: any[] = [status];
      if (mediaUnitId) {
        params.push(mediaUnitId);
        sql += ` AND eq.media_unit_id = $${params.length}`;
      }
      sql += ` ORDER BY eq.created_at ASC`;

      const result = await query(sql, params);
      return result.rows;
    } catch (error) {
      console.error(`❌ خطأ في جلب العناصر بحالة ${status}:`, error);
      throw error;
    }
  }

  /**
   * جلب عنصر واحد من الطابور
   */
  async getQueueItem(queueId: number): Promise<QueueItemWithDetails | null> {
    try {
      const result = await query(
        `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.created_at,
          eq.updated_at,
          rd.title,
          rd.content,
          rd.image_url,
          rd.url,
          rd.pub_date,
          c.name as category_name,
          c.flow as category_flow,
          mu.name as media_unit_name,
          s.name as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        WHERE eq.id = $1`,
        [queueId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(`❌ خطأ في جلب عنصر الطابور ${queueId}:`, error);
      throw error;
    }
  }

  /**
   * موافقة المحرر على الخبر
   * pending → in_review → approved → published_items
   */
  async approveItem(
    queueId: number,
    policyId: number | null,
    editorNotes?: string,
    finalContent?: string,
    finalTitle?: string,
    finalImageUrl?: string
  ): Promise<ApprovalResult> {
    try {
      // 1. تحديث الحالة إلى 'in_review' مع اختيار السياسة (اختياري)
      await query(
        `UPDATE editorial_queue 
         SET status = 'in_review', 
             policy_id = $1, 
             editor_notes = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [policyId || null, editorNotes || null, queueId]
      );

      console.log(`📋 تم تحديث الخبر ${queueId} إلى 'in_review'`);

      // 2. تحديث الحالة إلى 'approved'
      await query(
        `UPDATE editorial_queue 
         SET status = 'approved', 
             updated_at = NOW()
         WHERE id = $1`,
        [queueId]
      );

      console.log(`✅ تم الموافقة على الخبر ${queueId}`);

      // 3. نشر الخبر في published_items
      await this.publishApprovedItem(queueId, finalContent, finalTitle, finalImageUrl);

      return {
        success: true,
        message: 'تمت الموافقة على الخبر ونشره بنجاح',
        queueId,
      };
    } catch (error) {
      console.error(`❌ خطأ في موافقة المحرر على ${queueId}:`, error);
      return {
        success: false,
        message: `خطأ في الموافقة: ${error}`,
        queueId,
      };
    }
  }

  /**
   * رفض المحرر للخبر
   * pending / in_review → rejected
   * الخبر المرفوض لا يروح published_items
   */
  async rejectItem(
    queueId: number,
    editorNotes?: string
  ): Promise<RejectionResult> {
    try {
      await query(
        `UPDATE editorial_queue 
         SET status = 'rejected', 
             editor_notes = $1,
             updated_at = NOW()
         WHERE id = $2`,
        [editorNotes || null, queueId]
      );

      console.log(`❌ تم رفض الخبر ${queueId}`);

      return {
        success: true,
        message: 'تم رفض الخبر بنجاح',
        queueId,
      };
    } catch (error) {
      console.error(`❌ خطأ في رفض الخبر ${queueId}:`, error);
      return {
        success: false,
        message: `خطأ في الرفض: ${error}`,
        queueId,
      };
    }
  }

  /**
   * نشر الخبر المعتمد في published_items
   * queue_id دايماً موجود — كل خبر منشور مربوط بسجل editorial_queue
   */
  private async publishApprovedItem(
    queueId: number,
    finalContent?: string,
    finalTitle?: string,
    finalImageUrl?: string
  ): Promise<void> {
    try {
      // جلب بيانات الخبر من editorial_queue
      const queueItem = await query(
        `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          rd.title,
          rd.content,
          rd.image_url,
          rd.tags
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        WHERE eq.id = $1`,
        [queueId]
      );

      if (queueItem.rows.length === 0) {
        throw new Error(`عنصر الطابور ${queueId} غير موجود`);
      }

      const item = queueItem.rows[0];
      const contentTypeId = 1; // أخبار

      const titleToPublish = finalTitle || item.title;
      const contentToPublish = finalContent || item.content;
      const imageToPublish = finalImageUrl !== undefined ? finalImageUrl : item.image_url;

      // إدراج في published_items مع queue_id (دايماً موجود)
      await query(
        `INSERT INTO published_items 
         (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())`,
        [
          item.media_unit_id,
          item.raw_data_id,
          queueId,
          contentTypeId,
          titleToPublish,
          contentToPublish,
          item.tags,
        ]
      );

      // محاولة حفظ image_url
      if (imageToPublish) {
        try {
          await query(
            `UPDATE published_items SET image_url = $1 WHERE queue_id = $2`,
            [imageToPublish, queueId]
          );
        } catch {
          // العمود غير موجود — يمكن تجاهله
        }
      }

      // تحديث ستيتوس الخبر في raw_data إلى 'published'
      await query(
        `UPDATE raw_data SET fetch_status = 'published' WHERE id = $1`,
        [item.raw_data_id]
      );

      console.log(`📤 تم نشر الخبر ${item.raw_data_id} من الطابور (queue_id=${queueId})`);
    } catch (error) {
      console.error(`❌ خطأ في نشر الخبر المعتمد:`, error);
      throw error;
    }
  }

  /**
   * جلب إحصائيات الطابور — تشمل حالة incomplete
   */
  async getQueueStats() {
    try {
      const result = await query(
        `SELECT 
          mu.id,
          mu.name,
          COUNT(CASE WHEN eq.status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN eq.status = 'incomplete' THEN 1 END) as incomplete_count,
          COUNT(CASE WHEN eq.status = 'in_review' THEN 1 END) as in_review_count,
          COUNT(CASE WHEN eq.status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN eq.status = 'rejected' THEN 1 END) as rejected_count
        FROM media_units mu
        LEFT JOIN editorial_queue eq ON mu.id = eq.media_unit_id
        WHERE mu.is_active = true
        GROUP BY mu.id, mu.name
        ORDER BY pending_count DESC`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ خطأ في جلب إحصائيات الطابور:', error);
      throw error;
    }
  }
}

export default new EditorialQueueService();
