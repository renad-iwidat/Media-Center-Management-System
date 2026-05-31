import { api } from './api';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: ChatAction;
}

export interface ChatAction {
  type: 'navigate' | 'api_call' | 'query_data' | 'none';
  payload?: any;
}

interface OpenAIMessage {
  role: 'user' | 'assistant';
  content: string;
}

class ChatbotService {
  private apiKey: string;
  private conversationHistory: OpenAIMessage[] = [];
  private systemPrompt: string;
  private baseUrl = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.systemPrompt = this.buildSystemPrompt();
  }

  private buildSystemPrompt(): string {
    return `أنت مساعد ذكي متخصص في نظام إدارة مركز الإعلام بجامعة النجاح الوطنية.

## معلومات النظام:
- النظام يدير الإنتاج الإعلامي والمحتوى والمهام والطلبات
- اللغة الأساسية: العربية
- المستخدمون لديهم أدوار وصلاحيات مختلفة

## الصفحات والميزات المتاحة:
1. **لوحة التحكم** (/dashboard) - إحصائيات وتقارير شاملة عن الطلبات والمهام والموظفين
2. **الطلبات** (/orders) - إنشاء وتتبع الطلبات الإعلامية
3. **المهام** (/tasks) - إدارة المهام والتعيينات والمواعيد النهائية
4. **الأرشيف الذكي** (/content) - تنظيم وإعادة استخدام المحتوى الإعلامي
5. **البرامج** (/programs) - إدارة البرامج الإعلامية والحلقات
6. **التصوير** (/shootings) - تسجيل جلسات التصوير والمعدات والطاقم
7. **الأقسام** (/departments) - إدارة الأقسام والفرق
8. **المستخدمين** (/users) - إدارة المستخدمين والصلاحيات
9. **الإجراءات الإدارية** (/administrative) - طلبات الإجازة والمهام الإدارية
10. **الإشعارات** (/notifications) - الإشعارات الفورية
11. **الملف الشخصي** (/profile) - بيانات المستخدم وتغيير كلمة المرور

## API Endpoints الرئيسية:
- GET /api/kpi/dashboard - لوحة التحكم والإحصائيات
- GET /api/orders - قائمة الطلبات
- GET /api/orders/:id - تفاصيل طلب
- PATCH /api/orders/:id - تحديث طلب
- GET /api/tasks - قائمة المهام
- GET /api/tasks/:id - تفاصيل مهمة
- PATCH /api/tasks/:id - تحديث مهمة
- GET /api/content - الأرشيف الذكي
- GET /api/content/:id - تفاصيل محتوى
- GET /api/programs - البرامج
- GET /api/shootings - جلسات التصوير
- GET /api/portal/users - المستخدمين
- GET /api/notifications - الإشعارات

## نماذج البيانات الرئيسية:
- **Order**: الطلب (العنوان، الوصف، الحالة، الأولوية، الموعد النهائي)
- **Task**: المهمة (العنوان، المسؤول، الحالة، الأولوية، الموعد النهائي)
- **Content**: المحتوى (النوع، الحجم، الوسوم، معدل إعادة الاستخدام)
- **Program**: البرنامج (العنوان، الوحدة الإعلامية، عدد الحلقات)
- **Shooting**: جلسة التصوير (الموقع، المعدات، الطاقم، الملاحظات)

## تعليمات الإجابة:
1. أجب على الأسئلة بناءً على البيانات المتاحة في النظام
2. كن دقيقاً وواضحاً في الإجابات
3. استخدم العربية فقط
4. إذا كان السؤال يتطلب ملاحة، اقترح الصفحة المناسبة
5. إذا لم تتمكن من الإجابة، قل "عذراً، لا أستطيع الإجابة على هذا السؤال"
6. كن ودياً وخدماتياً
7. اقترح الإجراءات التالية إن أمكن

## أمثلة على الأسئلة:
- "كم عدد الطلبات المتأخرة؟"
- "أريد إنشاء طلب جديد"
- "ما هي المهام المسندة إلي؟"
- "أين أجد الأرشيف الذكي؟"
- "كيف أغير حالة الطلب؟"
- "من هم أفضل الموظفين أداءً؟"`;
  }

  async sendMessage(userMessage: string): Promise<ChatMessage> {
    try {
      if (!this.apiKey) {
        throw new Error('OpenAI API key is not configured');
      }

      // إضافة رسالة المستخدم للسجل
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // استدعاء OpenAI API
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: this.systemPrompt,
            },
            ...this.conversationHistory,
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const assistantMessage = data.choices?.[0]?.message?.content;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI API');
      }

      // إضافة رسالة المساعد للسجل
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // محاولة استخراج الإجراء من الرسالة
      const action = this.parseAction(assistantMessage);

      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString(),
        action,
      };
    } catch (error) {
      console.error('Chatbot error:', error);
      throw error;
    }
  }

  private parseAction(message: string): ChatAction {
    // محاولة استخراج الإجراء من الرسالة
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('صفحة الطلبات') || lowerMessage.includes('orders')) {
      return { type: 'navigate', payload: { path: '/orders' } };
    }
    if (lowerMessage.includes('صفحة المهام') || lowerMessage.includes('tasks')) {
      return { type: 'navigate', payload: { path: '/tasks' } };
    }
    if (lowerMessage.includes('لوحة التحكم') || lowerMessage.includes('dashboard')) {
      return { type: 'navigate', payload: { path: '/dashboard' } };
    }
    if (lowerMessage.includes('الأرشيف') || lowerMessage.includes('content')) {
      return { type: 'navigate', payload: { path: '/content' } };
    }
    if (lowerMessage.includes('البرامج') || lowerMessage.includes('programs')) {
      return { type: 'navigate', payload: { path: '/programs' } };
    }
    if (lowerMessage.includes('التصوير') || lowerMessage.includes('shootings')) {
      return { type: 'navigate', payload: { path: '/shootings' } };
    }
    if (lowerMessage.includes('الأقسام') || lowerMessage.includes('departments')) {
      return { type: 'navigate', payload: { path: '/departments' } };
    }
    if (lowerMessage.includes('المستخدمين') || lowerMessage.includes('users')) {
      return { type: 'navigate', payload: { path: '/users' } };
    }
    if (lowerMessage.includes('الإجراءات الإدارية') || lowerMessage.includes('administrative')) {
      return { type: 'navigate', payload: { path: '/administrative' } };
    }
    if (lowerMessage.includes('الإشعارات') || lowerMessage.includes('notifications')) {
      return { type: 'navigate', payload: { path: '/notifications' } };
    }
    if (lowerMessage.includes('الملف الشخصي') || lowerMessage.includes('profile')) {
      return { type: 'navigate', payload: { path: '/profile' } };
    }

    return { type: 'none' };
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): OpenAIMessage[] {
    return this.conversationHistory;
  }
}

export const chatbotService = new ChatbotService();
