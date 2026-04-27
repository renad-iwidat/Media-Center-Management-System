/**
 * Content Cleaner Service
 * تنظيف محتوى الأخبار من العناصر الترويجية قبل النشر الأوتوماتيكي
 *
 * يُطبَّق على جميع الأخبار التي تصل للمسار الأوتوماتيكي
 * (محلي / دولي / سياسي كلها editorial ولا تصل هنا أصلاً)
 */

import axios from 'axios';

/**
 * البرومبت الثابت لتنظيف نصوص RSS
 */
const CLEANING_PROMPT = `أنت محرر صحفي محترف. مهمتك تنظيف النص ليصبح خبرًا صحفيًا جاهزًا للنشر.

نفّذ التعليمات التالية بدقة:
- احذف أي جمل ترويجية أو توجيهية مثل: "تغطية متواصلة..." أو "تابعونا..." أو "اقرأ/ي أيضًا..." أو أي دعوة للمتابعة أو الاشتراك أو زيارة منصات أخرى
- احذف أسماء القنوات أو المنصات إذا جاءت بصيغة ترويجية (مثل: تليغرام، فيسبوك، موقع...)
- احذف الروابط، الهاشتاغات (#)، والرموز غير الصحفية
- احذف أي أجزاء ليست من صلب الخبر (مثل: فواصل دعائية أو عناوين جانبية غير ضرورية)
- لا تحذف الإسناد الصحفي (مثل: قال، صرّح، أعلنت...)
- حافظ على: المحتوى الصحفي بالكامل، الاقتباسات، الأسماء، الأرقام، تسلسل الفقرات
- لا تعيد صياغة الخبر، فقط نظّفه

الناتج يجب أن يكون خبرًا نظيفًا بدون أي عناصر ترويجية أو روابط أو توجيه للقارئ.

أعد النص المنظف فقط بدون أي شرح أو تعليق.

النص:`;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * تنظيف النص من الأحرف التي تسبب مشاكل في vLLM
 */
function sanitizeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\uFFF9-\uFFFB]/g, '')
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ============================================================================
// SERVICE
// ============================================================================

class ContentCleanerService {
  private readonly apiUrl: string;

  constructor() {
    const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
    this.apiUrl = `${baseUrl}/generate`;
  }

  /**
   * تنظيف نص الخبر من العناصر الترويجية عبر AI
   *
   * @param content   النص الأصلي
   * @param articleId معرّف الخبر (للـ logging)
   * @returns النص المنظف، أو النص الأصلي في حالة الخطأ
   */
  async cleanContent(content: string, articleId: number): Promise<string> {
    if (!content || !content.trim()) return content;

    try {
      const sanitizedContent = sanitizeText(content);
      const prompt = `${sanitizeText(CLEANING_PROMPT)} ${sanitizedContent}`;

      const requestBody = {
        prompt,
        think: false,
        max_tokens:900,
        temperature: 0,
      };

      console.log(`🧹 [تنظيف] الخبر ${articleId} — إرسال للـ AI...`);

      const response = await axios.post(this.apiUrl, requestBody, {
        timeout: 60000,
      });

      const rawData = response.data;

      // فحص خطأ من الـ AI server
      if (rawData.status === 'failed' || rawData.error) {
        const errorMsg = rawData.error || 'AI server returned failed status';
        console.error(`❌ [تنظيف] خطأ من AI server للخبر ${articleId}:`, errorMsg);
        return content; // fallback للنص الأصلي
      }

      // استخراج النص من الـ response
      const cleanedText: string =
        rawData.result ||
        rawData.text ||
        rawData.output ||
        rawData.response ||
        rawData.generated_text ||
        rawData.content ||
        (rawData.choices && rawData.choices[0]?.text) ||
        (rawData.choices && rawData.choices[0]?.message?.content) ||
        '';

      if (!cleanedText || !cleanedText.trim()) {
        console.warn(`⚠️ [تنظيف] الخبر ${articleId} — الـ AI رجّع نص فارغ، نستخدم الأصلي`);
        return content;
      }

      // إذا النص المنظف أقصر بكثير من الأصلي (أكثر من 70% أقصر) → مشبوه، نستخدم الأصلي
      if (cleanedText.length < content.length * 0.3) {
        console.warn(
          `⚠️ [تنظيف] الخبر ${articleId} — النص المنظف قصير جداً (${cleanedText.length} vs ${content.length})، نستخدم الأصلي`
        );
        return content;
      }

      console.log(
        `✅ [تنظيف] الخبر ${articleId} — تم التنظيف (${content.length} → ${cleanedText.length} حرف)`
      );
      return cleanedText.trim();
    } catch (error: any) {
      console.error(`❌ [تنظيف] خطأ في تنظيف الخبر ${articleId}:`, error?.message || error);
      return content; // fallback للنص الأصلي دائماً
    }
  }
}

export const contentCleanerService = new ContentCleanerService();
