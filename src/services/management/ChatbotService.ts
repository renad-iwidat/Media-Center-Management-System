import axios from 'axios';
import { KPIService } from './KPIService';
import { TaskService } from './TaskService';
import { OrderService } from './OrderService';
import { AuthService, AuthPayload } from './AuthService';

/**
 * ChatbotService
 * مساعد ذكي داخل النظام — بيتكامل مع OpenAI ويقدر يجاوب على أسئلة المستخدم
 * باستخدام بيانات حقيقية من قاعدة البيانات عبر Function Calling.
 *
 * المفتاح (OPENAI_API_KEY) بيظل على السيرفر فقط وما بينكشف أبداً للمتصفح.
 */

export interface ChatRole {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

export interface ChatRequest {
  message: string;
  history?: { role: 'user' | 'assistant'; content: string }[];
}

export interface ChatAction {
  type: 'navigate' | 'open_url' | 'none';
  payload?: { path?: string; url?: string };
}

export interface ChatResult {
  reply: string;
  action: ChatAction;
}

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_TOOL_ROUNDS = 4;

// النظام الإخباري الذكي الخارجي (Automation & AI Hub)
const AI_NEWS_SYSTEM_URL = 'https://automation-and-ai-hub-frontend.onrender.com/';

export class ChatbotService {
  private static taskService = new TaskService();
  private static orderService = new OrderService();

  /**
   * بناء الـ System Prompt — بيشرح للمساعد طبيعة النظام والصفحات والصلاحيات
   */
  private static buildSystemPrompt(user: AuthPayload): string {
    const now = new Date().toISOString();
    return `أنت "مساعد مركز الإعلام" — مساعد ذكي متخصص في نظام إدارة مركز الإعلام بجامعة النجاح الوطنية (MCMS).

## معلومات عن المستخدم الحالي:
- البريد الإلكتروني: ${user.email}
- الدور: ${user.role_name}
- التاريخ والوقت الحالي: ${now}

## من صمّم/طوّر النظام:
- إذا سأل المستخدم من صمّم النظام أو من طوّره أو من برمجه أو من يقف خلفه، أجب: "تم تصميم وتطوير النظام من قِبل **وحدة ليمينال** التابعة لمركز الإعلام بجامعة النجاح الوطنية."

## دورك:
- تجاوب على أسئلة المستخدم حول النظام وبياناته بدقة ووضوح.
- لما يحتاج المستخدم بيانات حقيقية (طلبات، مهام، إحصائيات...)، استدعِ الأداة المناسبة (function) واجلب البيانات الفعلية بدل ما تخترع أرقام.
- لما المستخدم بدو يروح لصفحة معينة، استخدم أداة navigate_to_page لفتحها له.
- خلي إجاباتك مختصرة ومنظمة، وبالعربية الفصحى البسيطة.
- لا تكشف تفاصيل تقنية حساسة (مفاتيح، استعلامات SQL، أسرار النظام).

## قواعد مهمة جداً (التزم فيها):
1. **استخدم الأدوات دائماً قبل ما تقول "لا أستطيع".** ممنوع ترفض الإجابة على سؤال متعلق بالبيانات قبل ما تجرّب الأداة المناسبة فعلياً.
2. أي سؤال عن **عدد الطلبات/المهام/المحتوى أو الإحصائيات العامة** → استدعِ get_dashboard_summary. النتيجة فيها:
   - orders.total = إجمالي عدد الطلبات، و orders.completed / in_progress / pending / overdue.
   - tasks.total = إجمالي المهام، ونفس التقسيم.
   - content.total و users.total.
   فأجب من هذه الأرقام مباشرة.
3. سؤال عن **"مهامي" أو المهام المسندة لي** → استدعِ get_my_tasks.
4. سؤال عن **المهام المتأخرة** → استدعِ get_overdue_tasks.
5. لعرض/البحث عن طلبات أو مهام محددة → استدعِ search_orders أو search_tasks.
6. ملاحظة عن الطلبات: الطلبات في النظام مرتبطة بالأقسام (desks) وليست مملوكة لشخص واحد. لو سأل المستخدم "كم طلب عندي؟"، أعطه إجمالي الطلبات في النظام من get_dashboard_summary، ووضّح أن الرقم يمثل كل الطلبات وليس طلباته الشخصية فقط، واقترح فتح صفحة /orders للتفاصيل.
7. أنت تستطيع الإجابة على الأسئلة العامة عن النظام وكيفية استخدامه (شرح الصفحات، كيف أنشئ طلب، إلخ) من معلوماتك بدون أدوات.
8. **للأسئلة التعليمية** مثل "كيف أستخدم النظام؟" أو "كيف أعمل كذا؟": أعطِ شرحاً **تفصيلياً جداً ومنظّماً** اعتماداً على "دليل استخدام النظام" أعلاه:
   - إن كان السؤال عاماً ("كيف أستخدم النظام؟") قدّم نظرة شاملة مقسّمة بعناوين لكل قسم رئيسي، مع خطوات مرقّمة واضحة لكل مهمة شائعة (إنشاء طلب، إنشاء مهمة، تغيير حالة، رفع مرفق...).
   - إن كان السؤال عن ميزة محددة، فصّل خطواتها خطوة بخطوة بالترتيب، واذكر الحقول المطلوبة والصلاحيات اللازمة إن وُجدت، واقترح الخطوة التالية.
   - استخدم تنسيق Markdown: عناوين غامقة (**...**)، وقوائم مرقّمة وقوائم نقطية، لتسهيل القراءة.
   - كن سخياً بالتفاصيل في هذه الأسئلة تحديداً، ولا تختصر.
9. فقط إذا كان السؤال خارج نطاق النظام تماماً أو لا توجد أداة تخدمه بعد محاولة فعلية، اعتذر بإيجاز ووضّح البديل.

## الصفحات المتاحة (للملاحة):
- /dashboard — لوحة التحكم والإحصائيات
- /orders — الطلبات
- /tasks — المهام
- /content — الأرشيف الذكي للمحتوى
- /programs — البرامج والحلقات
- /shootings — جلسات التصوير
- /departments — الأقسام والفرق
- /users — المستخدمين
- /administrative — الإجراءات الإدارية (إجازات ومهام إدارية)
- /notifications — الإشعارات
- /profile — الملف الشخصي

## دليل استخدام النظام (مرجعك للأسئلة التعليمية "كيف أستخدم..."):

### 1) الدخول والتنقل
- سجّل الدخول بالبريد الإلكتروني وكلمة السر. تظهر "الصفحة الرئيسية" (/welcome) فيها روابط سريعة (مهامي، طلب إجازة، الإشعارات، المهام).
- القائمة الجانبية اليمنى فيها الأقسام حسب صلاحياتك: لوحة التحكم، الطلبات، المهام، الأرشيف الذكي، البرامج والحلقات، الأقسام والفرق، إدارة المستخدمين، بوابة إدخال المراسلين.
- زر الإشعارات (الجرس) أعلى الصفحة يعرض آخر التنبيهات الفورية.

### 2) لوحة التحكم (/dashboard) — لمن لديه صلاحية kpi.view
- تعرض إحصائيات شاملة: أعداد الطلبات والمهام (مكتملة/جارية/معلقة/متأخرة)، نِسَب الإنجاز، المحتوى المنتَج، وأداء الموظفين.

### 3) الطلبات (/orders)
- لعرض كل الطلبات الإعلامية وحالاتها وأولوياتها ومواعيدها النهائية.
- لإنشاء طلب: اضغط زر "إنشاء طلب / طلب جديد"، واملأ: العنوان، الوصف، القسم (Desk)، الوحدة الإعلامية، البرنامج/الحلقة إن وُجد، الأولوية، الموعد النهائي، ثم احفظ.
- لفتح طلب: اضغط عليه لرؤية تفاصيله، مهامه المرتبطة، نسبة تقدّمه، وسجل التغييرات.
- لتغيير الحالة: من داخل تفاصيل الطلب عبر قائمة الحالة (يتطلب صلاحية).

### 4) المهام (/tasks)
- لعرض المهام وتعييناتها وحالاتها ومواعيدها.
- لإنشاء مهمة: زر "مهمة جديدة"، واملأ: العنوان، الوصف، الطلب المرتبط، المسؤول/المكلَّف، النوع، الأولوية، الموعد النهائي.
- داخل تفاصيل المهمة يمكنك: تغيير الحالة، إضافة تعليقات وذكر زملاء (mention)، رفع مرفقات، ومتابعة سجل المهمة.
- بعض المهام تُنفَّذ عبر "النظام الإخباري الذكي" الخارجي من زر مخصص داخل تفاصيل المهمة.

### 5) الأرشيف الذكي (/content)
- لتنظيم المحتوى الإعلامي المنتَج وإعادة استخدامه، مع تصنيفات وأنواع ووسوم، وإمكانية الأرشفة.

### 6) البرامج والحلقات (/programs)
- لإدارة البرامج الإعلامية، وكل برنامج له حلقات (Episodes) لها تفاصيلها.

### 7) جلسات التصوير (/shootings)
- لتسجيل جلسات التصوير: الموقع، المعدات، الطاقم، التواريخ، والملاحظات.

### 8) الأقسام والفرق (/departments)
- لإدارة الأقسام (Desks) والفرق (Teams) والوحدات الإعلامية.

### 9) إدارة المستخدمين (/users) — يتطلب صلاحية users.manage
- لإضافة مستخدمين، تعيين الأدوار والصلاحيات، وعرض مؤشرات أداء كل مستخدم.

### 10) الإجراءات الإدارية (/administrative)
- طلبات الإجازة/المغادرة (/my-leave-request) والمهام الإدارية (/my-admin-tasks)، وأرشيف خاص بالإداريين.

### 11) الملف الشخصي (/profile) وتغيير كلمة السر (/change-password)
- لعرض بياناتك وتعديلها وتغيير كلمة السر.

### 12) النظام الإخباري الذكي (خارجي)
- نظام منفصل لأتمتة الأخبار والذكاء الاصطناعي، يُفتح في تبويب جديد عبر أداة open_ai_news_system.

## الأدوات المتاحة لك:
- get_dashboard_summary: إحصائيات شاملة (طلبات، مهام، محتوى، مستخدمين).
- get_my_tasks: المهام المُسندة للمستخدم الحالي.
- get_overdue_tasks: المهام المتأخرة.
- search_orders: البحث/عرض الطلبات.
- search_tasks: البحث/عرض المهام.
- navigate_to_page: فتح صفحة معينة داخل النظام.
- open_ai_news_system: فتح "النظام الإخباري الذكي" الخارجي (Automation & AI Hub) في تبويب جديد.

## ملاحظة عن النظام الإخباري الذكي:
- "النظام الإخباري الذكي" أو "نظام الأخبار الذكي" أو "نظام الأتمتة والذكاء الاصطناعي" هو نظام **خارجي منفصل** عن الأرشيف الذكي (/content).
- لما يطلب المستخدم فتح/الانتقال إلى "النظام الإخباري الذكي" أو "نظام الأخبار الذكي" أو ما يشبهها، استخدم أداة open_ai_news_system وليس navigate_to_page. لا تخلط بينه وبين صفحة الأرشيف الذكي للمحتوى.

استخدم الأدوات بذكاء وفقط عند الحاجة، ولا تخمّن البيانات.`;
  }

  /**
   * تعريف الأدوات (Functions) اللي يقدر النموذج يستدعيها
   */
  private static getToolDefinitions(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'get_dashboard_summary',
          description: 'إحصائيات النظام الشاملة. استخدمها لأي سؤال عن الأعداد أو الإجماليات: عدد الطلبات (الإجمالي/المكتمل/الجاري/المعلق/المتأخر)، عدد المهام بنفس التقسيم، عدد المحتوى، وعدد المستخدمين النشطين.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_my_tasks',
          description: 'جلب المهام المُسندة للمستخدم الحالي.',
          parameters: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: 'الحد الأقصى لعدد النتائج (افتراضي 10)' },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_overdue_tasks',
          description: 'جلب قائمة المهام المتأخرة عن موعدها النهائي في النظام.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_orders',
          description: 'البحث عن الطلبات أو عرض أحدثها. يمكن تمرير نص للبحث.',
          parameters: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'نص البحث (اختياري)' },
              limit: { type: 'number', description: 'الحد الأقصى للنتائج (افتراضي 10)' },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'search_tasks',
          description: 'البحث عن المهام أو عرض أحدثها. يمكن تمرير نص للبحث.',
          parameters: {
            type: 'object',
            properties: {
              search: { type: 'string', description: 'نص البحث (اختياري)' },
              limit: { type: 'number', description: 'الحد الأقصى للنتائج (افتراضي 10)' },
            },
            required: [],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'navigate_to_page',
          description: 'فتح/توجيه المستخدم إلى صفحة معينة في النظام.',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'مسار الصفحة، مثل /orders أو /tasks أو /dashboard',
              },
            },
            required: ['path'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'open_ai_news_system',
          description: 'فتح "النظام الإخباري الذكي" الخارجي (Automation & AI Hub) في تبويب جديد. استخدمها عندما يطلب المستخدم نظام الأخبار الذكي أو النظام الإخباري أو نظام الأتمتة والذكاء الاصطناعي.',
          parameters: { type: 'object', properties: {}, required: [] },
        },
      },
    ];
  }

  /**
   * تنفيذ أداة معينة وإرجاع النتيجة كنص JSON
   */
  private static async executeTool(
    name: string,
    args: any,
    user: AuthPayload,
    action: ChatAction
  ): Promise<string> {
    try {
      switch (name) {
        case 'get_dashboard_summary': {
          const summary = await KPIService.getDashboardSummary();
          return this.safeStringify(summary);
        }
        case 'get_my_tasks': {
          const limit = this.clampLimit(args?.limit);
          const tasks = await this.taskService.getTasksByAssignee(BigInt(user.user_id), limit, 0);
          return this.safeStringify(this.trimTasks(tasks));
        }
        case 'get_overdue_tasks': {
          const tasks = await this.taskService.getOverdueTasks();
          return this.safeStringify(this.trimTasks(tasks));
        }
        case 'search_orders': {
          const limit = this.clampLimit(args?.limit);
          const search = typeof args?.search === 'string' ? args.search : '';
          const orders = search
            ? await this.orderService.searchOrders(limit, 0, search)
            : await this.orderService.getAllOrders(limit, 0);
          return this.safeStringify(orders);
        }
        case 'search_tasks': {
          const limit = this.clampLimit(args?.limit);
          const search = typeof args?.search === 'string' ? args.search : '';
          const result = await this.taskService.searchTasks(limit, 0, search);
          return this.safeStringify(this.trimTasks(result?.rows || []));
        }
        case 'navigate_to_page': {
          const path = typeof args?.path === 'string' ? args.path : '';
          if (path && path.startsWith('/')) {
            action.type = 'navigate';
            action.payload = { path };
            return this.safeStringify({ ok: true, navigatingTo: path });
          }
          return this.safeStringify({ ok: false, error: 'مسار غير صالح' });
        }
        case 'open_ai_news_system': {
          action.type = 'open_url';
          action.payload = { url: AI_NEWS_SYSTEM_URL };
          return this.safeStringify({ ok: true, openingUrl: AI_NEWS_SYSTEM_URL });
        }
        default:
          return this.safeStringify({ error: `أداة غير معروفة: ${name}` });
      }
    } catch (error) {
      return this.safeStringify({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * المعالجة الرئيسية: بتاخذ رسالة المستخدم + سجل المحادثة وترجع رد المساعد
   */
  static async chat(req: ChatRequest, user: AuthPayload): Promise<ChatResult> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured on the server');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
    const action: ChatAction = { type: 'none' };

    // بناء سياق المحادثة
    const history = Array.isArray(req.history) ? req.history.slice(-12) : [];
    const messages: any[] = [
      { role: 'system', content: this.buildSystemPrompt(user) },
      ...history.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: req.message },
    ];

    const tools = this.getToolDefinitions();

    // حلقة Function Calling
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.callOpenAI(apiKey, model, messages, tools);
      const choice = response?.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        throw new Error('No response from OpenAI API');
      }

      const toolCalls = assistantMessage.tool_calls;

      // إذا ما طلب أدوات، هذا هو الرد النهائي
      if (!toolCalls || toolCalls.length === 0) {
        return {
          reply: assistantMessage.content || 'عذراً، لم أتمكن من توليد رد.',
          action,
        };
      }

      // نضيف رسالة المساعد (اللي فيها طلبات الأدوات) للسياق
      messages.push(assistantMessage);

      // ننفذ كل الأدوات المطلوبة ونرجّع نتائجها
      for (const call of toolCalls) {
        let parsedArgs: any = {};
        try {
          parsedArgs = call.function?.arguments ? JSON.parse(call.function.arguments) : {};
        } catch {
          parsedArgs = {};
        }

        const toolResult = await this.executeTool(
          call.function?.name,
          parsedArgs,
          user,
          action
        );

        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          content: toolResult,
        });
      }
    }

    // إذا تجاوزنا الحد الأقصى للجولات، نطلب رداً نهائياً بدون أدوات
    const finalResponse = await this.callOpenAI(apiKey, model, messages, undefined);
    const finalContent = finalResponse?.choices?.[0]?.message?.content;
    return {
      reply: finalContent || 'عذراً، لم أتمكن من إكمال الإجابة.',
      action,
    };
  }

  /**
   * استدعاء OpenAI API
   */
  private static async callOpenAI(
    apiKey: string,
    model: string,
    messages: any[],
    tools?: any[]
  ): Promise<any> {
    try {
      const body: any = {
        model,
        messages,
        temperature: 0.4,
        max_tokens: 1800,
      };
      if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
      }

      const response = await axios.post(OPENAI_URL, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 30000,
      });

      return response.data;
    } catch (error: any) {
      const apiError =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Unknown OpenAI error';
      console.error('OpenAI API error:', apiError);
      throw new Error(`OpenAI API error: ${apiError}`);
    }
  }

  // ============ Helpers ============

  private static clampLimit(value: any): number {
    const n = parseInt(value, 10);
    if (isNaN(n) || n <= 0) return 10;
    return Math.min(n, 25);
  }

  /**
   * تقليص حقول المهام لتوفير التوكنز وحماية البيانات الحساسة
   */
  private static trimTasks(tasks: any[]): any[] {
    if (!Array.isArray(tasks)) return [];
    return tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status_name || t.status,
      priority: t.priority,
      deadline: t.deadline,
      is_overdue: t.is_overdue,
      assigned_to: t.assigned_to_name || t.assignee_name,
      order_id: t.order_id,
    }));
  }

  /**
   * JSON.stringify آمن مع تحويل BigInt إلى string
   */
  private static safeStringify(data: any): string {
    return JSON.stringify(data, (_key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    );
  }
}
