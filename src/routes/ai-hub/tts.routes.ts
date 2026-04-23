/**
 * Text-to-Speech Routes
 * مسارات تحويل النص إلى صوت
 */

import { Router, Request, Response, NextFunction } from 'express';
import { generateTTS, getVoices } from '../../controllers/ai-hub/tts.controller';

const router = Router();

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] TTS Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/tts/generate - تحويل النص إلى صوت
 * Request body:
 * {
 *   "text": "string (required)",
 *   "voice": "alloy|echo|fable|onyx|nova|shimmer (optional, default: nova)"
 * }
 * Response:
 * {
 *   "success": boolean,
 *   "audioBase64": "string (base64 encoded audio)",
 *   "mimeType": "audio/mpeg",
 *   "remaining": number,
 *   "resetTime": number
 * }
 */
router.post('/generate', generateTTS);

/**
 * GET /api/ai-hub/tts/voices - الحصول على قائمة الأصوات المتاحة
 * Response:
 * {
 *   "success": boolean,
 *   "voices": {
 *     "alloy": { "name": "Alloy", "description": "..." },
 *     ...
 *   }
 * }
 */
router.get('/voices', getVoices);

export default router;
