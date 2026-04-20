import dotenv from 'dotenv';

// تحميل متغيرات البيئة
dotenv.config();

/**
 * متغيرات البيئة
 */
export const environment = {
  DATABASE_URL: process.env.DATABASE_URL || '',
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // AWS S3 Configuration
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'eu-north-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
};

// التحقق من المتغيرات المطلوبة
if (!environment.DATABASE_URL) {
  throw new Error('❌ DATABASE_URL غير موجود في ملف .env');
}

if (!environment.AWS_ACCESS_KEY_ID || !environment.AWS_SECRET_ACCESS_KEY) {
  console.warn('⚠️ AWS credentials غير موجودة - ميزة رفع الملفات لن تعمل');
}

if (!environment.AWS_S3_BUCKET) {
  console.warn('⚠️ AWS_S3_BUCKET غير موجود - ميزة رفع الملفات لن تعمل');
}
