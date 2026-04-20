import { S3Client } from '@aws-sdk/client-s3';
import { environment } from './environment';

/**
 * AWS S3 Client Configuration
 * إعداد الاتصال مع Amazon S3
 */

export const s3Client = new S3Client({
  region: environment.AWS_REGION,
  credentials: {
    accessKeyId: environment.AWS_ACCESS_KEY_ID,
    secretAccessKey: environment.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * S3 Configuration Constants
 */
export const S3_CONFIG = {
  BUCKET: environment.AWS_S3_BUCKET,
  REGION: environment.AWS_REGION,
  
  // مسارات الفولدرات
  FOLDERS: {
    AUDIO: 'manual-input-audio',
    VIDEO: 'manual-input-video',
  },
  
  // الحد الأقصى لحجم الملفات (بالـ bytes)
  MAX_FILE_SIZE: {
    AUDIO: 50 * 1024 * 1024, // 50 MB
    VIDEO: 500 * 1024 * 1024, // 500 MB
  },
  
  // أنواع الملفات المسموحة
  ALLOWED_MIME_TYPES: {
    AUDIO: [
      'audio/mpeg',      // .mp3
      'audio/mp4',       // .m4a
      'audio/wav',       // .wav
      'audio/webm',      // .webm
      'audio/ogg',       // .ogg
    ],
    VIDEO: [
      'video/mp4',       // .mp4
      'video/webm',      // .webm
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
    ],
  },
};

/**
 * توليد مسار S3 للملف
 */
export function generateS3Key(fileType: 'audio' | 'video', filename: string, title?: string): string {
  const folder = fileType === 'audio' ? S3_CONFIG.FOLDERS.AUDIO : S3_CONFIG.FOLDERS.VIDEO;
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  
  // تنظيف العنوان ليكون صالح لاسم الملف
  let sanitizedTitle = '';
  if (title) {
    sanitizedTitle = title
      .trim()
      .replace(/\s+/g, '-') // استبدال المسافات بـ -
      .replace(/[^\u0600-\u06FFa-zA-Z0-9-]/g, '') // إزالة الرموز الخاصة (نبقي العربي والإنجليزي والأرقام)
      .substring(0, 50); // الحد الأقصى 50 حرف
  }
  
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  const prefix = fileType === 'audio' ? 'audio' : 'video';
  
  // إذا في عنوان: audio-العنوان-timestamp-random.ext
  // إذا ما في عنوان: audio-timestamp-random-filename.ext
  if (sanitizedTitle) {
    const ext = sanitizedFilename.split('.').pop();
    return `${folder}/${prefix}-${sanitizedTitle}-${timestamp}-${randomStr}.${ext}`;
  } else {
    return `${folder}/${prefix}-${timestamp}-${randomStr}-${sanitizedFilename}`;
  }
}

/**
 * توليد رابط S3 العام
 */
export function generateS3Url(key: string): string {
  return `https://${S3_CONFIG.BUCKET}.s3.${S3_CONFIG.REGION}.amazonaws.com/${key}`;
}

console.log('✅ AWS S3 Client initialized');
console.log(`📦 Bucket: ${S3_CONFIG.BUCKET}`);
console.log(`🌍 Region: ${S3_CONFIG.REGION}`);
