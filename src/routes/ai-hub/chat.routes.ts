/**
 * Chat Routes
 * مسارات الدردشة والمساعد الذكي
 */

import { Router, Request, Response, NextFunction } from 'express';
import { generateChatResponse } from '../../controllers/ai-hub/chat.controller';
import { summarizeText, rewriteText } from '../../controllers/ai-hub/text-tools.controller';

const router = Router();

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] Chat Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/chat/generate - توليد رد من المساعد الذكي
 * Request body:
 * {
 *   "prompt": "string",
 *   "think": boolean (optional),
 *   "max_tokens": number (optional),
 *   "temperature": number (optional)
 * }
 */
router.post('/generate', generateChatResponse);

/**
 * POST /api/ai-hub/chat/summarize - تلخيص نص
 * Request body: { "text": "string", "style": "bullet_points|short_paragraph|headlines" }
 */
router.post('/summarize', summarizeText);

/**
 * POST /api/ai-hub/chat/rewrite - إعادة صياغة نص
 * Request body: { "text": "string", "style": "radio_broadcast|investigative|social_media|formal|casual" }
 */
router.post('/rewrite', rewriteText);

export default router;
