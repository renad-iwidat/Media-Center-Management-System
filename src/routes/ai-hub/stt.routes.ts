/**
 * Speech-to-Text Routes
 * مسارات تحويل الصوت إلى نص
 */

import { Router, Request, Response, NextFunction } from 'express';
import { STTController } from '../../controllers/ai-hub/stt.controller';

const router = Router();

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
router.post('/transcribe-url', STTController.transcribeFromUrl);

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
router.post('/transcribe-file', STTController.transcribeFromFile);

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

export default router;
