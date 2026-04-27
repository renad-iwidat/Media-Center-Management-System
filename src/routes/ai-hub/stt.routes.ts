/**
 * Speech-to-Text Routes
 * مسارات تحويل الصوت إلى نص
 */

import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { STTController } from '../../controllers/ai-hub/stt.controller';
import { createAILogger } from '../../middleware/ai-usage-logger.middleware';

const router = Router();

// Configure multer for audio file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Accept audio files only
    const allowedMimes = [
      'audio/mpeg',
      'audio/wav',
      'audio/mp4',
      'audio/ogg',
      'audio/flac',
      'audio/webm',
      'audio/x-m4a',
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedMimes.join(', ')}`));
    }
  },
});

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] STT Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/stt/transcribe-url - تفريغ صوتي من رابط
 * Request body:
 * {
 *   "audioUrl": "string (required) - S3 URL or any accessible audio URL",
 *   "language": "string (optional, default: 'ar') - Language hint for transcription"
 * }
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "transcript": "string - The transcribed text",
 *     "language": "string - The language used",
 *     "audioUrl": "string - The audio URL that was transcribed"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/transcribe-url', createAILogger('stt', 'transcribe-url'), STTController.transcribeFromUrl);

/**
 * POST /api/ai-hub/stt/transcribe-file - تفريغ صوتي من ملف مرفوع
 * Request body:
 * {
 *   "fileId": "number (optional) - ID of the uploaded file",
 *   "s3Url": "string (required) - S3 URL of the audio file",
 *   "language": "string (optional, default: 'ar') - Language hint for transcription"
 * }
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "fileId": "number - The file ID",
 *     "transcript": "string - The transcribed text",
 *     "language": "string - The language used",
 *     "s3Url": "string - The S3 URL that was transcribed"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/transcribe-file', createAILogger('stt', 'transcribe-file'), STTController.transcribeFromFile);

/**
 * GET /api/ai-hub/stt/languages - الحصول على قائمة اللغات المدعومة
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "ar": "Arabic (العربية)",
 *     "en": "English",
 *     ...
 *   }
 * }
 */
router.get('/languages', STTController.getSupportedLanguages);

/**
 * POST /api/ai-hub/stt/transcribe-upload - تفريغ صوتي من ملف مرفوع
 * Content-Type: multipart/form-data
 * Form fields:
 * - file: audio file (required) - mp3, wav, m4a, ogg, flac, webm
 * - language: language code (optional, default: 'ar')
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "transcript": "string - The transcribed text",
 *     "language": "string - The language used",
 *     "fileName": "string - The uploaded file name",
 *     "fileSize": "number - The file size in bytes"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/transcribe-upload', upload.single('file'), createAILogger('stt', 'transcribe-upload'), STTController.transcribeFromUpload);

/**
 * POST /api/ai-hub/stt/transcribe-base64 - تفريغ صوتي من بيانات base64
 * Content-Type: application/json
 * Body:
 * {
 *   "audioBase64": "base64 encoded audio data (required)",
 *   "language": "language code (optional, default: 'ar')"
 * }
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "transcript": "string - The transcribed text",
 *     "language": "string - The language used",
 *     "audioSize": "number - The audio size in bytes"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/transcribe-base64', createAILogger('stt', 'transcribe-base64'), STTController.transcribeFromBase64);

export default router;
