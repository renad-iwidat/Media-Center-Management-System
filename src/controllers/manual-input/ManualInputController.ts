import { Request, Response } from 'express';
import { ManualInputService } from '../../services/manual-input/ManualInputService';
import { ManualInputData } from '../../models/manual-input/ManualInput';

/**
 * Manual Input Controller
 * معالج طلبات الإدخال اليدوي
 */

export class ManualInputController {
  /**
   * GET /api/manual-input/categories
   * جلب التصنيفات النشطة
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await ManualInputService.getActiveCategories();
      
      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      console.error('❌ خطأ في جلب التصنيفات:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب التصنيفات',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/manual-input/sources
   * جلب معلومات مصادر الإدخال اليدوي (نص، صوت، فيديو)
   */
  static async getSources(req: Request, res: Response): Promise<void> {
    try {
      const sources = await ManualInputService.getManualInputSources();
      
      if (!sources) {
        res.status(404).json({
          success: false,
          message: 'مصادر الإدخال اليدوي غير موجودة'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: sources
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المصادر:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب معلومات المصادر',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/manual-input/source/text
   * جلب معلومات مصدر النص فقط
   */
  static async getTextSource(req: Request, res: Response): Promise<void> {
    try {
      const source = await ManualInputService.getTextInputSource();
      
      if (!source) {
        res.status(404).json({
          success: false,
          message: 'مصدر الإدخال النصي غير موجود'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: source
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المصدر:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب معلومات المصدر',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/manual-input/submit
   * إرسال خبر يدوي جديد
   */
  static async submitNews(req: Request, res: Response): Promise<void> {
    try {
      const inputData: ManualInputData = req.body;

      // التحقق من صحة البيانات
      const validation = ManualInputService.validateInput(inputData);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: 'بيانات غير صالحة',
          errors: validation.errors
        });
        return;
      }

      // إضافة الخبر
      const result = await ManualInputService.createManualInput(inputData);

      // تشغيل الفلو
      await ManualInputService.triggerFlow();

      res.status(201).json({
        success: true,
        data: result,
        message: 'تم إضافة الخبر بنجاح'
      });
    } catch (error) {
      console.error('❌ خطأ في إضافة الخبر:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في إضافة الخبر',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/manual-input/upload-audio
   * رفع ملف صوتي
   * 
   * Body: multipart/form-data
   * - file: الملف الصوتي
   * - uploaded_by: معرف المستخدم
   * - media_unit_id: معرف الوحدة الإعلامية
   */
  static async uploadAudio(req: Request, res: Response): Promise<void> {
    try {
      // التحقق من وجود الملف
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'الملف الصوتي مطلوب'
        });
        return;
      }

      // التحقق من معرف المستخدم
      const uploadedBy = parseInt(req.body.uploaded_by);
      if (!uploadedBy) {
        res.status(400).json({
          success: false,
          message: 'معرف المستخدم مطلوب'
        });
        return;
      }

      // التحقق من معرف الوحدة الإعلامية
      const mediaUnitId = parseInt(req.body.media_unit_id);
      if (!mediaUnitId) {
        res.status(400).json({
          success: false,
          message: 'معرف الوحدة الإعلامية مطلوب'
        });
        return;
      }

      // الحصول على العنوان (اختياري)
      const title = req.body.title?.trim() || undefined;

      // استيراد الخدمات
      const { S3UploadService } = await import('../../services/manual-input/S3UploadService');

      // التحقق من نوع الملف
      if (!S3UploadService.validateFileType(req.file, 'audio')) {
        res.status(400).json({
          success: false,
          message: 'نوع الملف غير مدعوم. الأنواع المسموحة: MP3, M4A, WAV, WebM, OGG'
        });
        return;
      }

      // التحقق من حجم الملف
      if (!S3UploadService.validateFileSize(req.file, 'audio')) {
        res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى: 50 MB'
        });
        return;
      }

      // رفع الملف على S3 مع العنوان
      const uploadResult = await S3UploadService.uploadFile(req.file, 'audio', title);

      // جلب معلومات المصدر
      const sources = await ManualInputService.getManualInputSources();
      if (!sources || !sources.audio) {
        res.status(500).json({
          success: false,
          message: 'مصدر الإدخال الصوتي غير موجود'
        });
        return;
      }

      // حفظ معلومات الملف في قاعدة البيانات
      const fileRecord = await ManualInputService.saveUploadedFile({
        source_id: sources.audio.id,
        source_type_id: sources.audio.source_type_id,
        file_type: 'audio',
        original_filename: uploadResult.original_filename,
        file_size: uploadResult.file_size,
        mime_type: uploadResult.mime_type,
        s3_bucket: uploadResult.s3_bucket,
        s3_key: uploadResult.s3_key,
        s3_url: uploadResult.s3_url,
        uploaded_by: uploadedBy,
        media_unit_id: mediaUnitId
      });

      res.status(201).json({
        success: true,
        data: {
          id: fileRecord.id,
          file_url: fileRecord.s3_url,
          file_size: fileRecord.file_size,
          original_filename: fileRecord.original_filename,
          processing_status: fileRecord.processing_status,
          uploaded_at: fileRecord.uploaded_at
        },
        message: 'تم رفع الملف الصوتي بنجاح'
      });

    } catch (error) {
      console.error('❌ خطأ في رفع الملف الصوتي:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في رفع الملف الصوتي',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/manual-input/upload-video
   * رفع ملف فيديو
   * 
   * Body: multipart/form-data
   * - file: الملف الفيديو
   * - uploaded_by: معرف المستخدم
   */
  static async uploadVideo(req: Request, res: Response): Promise<void> {
    try {
      // التحقق من وجود الملف
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'ملف الفيديو مطلوب'
        });
        return;
      }

      // التحقق من معرف المستخدم
      const uploadedBy = parseInt(req.body.uploaded_by);
      if (!uploadedBy) {
        res.status(400).json({
          success: false,
          message: 'معرف المستخدم مطلوب'
        });
        return;
      }

      // التحقق من معرف الوحدة الإعلامية
      const mediaUnitId = parseInt(req.body.media_unit_id);
      if (!mediaUnitId) {
        res.status(400).json({
          success: false,
          message: 'معرف الوحدة الإعلامية مطلوب'
        });
        return;
      }

      // الحصول على العنوان (اختياري)
      const title = req.body.title?.trim() || undefined;

      // استيراد الخدمات
      const { S3UploadService } = await import('../../services/manual-input/S3UploadService');

      // التحقق من نوع الملف
      if (!S3UploadService.validateFileType(req.file, 'video')) {
        res.status(400).json({
          success: false,
          message: 'نوع الملف غير مدعوم. الأنواع المسموحة: MP4, WebM, MOV, AVI'
        });
        return;
      }

      // التحقق من حجم الملف
      if (!S3UploadService.validateFileSize(req.file, 'video')) {
        res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى: 500 MB'
        });
        return;
      }

      // رفع الملف على S3 مع العنوان
      const uploadResult = await S3UploadService.uploadFile(req.file, 'video', title);

      // جلب معلومات المصدر
      const sources = await ManualInputService.getManualInputSources();
      if (!sources || !sources.video) {
        res.status(500).json({
          success: false,
          message: 'مصدر الإدخال الفيديو غير موجود'
        });
        return;
      }

      // حفظ معلومات الملف في قاعدة البيانات
      const fileRecord = await ManualInputService.saveUploadedFile({
        source_id: sources.video.id,
        source_type_id: sources.video.source_type_id,
        file_type: 'video',
        original_filename: uploadResult.original_filename,
        file_size: uploadResult.file_size,
        mime_type: uploadResult.mime_type,
        s3_bucket: uploadResult.s3_bucket,
        s3_key: uploadResult.s3_key,
        s3_url: uploadResult.s3_url,
        uploaded_by: uploadedBy,
        media_unit_id: mediaUnitId
      });

      res.status(201).json({
        success: true,
        data: {
          id: fileRecord.id,
          file_url: fileRecord.s3_url,
          file_size: fileRecord.file_size,
          original_filename: fileRecord.original_filename,
          processing_status: fileRecord.processing_status,
          uploaded_at: fileRecord.uploaded_at
        },
        message: 'تم رفع ملف الفيديو بنجاح'
      });

    } catch (error) {
      console.error('❌ خطأ في رفع ملف الفيديو:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في رفع ملف الفيديو',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/manual-input/pending-files
   * جلب الملفات المعلقة للمعالجة
   */
  static async getPendingFiles(req: Request, res: Response): Promise<void> {
    try {
      const files = await ManualInputService.getPendingFiles();
      
      res.status(200).json({
        success: true,
        data: files,
        count: files.length
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الملفات المعلقة:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب الملفات المعلقة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/manual-input/media-units
   * جلب قائمة الوحدات الإعلامية
   */
  static async getMediaUnits(req: Request, res: Response): Promise<void> {
    try {
      const mediaUnits = await ManualInputService.getMediaUnits();
      
      res.status(200).json({
        success: true,
        data: mediaUnits
      });
    } catch (error) {
      console.error('❌ خطأ في جلب الوحدات الإعلامية:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب الوحدات الإعلامية',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * GET /api/manual-input/users
   * جلب قائمة كل المستخدمين
   */
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await ManualInputService.getAllUsers();
      
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في جلب المستخدمين',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * POST /api/manual-input/upload-image
   * رفع صورة
   * 
   * Body: multipart/form-data
   * - file: ملف الصورة (required)
   * - uploaded_by: معرف المستخدم (required)
   * - media_unit_id: معرف الوحدة الإعلامية (required)
   * - title: عنوان الصورة (optional)
   */
  static async uploadImage(req: Request, res: Response): Promise<void> {
    try {
      // التحقق من وجود الملف
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'ملف الصورة مطلوب'
        });
        return;
      }

      // التحقق من معرف المستخدم
      const uploadedBy = parseInt(req.body.uploaded_by);
      if (!uploadedBy) {
        res.status(400).json({
          success: false,
          message: 'معرف المستخدم مطلوب'
        });
        return;
      }

      // التحقق من معرف الوحدة الإعلامية
      const mediaUnitId = parseInt(req.body.media_unit_id);
      if (!mediaUnitId) {
        res.status(400).json({
          success: false,
          message: 'معرف الوحدة الإعلامية مطلوب'
        });
        return;
      }

      // الحصول على العنوان (اختياري)
      const title = req.body.title?.trim() || undefined;

      // استيراد الخدمات
      const { S3UploadService } = await import('../../services/manual-input/S3UploadService');

      // التحقق من نوع الملف
      if (!S3UploadService.validateFileType(req.file, 'image')) {
        res.status(400).json({
          success: false,
          message: 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, GIF, WebP'
        });
        return;
      }

      // التحقق من حجم الملف
      if (!S3UploadService.validateFileSize(req.file, 'image')) {
        res.status(400).json({
          success: false,
          message: 'حجم الملف كبير جداً. الحد الأقصى: 10 MB'
        });
        return;
      }

      // رفع الملف على S3 مع العنوان
      const uploadResult = await S3UploadService.uploadFile(req.file, 'image', title);

      // جلب معلومات المصدر
      const sources = await ManualInputService.getManualInputSources();
      if (!sources || !sources.text) {
        res.status(500).json({
          success: false,
          message: 'مصدر الإدخال النصي غير موجود'
        });
        return;
      }

      // حفظ معلومات الملف في قاعدة البيانات
      const fileRecord = await ManualInputService.saveUploadedFile({
        source_id: sources.text.id,
        source_type_id: sources.text.source_type_id,
        file_type: 'image',
        original_filename: uploadResult.original_filename,
        file_size: uploadResult.file_size,
        mime_type: uploadResult.mime_type,
        s3_bucket: uploadResult.s3_bucket,
        s3_key: uploadResult.s3_key,
        s3_url: uploadResult.s3_url,
        uploaded_by: uploadedBy,
        media_unit_id: mediaUnitId
      });

      res.status(201).json({
        success: true,
        data: {
          id: fileRecord.id,
          file_url: fileRecord.s3_url,
          file_size: fileRecord.file_size,
          original_filename: fileRecord.original_filename,
          uploaded_at: fileRecord.uploaded_at
        },
        message: 'تم رفع الصورة بنجاح'
      });

    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      res.status(500).json({
        success: false,
        message: 'فشل في رفع الصورة',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
