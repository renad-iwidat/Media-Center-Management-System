/**
 * Chat Routes
 * مسارات الدردشة والمساعد الذكي
 */

import { Router, Request, Response, NextFunction } from 'express';
import { generateChatResponse } from '../../controllers/ai-hub/chat.controller';

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

export default router;
