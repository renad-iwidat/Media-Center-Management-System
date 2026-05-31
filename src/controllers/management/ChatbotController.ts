import { Request, Response } from 'express';
import { ChatbotService, ChatRequest } from '../../services/management/ChatbotService';

/**
 * ChatbotController — نقطة الوصول للمساعد الذكي
 * POST /api/chat
 */
export class ChatbotController {
  async chat(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        this.sendError(res, 'Not authenticated', 401);
        return;
      }

      const { message, history } = req.body || {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        this.sendError(res, 'الرسالة مطلوبة', 400);
        return;
      }

      if (message.length > 2000) {
        this.sendError(res, 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)', 400);
        return;
      }

      const chatRequest: ChatRequest = {
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
      };

      const result = await ChatbotService.chat(chatRequest, req.user);

      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // أخطاء الإعداد (مفتاح مفقود) نرجّعها كـ 503
      const statusCode = message.includes('not configured') ? 503 : 500;
      this.sendError(res, message, statusCode);
    }
  }

  private sendError(res: Response, error: string, statusCode: number = 400): void {
    res.status(statusCode).json({
      success: false,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
