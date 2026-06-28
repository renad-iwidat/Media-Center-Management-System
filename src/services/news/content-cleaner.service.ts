/**
 * Content Cleaner Service
 * تنظيف محتوى الأخبار من العناصر الترويجية قبل النشر الأوتوماتيكي
 *
 * يُطبَّق على جميع الأخبار التي تصل للمسار الأوتوماتيكي
 * (محلي / دولي / سياسي كلها editorial ولا تصل هنا أصلاً)
 */

import { callAIChat, estimateMaxTokensForText } from '../ai-hub/ai-chat.service';

/**
 * البرومبت الثابت لتنظيف نصوص RSS
 */
const CLEANING_PROMPT = `أنت أداة تنظيف نصوص. مهمتك حذف عناصر محددة فقط من النص، دون تغيير أي حرف من باقي الخبر.

⚠️ قاعدة صارمة: ممنوع منعًا باتًا تعديل أو إعادة صياغة أو إعادة ترتيب أي كلمة أو جملة. لا تغيّر الكلمات، ولا علامات الترقيم، ولا تسلسل الفقرات. النص يبقى حرفيًا كما هو ما عدا الحذف المطلوب أدناه.

احذف فقط هذه العناصر إن وُجدت:
1. اسم وكالة الأنباء / وسيلة الإعلام عندما يظهر كـ وسم (label) أو إسناد للمصدر (attribution) في بداية الخبر أو نهايته فقط (مثل: وفا، سوا، معاً، الجزيرة، العربي الجديد، رويترز، فرانس برس، القدس العربي). لا تحذفه إذا ورد داخل صلب الخبر كجزء من المعنى.
2. الروابط (http، https، www، أي رابط لموقع أو منصة).
3. الهاشتاغات (أي كلمة تبدأ بـ #).
4. الإيموجي والرموز الزخرفية فقط (الرموز التعبيرية والزخارف وأحرف التحكم غير المرئية). لا تحذف علامات الترقيم العادية ولا علامات التنصيص ولا أي رموز ضمن سياق تقني.

قواعد مهمة:
- لا تحذف الإسناد الصحفي داخل صلب الخبر (مثل: "قال فلان في مقابلة مع صحيفة كذا") — هذا جزء من المحتوى ويبقى كما هو.
- لا تحذف أي اقتباسات أو أسماء أشخاص أو أرقام أو معلومات من الخبر.
- لا تضف أي كلمة من عندك، ولا أي تعليق أو شرح.
- إذا أدى حذف عنصر إلى كسر الجملة نحويًا، اترك الفراغ كما هو أو احذف العنصر فقط — ولا تُعِد تركيب الجملة أو صياغتها لتصحيحها.
- إذا لم يوجد أي عنصر يحتاج حذفًا، أعد النص كما هو حرفيًا دون أي تغيير.

أعد النص بعد الحذف فقط، بدون أي شرح أو تعليق.

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

      console.log(`🧹 [تنظيف] الخبر ${articleId} — إرسال للـ AI...`);

      const cleanedText: string = await callAIChat(prompt, {
        system: 'أنت أداة حذف نصوص دقيقة. تحذف فقط اسم المصدر/الوكالة والروابط والهاشتاغات والرموز غير الصالحة، دون تغيير أي حرف آخر من النص ودون إعادة صياغة.',
        maxTokens: estimateMaxTokensForText(content),
        temperature: 0,
        timeout: 60000,
      });

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
