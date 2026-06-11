/**
 * Article Rewriter Service
 * إعادة صياغة الأخبار قبل التخزين في raw_data
 *
 * ════════════════════════════════════════════════════════════════
 * الهدف: إنتاج خبر بصياغة موحدة ونظيفة مع الحفاظ الكامل على
 * المعنى والمعلومات والحقائق الواردة في الخبر الأصلي.
 *
 * قواعد التعامل مع المصدر:
 * ─────────────────────────────────────────────────────────────
 * 1. حذف اسم المصدر من بداية أو نهاية الخبر (وفا، معاً، CNN، Reuters...)
 * 2. الأخبار العامة/البيانات الرسمية → إعادة صياغة بدون ذكر المصدر الإعلامي
 *    مع الإشارة للجهة الرسمية صاحبة البيان/التصريح عند الحاجة
 * 3. المعلومات/التصريحات/التقارير الحصرية → الحفاظ على نسبها
 *    إلى مصدرها داخل متن الخبر (وليس بدايته أو نهايته)
 * 4. يُطبَّق على جميع التصنيفات (سياسي، محلي، اقتصادي، رياضي...)
 * ─────────────────────────────────────────────────────────────
 *
 * يستخدم AI_MODEL المحلي (vLLM) — نفس الموديل المستخدم في التصنيف والتنظيف
 */

import axios from 'axios';
import { SystemSettingsService } from '../database/system-settings.service';

// ════════════════════════════════════════════════════════════════════════════
// PROMPT
// ════════════════════════════════════════════════════════════════════════════

const REWRITER_PROMPT = `SYSTEM: أنت محرر صحفي محترف في مركز إعلامي عربي. مهمتك إعادة صياغة الأخبار الواردة لإنتاج نص صحفي نظيف وموحّد الأسلوب.

التعليمات الإلزامية:

المحتوى:
- أعد صياغة الخبر لغوياً مع الحفاظ الكامل على المعنى والمعلومات والحقائق والأرقام.
- لا تُضف أي معلومة غير موجودة في النص الأصلي.
- لا تحذف أي معلومة جوهرية من الخبر.
- حافظ على جميع الاقتباسات والتصريحات المنسوبة لأشخاص كما هي.
- حافظ على الأسماء والمناصب والأرقام والتواريخ بدقة.

قواعد التعامل مع المصدر الإعلامي:
1. إذا ذُكر اسم وكالة أنباء أو وسيلة إعلام في بداية الخبر أو نهايته (مثل: وفا، معاً، رويترز، CNN، الجزيرة، وكالة الأناضول، أ ف ب، سما، القدس، شهاب، فلسطين اليوم، المركز الفلسطيني للإعلام، وغيرها) فاحذفه ولا تذكره.
2. إذا كان الخبر عاماً أو بياناً رسمياً أو خبراً متداولاً نشرته عدة وسائل إعلام فأعد صياغته بدون ذكر أي وسيلة إعلامية. اذكر فقط الجهة الرسمية صاحبة البيان أو التصريح عند الحاجة.
3. إذا كانت المعلومة أو التصريح أو المقابلة أو التقرير حصرياً لوسيلة إعلامية محددة فحافظ على نسبة المعلومة إلى مصدرها داخل متن الخبر وليس في بدايته أو نهايته. أمثلة:
   - "وقال المسؤول في تصريحات لشبكة CNN"
   - "وذكرت صحيفة هآرتس أن"
   - "وفي مقابلة أجرتها قناة الجزيرة صرّح"
4. الأخبار التي لا تحتوي على مصدر إعلامي محدد وكانت أخباراً عامة أو أحداثاً متداولة تُنشر بعد إعادة الصياغة بدون إضافة مصدر إعلامي.

الأسلوب:
- استخدم لغة عربية فصحى صحفية سليمة.
- حافظ على تسلسل الأفكار والفقرات.
- أنتج نصاً جاهزاً للنشر مباشرة.

المخرج:
- أعد النص المُعاد صياغته فقط بدون أي شرح أو تعليق أو عنوان.
- لا تبدأ بكلمة "الخبر:" أو "النص:" أو أي مقدمة.

USER:
أعد صياغة الخبر التالي:`;

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** الحد الأدنى لطول النص لتطبيق إعادة الصياغة (بالأحرف) */
const MIN_CONTENT_LENGTH_FOR_REWRITE = 100;

/** الحد الأقصى لطول النص لتطبيق إعادة الصياغة (بالأحرف) */
const MAX_CONTENT_LENGTH_FOR_REWRITE = 15000;

/** حجم الـ batch لإعادة الصياغة بالتوازي */
const REWRITE_BATCH_SIZE = 5;

/**
 * تنظيف النص من الأحرف التي تسبب مشاكل في vLLM
 */
function sanitizeForModel(text: string): string {
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

// ════════════════════════════════════════════════════════════════════════════
// SERVICE
// ════════════════════════════════════════════════════════════════════════════

class ArticleRewriterService {
  private readonly apiUrl: string;

  constructor() {
    const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
    this.apiUrl = `${baseUrl}/generate`;
  }

  /**
   * إعادة صياغة خبر واحد عبر AI_MODEL المحلي
   * مع retry تلقائي في حالة timeout
   *
   * @param title    عنوان الخبر
   * @param content  نص الخبر الكامل
   * @param sourceName اسم المصدر (للسياق)
   * @returns { title, content } المُعاد صياغتهما، أو الأصليين في حالة خطأ
   */
  async rewriteArticle(
    title: string,
    content: string,
    _sourceName?: string
  ): Promise<{ title: string; content: string }> {
    // لا نعيد صياغة نصوص قصيرة جداً
    if (!content || content.trim().length < MIN_CONTENT_LENGTH_FOR_REWRITE) {
      return { title, content };
    }

    // محاولتين: الأولى بالنص الكامل، الثانية (retry) بنص مقلّم إذا عمل timeout
    const maxRetries = 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // تحضير النص — في الـ retry نقلّم أكثر
        let textToRewrite = content;
        let maxTokens = 1500;

        if (content.length > MAX_CONTENT_LENGTH_FOR_REWRITE) {
          textToRewrite = content.substring(0, MAX_CONTENT_LENGTH_FOR_REWRITE);
        }

        // في الـ retry: نقلّم النص ونقلل tokens عشان يرد أسرع
        if (attempt > 0) {
          textToRewrite = textToRewrite.substring(0, Math.min(textToRewrite.length, 3000));
          maxTokens = 800;
          console.log(`   🔄 [إعادة صياغة] retry بنص مقلّم (${textToRewrite.length} حرف)...`);
        }

        // بناء الـ prompt وتنظيفه لتفادي 400 من vLLM
        const rawPrompt = `${REWRITER_PROMPT}\n${sanitizeForModel(title)}\n${sanitizeForModel(textToRewrite)}/no_think`;
        const cleanPrompt = rawPrompt.replace(/\n/g, ' ').replace(/\s{2,}/g, ' ').trim();

        const requestBody = {
          prompt: cleanPrompt,
          think: false,
          max_tokens: maxTokens,
          temperature: 0.3,
        };

        const response = await axios.post(this.apiUrl, requestBody, {
          timeout: 120000, // 120 ثانية
        });

        const rawData = response.data;

        // فحص خطأ من الـ AI server
        if (rawData.status === 'failed' || rawData.error) {
          const errorMsg = rawData.error || 'AI server returned failed status';
          console.error(`❌ [إعادة صياغة] خطأ من AI server:`, errorMsg);
          return { title, content };
        }

        // استخراج النص من الـ response
        const rewrittenContent: string =
          rawData.result ||
          rawData.text ||
          rawData.output ||
          rawData.response ||
          rawData.generated_text ||
          rawData.content ||
          (rawData.choices && rawData.choices[0]?.text) ||
          (rawData.choices && rawData.choices[0]?.message?.content) ||
          '';

        if (!rewrittenContent || !rewrittenContent.trim()) {
          console.warn(`⚠️ [إعادة صياغة] الـ AI رجّع نص فارغ — نستخدم الأصلي`);
          return { title, content };
        }

        const finalContent = rewrittenContent.trim();

        // فحص أمان: أقصر بكثير أو أطول بكثير → مشبوه
        if (finalContent.length < content.length * 0.4) {
          console.warn(`⚠️ [إعادة صياغة] قصير جداً (${finalContent.length} vs ${content.length}) — نستخدم الأصلي`);
          return { title, content };
        }
        if (finalContent.length > content.length * 2) {
          console.warn(`⚠️ [إعادة صياغة] طويل جداً (${finalContent.length} vs ${content.length}) — نستخدم الأصلي`);
          return { title, content };
        }

        console.log(`✅ [إعادة صياغة] تمت (${content.length} → ${finalContent.length} حرف)`);
        return { title, content: finalContent };

      } catch (error: any) {
        const isTimeout = error?.code === 'ECONNABORTED' || error?.message?.includes('timeout');

        if (isTimeout && attempt < maxRetries) {
          // timeout — نجرب مرة ثانية بنص أقصر
          console.warn(`⚠️ [إعادة صياغة] timeout — retry بنص مقلّم...`);
          continue;
        }

        console.error(`❌ [إعادة صياغة] خطأ:`, error?.message || error);
        return { title, content };
      }
    }

    return { title, content };
  }

  /**
   * إعادة صياغة مجموعة أخبار بالتوازي (batches)
   *
   * @param articles مصفوفة من الأخبار { title, content, sourceName }
   * @returns مصفوفة بنفس الترتيب مع النصوص المُعاد صياغتها
   */
  async rewriteBatch(
    articles: Array<{ title: string; content: string; sourceName?: string }>
  ): Promise<Array<{ title: string; content: string }>> {
    if (articles.length === 0) return [];

    const results: Array<{ title: string; content: string }> = [];

    for (let i = 0; i < articles.length; i += REWRITE_BATCH_SIZE) {
      const batch = articles.slice(i, i + REWRITE_BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(a => this.rewriteArticle(a.title, a.content, a.sourceName))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // fallback → النص الأصلي
          results.push({ title: batch[j].title, content: batch[j].content });
        }
      }

      // Delay بين الـ batches لتجنب الحمل على السيرفر
      if (i + REWRITE_BATCH_SIZE < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    return results;
  }

  /**
   * التحقق مما إذا كانت إعادة الصياغة مفعّلة
   * يُقرأ من system_settings (rewriter_enabled)
   */
  async isEnabled(): Promise<boolean> {
    return SystemSettingsService.getBoolean('rewriter_enabled', true);
  }
}

export const articleRewriterService = new ArticleRewriterService();
