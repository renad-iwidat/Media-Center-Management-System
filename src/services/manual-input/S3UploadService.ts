import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { s3Client, S3_CONFIG, generateS3Key, generateS3Url } from '../../config/s3';

/**
 * S3 Upload Service
 * خدمة رفع الملفات على Amazon S3
 */

export interface UploadResult {
  s3_key: string;
  s3_url: string;
  s3_bucket: string;
  file_size: number;
  mime_type: string;
  original_filename: string;
}

export class S3UploadService {
  /**
   * رفع ملف على S3
   */
  static async uploadFile(
    file: Express.Multer.File,
    fileType: 'audio' | 'video',
    title?: string
  ): Promise<UploadResult> {
    try {
      // توليد مسار فريد للملف مع العنوان
      const s3Key = generateS3Key(fileType, file.originalname, title);
      
      // رفع الملف باستخدام multipart upload (للملفات الكبيرة)
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: S3_CONFIG.BUCKET,
          Key: s3Key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read', // جعل الملف عام للقراءة
        },
      });

      // تنفيذ الرفع
      await upload.done();

      // توليد الرابط العام
      const s3Url = generateS3Url(s3Key);

      console.log(`✅ تم رفع الملف: ${s3Key}`);

      return {
        s3_key: s3Key,
        s3_url: s3Url,
        s3_bucket: S3_CONFIG.BUCKET,
        file_size: file.size,
        mime_type: file.mimetype,
        original_filename: file.originalname,
      };
    } catch (error) {
      console.error('❌ خطأ في رفع الملف على S3:', error);
      throw new Error('فشل رفع الملف على S3');
    }
  }

  /**
   * التحقق من نوع الملف
   */
  static validateFileType(file: Express.Multer.File, fileType: 'audio' | 'video'): boolean {
    const allowedTypes = fileType === 'audio' 
      ? S3_CONFIG.ALLOWED_MIME_TYPES.AUDIO 
      : S3_CONFIG.ALLOWED_MIME_TYPES.VIDEO;
    
    return allowedTypes.includes(file.mimetype);
  }

  /**
   * التحقق من حجم الملف
   */
  static validateFileSize(file: Express.Multer.File, fileType: 'audio' | 'video'): boolean {
    const maxSize = fileType === 'audio' 
      ? S3_CONFIG.MAX_FILE_SIZE.AUDIO 
      : S3_CONFIG.MAX_FILE_SIZE.VIDEO;
    
    return file.size <= maxSize;
  }
}
