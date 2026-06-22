/**
 * AI Classifier Service
 * خدمة تصنيف الأخبار باستخدام AI
 */

import { callAIChat } from '../ai-hub/ai-chat.service';

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
 * خريطة التصنيفات من الاسم العربي إلى الـ ID
 * (تطابق جدول categories الحالي بالداتابيس)
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
 * تحويل slug تصنيف من الـ API إلى category_id المحلي
 * يبحث بجدول categories بالـ slug — إذا ما لقى يرجع null
 * (الخبر يتخزن بـ category_slug ويبقى category_id = null لحد ما يتصنف)
 */
export async function mapApiCategoryToLocalId(apiSlug: string | undefined | null): Promise<number | null> {
  if (!apiSlug) return null;
  
  try {
    const { CategoryService } = await import('../database/database.service');
    const category = await CategoryService.getBySlug(apiSlug);
    if (category) return category.id;
  } catch {
    // تجاهل — ما لقى
  }
  
  return null;
}

/**
 * فئة AI Classifier Service
 */
class AIClassifierService {
  private systemPrompt: string;

  constructor() {
    this.systemPrompt = `SYSTEM: أنت مصنف أخبار فلسطيني آلي صارم.
مهمتك تصنيف الأخبار وفق المنظور التحريري الفلسطيني وليس فقط الموضوع العام للخبر.

قواعد التصنيف:
1- سياسي: أخبار سياسية وعسكرية والعدوان على فلسطين والاحتلال والمقاومة والصراع الفلسطيني الإسرائيلي والقضايا السياسية الفلسطينية والدولية المتعلقة بفلسطين.
2- محلي: أخبار محلية فلسطينية عامة (اجتماعية، ثقافية، إنسانية، تنموية) بدون بعد سياسي أو عسكري مباشر.
3- دولي: أخبار دولية وعالمية بدون علاقة مباشرة بفلسطين.
4- استخدم التصنيفات الأخرى (اقتصاد، صحة، رياضة، إلخ) فقط إذا كان الخبر متخصصاً بها بشكل واضح.

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
    // تنظيف النتيجة من المسافات الزائدة والأحرف الخاصة
    const cleanResult = result.trim().toLowerCase();
    
    // البحث عن التصنيف في النتيجة
    const categories = Object.keys(CATEGORY_MAP);
    
    for (const category of categories) {
      if (cleanResult.includes(category.toLowerCase())) {
        return category;
      }
    }

    // fallback
    console.warn(`⚠️  لم يتم العثور على تصنيف معروف في النتيجة: "${result}"`);
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
        
        // تنظيف الـ prompt من newlines
        const rawPrompt = `${this.systemPrompt}\n${articleText}`;
        const cleanPrompt = rawPrompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

        const rawResult = await callAIChat(cleanPrompt, {
          maxTokens: 200,
          temperature: 0,
          timeout: 30000,
        });

        const category = this.extractCategory(rawResult || '');
        const categoryId = CATEGORY_MAP[category] || null;
        
        // confidence=true إذا الـ AI رجع تصنيف معروف، false إذا رجع "غير مصنف"
        const confidence = category !== 'غير مصنف';

        // logging
        if (categoryId) {
          console.log(`   ✅ تصنيف: ${category} (ID: ${categoryId})`);
        } else {
          console.warn(`   ⚠️  تصنيف غير معروف: "${category}" — سيتم استخدام محلي (ID: 1)`);
        }

        return {
          category,
          categoryId: categoryId || 1, // fallback إلى 1 (محلي) إذا كان null
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
