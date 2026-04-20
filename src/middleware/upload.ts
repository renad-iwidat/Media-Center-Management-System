import multer from 'multer';

/**
 * Multer Configuration
 * إعداد رفع الملفات باستخدام memory storage
 */

// استخدام memory storage لأننا سنرفع مباشرة على S3
const storage = multer.memoryStorage();

/**
 * Multer instance للملفات الصوتية
 * الحد الأقصى: 50 MB
 */
export const uploadAudio = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'audio/mpeg',      // .mp3
      'audio/mp4',       // .m4a
      'audio/wav',       // .wav
      'audio/webm',      // .webm
      'audio/ogg',       // .ogg
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

/**
 * Multer instance للملفات الفيديو
 * الحد الأقصى: 500 MB
 */
export const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'video/mp4',       // .mp4
      'video/webm',      // .webm
      'video/quicktime', // .mov
      'video/x-msvideo', // .avi
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});

/**
 * Multer instance للصور
 * الحد الأقصى: 10 MB
 */
export const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',      // .jpg, .jpeg
      'image/png',       // .png
      'image/gif',       // .gif
      'image/webp',      // .webp
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('نوع الملف غير مدعوم'));
    }
  }
});
