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
  categoryId: number;
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
   * تصنيف خبر واحد
   */
  async classifyArticle(title: string, content: string): Promise<ClassificationResult> {
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

      return {
        category,
        categoryId,
        confidence: true,
        rawResult,
      };
    } catch (error) {
      console.error('❌ خطأ في تصنيف الخبر:', error);
      
      // في حالة الخطأ، نرجع تصنيف افتراضي (محلي)
      return {
        category: 'غير مصنف',
        categoryId: 1,
        confidence: false,
        rawResult: 'خطأ في التصنيف',
      };
    }
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
