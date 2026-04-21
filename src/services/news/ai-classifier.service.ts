/**
 * AI Classifier Service
 * خدمة تصنيف الأخبار باستخدام AI
 */

import axios from 'axios';

/**
 * واجهة لنتيجة التصنيف من الـ API
 */
export interface AIClassificationResponse {
  id: string;
  task: string;
  status: string;
  result: string;
  error: string | null;
}

/**
 * واجهة لنتيجة التصنيف المعالجة
 */
export interface ClassificationResult {
  category: string;
  categoryId: number | null;
  confidence: boolean;
  rawResult: string;
}

/**
 * خريطة التصنيفات من الاسم إلى الـ ID
 */
const CATEGORY_MAP: Record<string, number> = {
  'سياسي': 11,
  'غذاء': 10,
  'بيئة': 9,
  'فن و ثقافة': 7,
  'علوم وتكنولوجيا': 6,
  'صحة': 5,
  'رياضة': 4,
  'اقتصاد': 3,
  'دولي': 2,
  'محلي': 1,
};

/**
 * فئة AI Classifier Service
 */
class AIClassifierService {
  private apiUrl: string;
  private systemPrompt: string;

  constructor() {
    const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
    this.apiUrl = `${baseUrl}/generate`;
    this.systemPrompt = `SYSTEM: أنت مصنف أخبار فلسطيني آلي صارم.
مهمتك تصنيف الأخبار وفق المنظور التحريري الفلسطيني وليس فقط الموضوع العام للخبر.

قواعد التصنيف:
1- إذا كان الخبر يتعلق بالشأن الفلسطيني الداخلي أو أحداث داخل فلسطين أو غزة أو الضفة أو القدس أو المؤسسات الفلسطينية أو العدوان على فلسطين أو تطورات محلية فلسطينية، فالأولوية تكون لتصنيفه: سياسة محلية.
2- حتى لو احتوى الخبر على عناصر صحية أو اقتصادية أو اجتماعية، إذا كان جوهره مرتبطاً بالوضع الداخلي الفلسطيني فيصنف محلي.
3- استخدم التصنيفات الأخرى فقط إذا كان الخبر موضوعياً ومتخصصاً بها وليس حدثاً فلسطينياً محلياً.

يجب أن يكون الرد كلمة واحدة فقط من القائمة التالية حصراً:
غذاء
بيئة
فن و ثقافة
علوم وتكنولوجيا
صحة
رياضة
اقتصاد
دولي
محلي
سياسي

ممنوع الشرح أو التحليل أو أي نص إضافي.

USER:
صنّف الخبر التالي وأرجع اسم التصنيف فقط:`;
  }

  /**
   * استخراج التصنيف من نتيجة الـ API
   */
  private extractCategory(result: string): string {
    // البحث عن التصنيف في النتيجة
    const categories = Object.keys(CATEGORY_MAP);
    
    for (const category of categories) {
      if (result.includes(category)) {
        return category;
      }
    }

    // إذا لم نجد تصنيف، نرجع محلي كقيمة افتراضية
    return 'غير مصنف';
  }

  /**
   * تصنيف خبر واحد مع retry mechanism
   */
  async classifyArticle(title: string, content: string, retryCount: number = 2): Promise<ClassificationResult> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const articleText = `${title}\n${content}`;
        
        // تنظيف الـ prompt من newlines لتفادي 400 من vLLM
        const rawPrompt = `${this.systemPrompt}\n${articleText}/no_think`;
        const cleanPrompt = rawPrompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

        const payload = {
          prompt: cleanPrompt,
          think: false,
          max_tokens: 200,
          temperature: 0,
        };

        const response = await axios.post<AIClassificationResponse>(
          this.apiUrl,
          payload,
          {
            timeout: 30000,
          }
        );

        const rawResult = response.data.result || '';
        const category = this.extractCategory(rawResult);
        const categoryId = CATEGORY_MAP[category] || 1;
        // confidence=true إذا الـ AI رجع تصنيف معروف، false إذا رجع "غير مصنف"
        const confidence = category !== 'غير مصنف';

        return {
          category,
          categoryId,
          confidence,
          rawResult,
        };
      } catch (error) {
        lastError = error as Error;
        
        // إذا كان خطأ اتصال (socket hang up, timeout, etc.) وعندنا محاولات متبقية → retry
        if (attempt < retryCount && this.isNetworkError(error)) {
          console.warn(`   ⚠️  محاولة ${attempt + 1}/${retryCount} فشلت (${(error as Error).message}) — إعادة المحاولة...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))); // exponential backoff
          continue;
        }
        
        // خطأ غير اتصال أو انتهت المحاولات → break
        break;
      }
    }

    // انتهت المحاولات أو خطأ غير اتصال → null
    console.error(`❌ فشل تصنيف الخبر بعد ${retryCount + 1} محاولات:`, lastError?.message || lastError);
    return {
      category: 'غير مصنف',
      categoryId: null, // null عشان يظهر بتاب "غير مصنف"
      confidence: false,
      rawResult: 'فشل التصنيف بعد عدة محاولات',
    };
  }

  /**
   * التحقق مما إذا كان الخطأ من نوع network/timeout
   */
  private isNetworkError(error: any): boolean {
    return (
      error?.isAxiosError === true &&
      (error?.code === 'ECONNRESET' ||
       error?.code === 'ECONNREFUSED' ||
       error?.code === 'ETIMEDOUT' ||
       error?.code === 'ESOCKETTIMEDOUT' ||
       error?.code === 'ECONNABORTED')
    );
  }

  /**
   * تصنيف مجموعة من الأخبار
   */
  async classifyArticles(
    articles: Array<{ title: string; content: string }>
  ): Promise<ClassificationResult[]> {
    const results = await Promise.all(
      articles.map((article) =>
        this.classifyArticle(article.title, article.content)
      )
    );

    return results;
  }
}

// تصدير instance واحد من الخدمة
export const aiClassifierService = new AIClassifierService();
