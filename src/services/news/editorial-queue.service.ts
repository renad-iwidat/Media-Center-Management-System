import { query } from '../../config/database';
import { contentCleanerService } from './content-cleaner.service';

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
  user_id: number | null;
  task_id: number | null;
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
  async getPendingItems(mediaUnitId?: number, taskId?: number): Promise<QueueItemWithDetails[]> {
    try {
      let sql = `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.user_id,
          eq.task_id,
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
          COALESCE(s.name, NULLIF(rd.source_slug, ''), st.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        LEFT JOIN source_types st ON rd.source_type_id = st.id
        WHERE eq.status = 'pending'`;
      
      const params: any[] = [];
      if (mediaUnitId) {
        params.push(mediaUnitId);
        sql += ` AND eq.media_unit_id = $${params.length}`;
      }
      if (taskId !== undefined) {
        params.push(taskId);
        sql += ` AND eq.task_id = $${params.length}`;
      }
      sql += ` ORDER BY eq.created_at DESC`; // الأحدث أولاً

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
  async getIncompleteItems(mediaUnitId?: number, taskId?: number): Promise<QueueItemWithDetails[]> {
    return this.getItemsByStatus('incomplete', mediaUnitId, taskId);
  }

  /**
   * جلب عناصر الطابور حسب الحالة
   */
  async getItemsByStatus(status: QueueStatus, mediaUnitId?: number, taskId?: number): Promise<QueueItemWithDetails[]> {
    try {
      let sql = `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.user_id,
          eq.task_id,
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
          COALESCE(s.name, NULLIF(rd.source_slug, ''), st.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        LEFT JOIN source_types st ON rd.source_type_id = st.id
        WHERE eq.status = $1`;
      
      const params: any[] = [status];
      if (mediaUnitId) {
        params.push(mediaUnitId);
        sql += ` AND eq.media_unit_id = $${params.length}`;
      }
      if (taskId !== undefined) {
        params.push(taskId);
        sql += ` AND eq.task_id = $${params.length}`;
      }
      sql += ` ORDER BY eq.created_at DESC`; // الأحدث أولاً

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
          COALESCE(s.name, NULLIF(rd.source_slug, ''), st.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        LEFT JOIN source_types st ON rd.source_type_id = st.id
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
   * 
   * ⚠️ شروط صارمة: لا يُنشر أي خبر بدون صورة أو أقل من 300 حرف
   */
  async approveItem(
    queueId: number,
    policyId: number | null,
    editorNotes?: string,
    finalContent?: string,
    finalTitle?: string,
    finalImageUrl?: string,
    userId?: number,
    taskId?: number
  ): Promise<ApprovalResult> {
    try {
      // ═══════════════════════════════════════════════════════════════════
      // 🔒 فحص الشروط الصارمة قبل الموافقة (بدون استثناءات)
      // ═══════════════════════════════════════════════════════════════════
      
      // جلب بيانات الخبر
      const itemData = await query(
        `SELECT rd.id, rd.content, rd.image_url, rd.title, rd.source_type_id
         FROM editorial_queue eq
         JOIN raw_data rd ON eq.raw_data_id = rd.id
         WHERE eq.id = $1`,
        [queueId]
      );

      if (itemData.rows.length === 0) {
        return {
          success: false,
          message: 'الخبر غير موجود',
          queueId,
        };
      }

      const article = itemData.rows[0];
      
      // المحتوى النهائي (إما المعدّل أو الأصلي)
      const contentToCheck = finalContent || article.content || '';
      const imageToCheck = finalImageUrl !== undefined ? finalImageUrl : article.image_url;
      
      // 1️⃣ فحص طول المحتوى (300 حرف على الأقل)
      const MIN_CONTENT_LENGTH = 300;
      if (contentToCheck.length < MIN_CONTENT_LENGTH) {
        console.warn(`❌ رفض الموافقة على الخبر ${queueId}: المحتوى قصير (${contentToCheck.length} حرف، المطلوب ${MIN_CONTENT_LENGTH})`);
        return {
          success: false,
          message: `لا يمكن نشر الخبر: المحتوى قصير جداً (${contentToCheck.length} حرف). يجب أن يكون ${MIN_CONTENT_LENGTH} حرف على الأقل.`,
          queueId,
        };
      }
      
      // 2️⃣ فحص وجود الصورة (إلزامي)
      if (!imageToCheck || imageToCheck.trim() === '') {
        console.warn(`❌ رفض الموافقة على الخبر ${queueId}: بدون صورة`);
        return {
          success: false,
          message: 'لا يمكن نشر الخبر: الصورة مفقودة. يجب إضافة صورة للخبر.',
          queueId,
        };
      }

      console.log(`✅ الخبر ${queueId} يستوفي الشروط: ${contentToCheck.length} حرف + صورة موجودة`);
      
      // ═══════════════════════════════════════════════════════════════════
      // 🧹 تنظيف المحتوى (إلزامي قبل النشر)
      // ═══════════════════════════════════════════════════════════════════
      let cleanedContent = contentToCheck;
      try {
        const cleaned = await contentCleanerService.cleanContent(contentToCheck, article.id);
        if (cleaned && cleaned.trim().length >= 100) {
          cleanedContent = cleaned;
          // حفظ المحتوى المنظف + تعليم الخبر كمنظف
          await query(
            `UPDATE raw_data SET content = $1, is_cleaned = true WHERE id = $2`,
            [cleanedContent, article.id]
          );
          console.log(`🧹 تم تنظيف الخبر ${queueId} (${contentToCheck.length} → ${cleanedContent.length} حرف)`);
        } else {
          console.warn(`⚠️ التنظيف أرجع نص قصير للخبر ${queueId} — سيُنشر المحتوى الأصلي مع تعليمه كمنظف`);
          await query(`UPDATE raw_data SET is_cleaned = true WHERE id = $1`, [article.id]);
        }
      } catch (cleanErr) {
        console.warn(`⚠️ فشل تنظيف الخبر ${queueId} — سيُنشر المحتوى الأصلي: ${cleanErr instanceof Error ? cleanErr.message : 'unknown'}`);
        await query(`UPDATE raw_data SET is_cleaned = true WHERE id = $1`, [article.id]);
      }

      // استخدام المحتوى المنظف كـ finalContent إذا لم يمرر المحرر محتوى مخصص
      if (!finalContent) {
        finalContent = cleanedContent;
      }

      // ═══════════════════════════════════════════════════════════════════
      // المتابعة بالموافقة
      // ═══════════════════════════════════════════════════════════════════
      
      // 1. تحديث الحالة إلى 'in_review' مع اختيار السياسة (اختياري)
      await query(
        `UPDATE editorial_queue 
         SET status = 'in_review', 
             policy_id = $1, 
             editor_notes = $2,
             user_id = $3,
             task_id = $4,
             updated_at = NOW()
         WHERE id = $5`,
        [policyId || null, editorNotes || null, userId || null, taskId || null, queueId]
      );

      console.log(`📋 تم تحديث الخبر ${queueId} إلى 'in_review' بواسطة المستخدم ${userId}`);

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
      await this.publishApprovedItem(queueId, finalContent, finalTitle, finalImageUrl, userId, taskId);

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
    editorNotes?: string,
    userId?: number,
    taskId?: number
  ): Promise<RejectionResult> {
    try {
      await query(
        `UPDATE editorial_queue 
         SET status = 'rejected', 
             editor_notes = $1,
             user_id = $2,
             task_id = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [editorNotes || null, userId || null, taskId || null, queueId]
      );

      console.log(`❌ تم رفض الخبر ${queueId} بواسطة المستخدم ${userId}`);

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
   * 
   * التحقق من التكرار: لا ننشر نفس raw_data_id مع نفس media_unit_id مرتين
   */
  private async publishApprovedItem(
    queueId: number,
    finalContent?: string,
    finalTitle?: string,
    finalImageUrl?: string,
    userId?: number,
    taskId?: number
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

      // ─── التحقق من التكرار ───────────────────────────────────
      // تحقق من وجود نفس raw_data_id مع نفس media_unit_id في published_items
      const existsResult = await query(
        `SELECT id FROM published_items 
         WHERE raw_data_id = $1 AND media_unit_id = $2`,
        [item.raw_data_id, item.media_unit_id]
      );

      if (existsResult.rows.length > 0) {
        console.log(`⚠️ الخبر ${item.raw_data_id} موجود مسبقاً في published_items للوحدة ${item.media_unit_id} — تم تجاهل النشر المكرر`);
        return;
      }

      const contentTypeId = 1; // أخبار

      const titleToPublish = finalTitle || item.title;
      const contentToPublish = finalContent || item.content;
      const imageToPublish = finalImageUrl !== undefined ? finalImageUrl : item.image_url;

      // إدراج في published_items مع queue_id (دايماً موجود) ومعلومات المستخدم والمهمة
      // ملاحظة: نحاول إدراج image_url مباشرة. إذا العمود غير موجود (DB قديمة)
      // نُعيد المحاولة بدونه ثم نُحدّثه عبر UPDATE في خطوة منفصلة.
      try {
        await query(
          `INSERT INTO published_items 
           (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, image_url, tags, is_active, published_at, approved_by, task_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), $9, $10)`,
          [
            item.media_unit_id,
            item.raw_data_id,
            queueId,
            contentTypeId,
            titleToPublish,
            contentToPublish,
            imageToPublish || null,
            item.tags,
            userId || null,
            taskId || null,
          ]
        );
      } catch (insertErr: any) {
        // العمود image_url غير موجود — أدرج بدونه ثم حدّثه
        await query(
          `INSERT INTO published_items 
           (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at, approved_by, task_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW(), $8, $9)`,
          [
            item.media_unit_id,
            item.raw_data_id,
            queueId,
            contentTypeId,
            titleToPublish,
            contentToPublish,
            item.tags,
            userId || null,
            taskId || null,
          ]
        );

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
      }

      // تحديث ستيتوس الخبر في raw_data إلى 'published'
      await query(
        `UPDATE raw_data SET fetch_status = 'published' WHERE id = $1`,
        [item.raw_data_id]
      );

      // تحديث publish_status إلى 'ready_for_publish' — جاهز للنشر الخارجي/سوشال
      await query(
        `UPDATE raw_data SET publish_status = 'ready_for_publish' 
         WHERE id = $1 AND COALESCE(publish_status, 'draft') IN ('draft', 'ready_for_publish')`,
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

  /**
   * جلب جميع الأخبار في ستوديو التحرير (pending + in_review + incomplete)
   * يدعم task_id اختياري للربط مع نظام الإدارة
   */
  async getAllEditorialItems(mediaUnitId?: number, taskId?: number): Promise<QueueItemWithDetails[]> {
    try {
      let sql = `SELECT 
          eq.id,
          eq.media_unit_id,
          eq.raw_data_id,
          eq.policy_id,
          eq.status,
          eq.editor_notes,
          eq.user_id,
          eq.task_id,
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
          COALESCE(s.name, NULLIF(rd.source_slug, ''), st.name, SPLIT_PART(SPLIT_PART(rd.url, '://', 2), '/', 1), '—') as source_name
        FROM editorial_queue eq
        JOIN raw_data rd ON eq.raw_data_id = rd.id
        LEFT JOIN categories c ON rd.category_id = c.id
        JOIN media_units mu ON eq.media_unit_id = mu.id
        LEFT JOIN sources s ON rd.source_id = s.id
        LEFT JOIN source_types st ON rd.source_type_id = st.id
        WHERE eq.status IN ('pending', 'in_review')
          AND COALESCE(c.flow, 'editorial') = 'editorial'`;
      
      const params: any[] = [];
      if (mediaUnitId) {
        params.push(mediaUnitId);
        sql += ` AND eq.media_unit_id = $${params.length}`;
      }
      if (taskId !== undefined) {
        params.push(taskId);
        sql += ` AND eq.task_id = $${params.length}`;
      }
      sql += ` ORDER BY eq.created_at DESC`;

      const result = await query(sql, params);
      console.log('📊 البيانات المرجعة من getAllEditorialItems:', result.rows.length, 'عنصر');
      return result.rows;
    } catch (error) {
      console.error('❌ خطأ في جلب جميع عناصر ستوديو التحرير:', error);
      throw error;
    }
  }
}

export default new EditorialQueueService();
