import pool from '../../config/database';
import { ManualInputData, ManualInputResponse, CategoryData, SourceData, ManualInputSources } from '../../models/manual-input/ManualInput';

/**
 * Manual Input Service
 * خدمة إدارة الإدخال اليدوي للأخبار
 */

export class ManualInputService {
  /**
   * جلب التصنيفات النشطة
   */
  static async getActiveCategories(): Promise<CategoryData[]> {
    const query = `
      SELECT id, name, slug, flow, is_active
      FROM categories
      WHERE is_active = true
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * جلب مصادر الإدخال اليدوي (نص، صوت، فيديو)
   */
  static async getManualInputSources(): Promise<ManualInputSources | null> {
    const query = `
      SELECT s.id, s.name, s.source_type_id, s.is_active, st.name as source_type_name
      FROM sources s
      JOIN source_types st ON s.source_type_id = st.id
      WHERE st.name IN ('user_input_text', 'user_input_audio', 'user_input_video')
      AND s.is_active = true
      ORDER BY s.id
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }

    const sources: ManualInputSources = {
      text: result.rows.find((r: any) => r.source_type_name === 'user_input_text'),
      audio: result.rows.find((r: any) => r.source_type_name === 'user_input_audio'),
      video: result.rows.find((r: any) => r.source_type_name === 'user_input_video')
    };

    return sources;
  }

  /**
   * جلب مصدر النص فقط
   */
  static async getTextInputSource(): Promise<SourceData | null> {
    const query = `
      SELECT s.id, s.name, s.source_type_id, s.is_active
      FROM sources s
      JOIN source_types st ON s.source_type_id = st.id
      WHERE st.name = 'user_input_text' AND s.is_active = true
      LIMIT 1
    `;
    
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  /**
   * التحقق من صحة البيانات
   */
  static validateInput(data: ManualInputData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // التحقق من العنوان
    if (!data.title || data.title.trim().length < 20) {
      errors.push('العنوان مطلوب ولا يقل عن 20 حرف');
    }

    // التحقق من المحتوى
    if (!data.content || data.content.trim().length < 100) {
      errors.push('المحتوى مطلوب ولا يقل عن 100 حرف');
    }

    // التحقق من التصنيف
    if (!data.category_id) {
      errors.push('التصنيف مطلوب');
    }

    // التحقق من المستخدم
    if (!data.created_by) {
      errors.push('معرف المستخدم مطلوب');
    }

    // التحقق من fetch_status
    if (data.fetch_status !== 'fetched') {
      errors.push('fetch_status يجب أن يكون "fetched"');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * إضافة خبر يدوي جديد
   */
  static async createManualInput(data: ManualInputData): Promise<ManualInputResponse> {
    const query = `
      INSERT INTO raw_data (
        source_id,
        source_type_id,
        category_id,
        url,
        title,
        content,
        image_url,
        tags,
        fetch_status,
        created_by,
        media_unit_id,
        uploaded_file_id,
        fetched_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      RETURNING id, source_id, source_type_id, category_id, title, fetch_status, fetched_at
    `;

    const values = [
      data.source_id,
      data.source_type_id,
      data.category_id,
      null, // url is always null for manual input
      data.title.trim(),
      data.content.trim(),
      data.image_url || null,
      data.tags || [],
      data.fetch_status,
      data.created_by,
      data.media_unit_id,
      data.uploaded_file_id || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * تشغيل الفلو للخبر الجديد
   */
  static async triggerFlow(): Promise<any> {
    // هذه الدالة ستستدعي FlowRouterService
    // حالياً نرجع success، لاحقاً نربطها مع الـ flow service الموجود
    return {
      success: true,
      message: 'Flow triggered successfully'
    };
  }

  /**
   * حفظ معلومات الملف المرفوع في قاعدة البيانات
   */
  static async saveUploadedFile(data: {
    source_id: number;
    source_type_id: number;
    file_type: 'audio' | 'video' | 'image';
    original_filename: string;
    file_size: number;
    mime_type: string;
    s3_bucket: string;
    s3_key: string;
    s3_url: string;
    uploaded_by: number;
    media_unit_id: number;
  }): Promise<any> {
    const query = `
      INSERT INTO uploaded_files (
        source_id,
        source_type_id,
        file_type,
        original_filename,
        file_size,
        mime_type,
        s3_bucket,
        s3_key,
        s3_url,
        uploaded_by,
        media_unit_id,
        processing_status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'pending')
      RETURNING *
    `;

    const values = [
      data.source_id,
      data.source_type_id,
      data.file_type,
      data.original_filename,
      data.file_size,
      data.mime_type,
      data.s3_bucket,
      data.s3_key,
      data.s3_url,
      data.uploaded_by,
      data.media_unit_id
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * جلب الملفات المعلقة (pending) للمعالجة
   */
  static async getPendingFiles(): Promise<any[]> {
    const query = `
      SELECT * FROM uploaded_files
      WHERE processing_status = 'pending'
      ORDER BY uploaded_at ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * تحديث حالة معالجة الملف
   */
  static async updateFileProcessingStatus(
    fileId: number,
    status: 'processing' | 'completed' | 'failed'
  ): Promise<void> {
    const query = `
      UPDATE uploaded_files
      SET 
        processing_status = $1,
        processed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE processed_at END
      WHERE id = $2
    `;
    
    await pool.query(query, [status, fileId]);
  }

  /**
   * جلب قائمة الوحدات الإعلامية
   */
  static async getMediaUnits(): Promise<any[]> {
    const query = `
      SELECT id, name, slug, is_active
      FROM media_units
      WHERE is_active = true
      ORDER BY name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * جلب قائمة كل المستخدمين (للاختيار)
   */
  static async getAllUsers(): Promise<any[]> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email
      FROM users u
      ORDER BY u.name
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}
