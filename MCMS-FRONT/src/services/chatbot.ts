import { api } from './api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'navigate' | 'open_url' | 'none';
  payload?: { path?: string; url?: string };
}

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatApiResponse {
  success: boolean;
  data?: {
    reply: string;
    action: ChatAction;
  };
  error?: string;
}

/**
 * ChatbotService (Frontend)
 *
 * بينادي الـ backend endpoint الآمن (/api/chat) بدل ما ينادي OpenAI مباشرة.
 * هيك المفتاح بيظل محمي على السيرفر، والمساعد بيوصل لبيانات النظام الحقيقية.
 */
class ChatbotService {
  private conversationHistory: ChatHistoryItem[] = [];

  async sendMessage(userMessage: string): Promise<ChatMessage> {
    // نضيف رسالة المستخدم للسجل المحلي
    this.conversationHistory.push({ role: 'user', content: userMessage });

    const response = await api.post<ChatApiResponse>('/api/chat', {
      message: userMessage,
      // نرسل السجل بدون آخر رسالة (لأنها نفس userMessage)
      history: this.conversationHistory.slice(0, -1).slice(-12),
    });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'تعذّر الاتصال بالمساعد الذكي');
    }

    const { reply, action } = response.data;

    // نضيف رد المساعد للسجل
    this.conversationHistory.push({ role: 'assistant', content: reply });

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date().toISOString(),
      action: action || { type: 'none' },
    };
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ChatHistoryItem[] {
    return this.conversationHistory;
  }
}

export const chatbotService = new ChatbotService();
