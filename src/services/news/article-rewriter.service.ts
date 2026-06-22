/**
 * Article Rewriter Service
 * إعادة صياغة الأخبار — تعمل بالخلفية بعد الحفظ
 *
 * ════════════════════════════════════════════════════════════════
 * الأسلوب: Background Processing
 * ─────────────────────────────────────────────────────────────
 * 1. الأخبار تتحفظ فوراً بالنص الأصلي (fetch_status = 'fetched')
 * 2. هذه الخدمة تأخذ الأخبار اللي ما اتعالجت وتعيد صياغتها
 *    واحدة واحدة (أو 3 بالتوازي) وتحدّث الـ DB
 * 3. تُستدعى من الـ Scheduler بعد مرحلة الحفظ
 *
 * هيك الـ pipeline ما ينبلك والأخبار تتخزن فوراً.
 * ─────────────────────────────────────────────────────────────
 *
 * يستخدم AI_MODEL المحلي (vLLM)
 */

import { query } from '../../config/database';
import { SystemSettingsService } from '../database/system-settings.service';
import { callAIChat, estimateMaxTokensForText } from '../ai-hub/ai-chat.service';

// ════════════════════════════════════════════════════════════════════════════
// PROMPT — مختصر ومركّز (أقل tokens = أسرع response)
// ════════════════════════════════════════════════════════════════════════════

const REWRITER_PROMPT = `SYSTEM: محرر صحفي عربي. أعد صياغة الخبر بلغة صحفية نظيفة مع الحفاظ الكامل على المعنى والحقائق والأرقام والاقتباسات.

قواعد المصدر الإعلامي (مهم جداً):
1. احذف نهائياً اسم أي وكالة أو وسيلة إعلام من بداية ونهاية الخبر (مثل: وكالة وفا، وكالة سوا، وكالة معاً، الجزيرة، رويترز، فرانس برس، العربي الجديد، القدس العربي، وغيرها).
2. الأخبار العامة (بيانات رسمية، أحداث رياضية، قرارات حكومية، أحداث ميدانية عامة) تُنشر بدون ذكر مصدر السحب نهائياً — تُنسب فقط للجهة المصدرة (الوزارة، النادي، الحكومة...).
3. الأخبار الحصرية فقط (مقابلة خاصة أجرتها وسيلة إعلام معينة، تصريح حصري لقناة بعينها) تُنسب لمصدرها داخل متن الخبر (مثال: قال فلان في مقابلة مع صحيفة كذا).
4. لا تبدأ الخبر أبداً بعبارات مثل: "أفادت وكالة..." أو "ذكرت صحيفة..." أو "نقلت قناة..." — ابدأ مباشرة بالحدث.

أعد النص المصاغ فقط بدون شرح أو مقدمة.
USER:`;

// ════════════════════════════════════════════════════════════════════════════
// CONFIG
// ════════════════════════════════════════════════════════════════════════════

/** الحد الأدنى لطول النص لتطبيق إعادة الصياغة */
const MIN_CONTENT_LENGTH = 100;

/** عدد الأخبار اللي تتعالج بالتوازي في الخلفية */
const BACKGROUND_CONCURRENCY = 5;

/** حد أقصى للأخبار المعالجة بكل دورة — بدون حد (كل اللي ما اتعالجوا) */
const MAX_PER_CYCLE = 1000;

/**
 * تنظيف النص من الأحرف اللي تسبب مشاكل في vLLM
 */
function sanitize(text: string): string {
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
  /**
   * التحقق مما إذا كانت إعادة الصياغة مفعّلة
   */
  async isEnabled(): Promise<boolean> {
    return SystemSettingsService.getBoolean('rewriter_enabled', true);
  }

  /**
   * ═══════════════════════════════════════════════════════════════════
   * المعالجة بالخلفية — تُستدعى من الـ Scheduler
   * تأخذ أخبار لم تُعاد صياغتها بعد وتعالجها تدريجياً
   * ═══════════════════════════════════════════════════════════════════
   */
  async processUnrewrittenArticles(): Promise<{ processed: number; failed: number }> {
    const enabled = await this.isEnabled();
    if (!enabled) {
      return { processed: 0, failed: 0 };
    }

    // جلب أخبار لم تُعاد صياغتها بعد (is_rewritten = false + محتوى كافي)
    const articles = await query(
      `SELECT id, title, content FROM raw_data
       WHERE is_rewritten = false
         AND LENGTH(content) >= $1
         AND fetch_status IN ('fetched', 'processed', 'published')
       ORDER BY fetched_at DESC
       LIMIT $2`,
      [MIN_CONTENT_LENGTH, MAX_PER_CYCLE]
    );

    if (articles.rows.length === 0) {
      return { processed: 0, failed: 0 };
    }

    console.log(`\n✍️  [Rewriter Background] معالجة ${articles.rows.length} خبر (${BACKGROUND_CONCURRENCY} بالتوازي)...`);

    let processed = 0;
    let failed = 0;
    let currentIndex = 0;
    const total = articles.rows.length;
    const startTime = Date.now();

    const worker = async (): Promise<void> => {
      while (true) {
        const idx = currentIndex++;
        if (idx >= articles.rows.length) break;

        const article = articles.rows[idx];
        try {
          const rewritten = await this.rewriteOne(article.title, article.content);

          if (rewritten && rewritten !== article.content) {
            // تحديث المحتوى + تعليم كمعالج
            await query(
              `UPDATE raw_data SET content = $1, is_rewritten = true WHERE id = $2`,
              [rewritten, article.id]
            );
            // تحديث أيضاً في published_items إذا موجود
            await query(
              `UPDATE published_items SET content = $1 WHERE raw_data_id = $2`,
              [rewritten, article.id]
            );
            processed++;
          } else {
            // لم يتغير أو فشل — نعلمه كمعالج عشان ما يتكرر
            await query(
              `UPDATE raw_data SET is_rewritten = true WHERE id = $1`,
              [article.id]
            );
            processed++;
          }
        } catch (error: any) {
          failed++;
          // نعلمه كمعالج حتى لو فشل — عشان ما يتكرر كل دورة
          try {
            await query(`UPDATE raw_data SET is_rewritten = true WHERE id = $1`, [article.id]);
          } catch { /* تجاهل */ }
        }

        // Progress log كل 10 أخبار
        const done = processed + failed;
        if (done % 10 === 0 && done > 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (done / (Date.now() - startTime) * 60000).toFixed(1);
          console.log(`   📊 [Rewriter] ${done}/${total} (✅${processed} ❌${failed}) — ${elapsed}s — ${rate} خبر/دقيقة`);
        }
      }
    };

    // تشغيل workers بالتوازي
    const workers = Array.from(
      { length: Math.min(BACKGROUND_CONCURRENCY, articles.rows.length) },
      () => worker()
    );
    await Promise.all(workers);

    console.log(`   ✅ [Rewriter] انتهى — ✅${processed} | ❌${failed} | ⏱️ ${((Date.now() - startTime) / 1000).toFixed(1)}s`);
    return { processed, failed };
  }

  /**
   * إعادة صياغة نص واحد عبر الموديل
   * يرجع النص المُعاد صياغته أو null إذا فشل
   */
  private async rewriteOne(title: string, content: string): Promise<string | null> {
    // تقليم النص الطويل (أكثر من 4000 حرف → نأخذ أول 4000)
    const text = content.length > 4000 ? content.substring(0, 4000) : content;

    const cleanPrompt = `${REWRITER_PROMPT} ${sanitize(title)} ${sanitize(text)}`
      .replace(/\s{2,}/g, ' ')
      .trim();

    const result: string = await callAIChat(cleanPrompt, {
      system: 'أنت محرر صحفي عربي محترف. تعيد صياغة الأخبار بدقة مع الحفاظ الكامل على المعنى والحقائق.',
      maxTokens: estimateMaxTokensForText(text),
      temperature: 0.3,
      timeout: 120000,
    });

    if (!result || !result.trim()) return null;

    const final = result.trim();

    // فحص أمان
    if (final.length < content.length * 0.4 || final.length > content.length * 2.5) {
      return null; // مشبوه — نتجاهل
    }

    console.log(`   ✅ ${title.substring(0, 40)}... (${content.length}→${final.length})`);
    return final;
  }
}

export const articleRewriterService = new ArticleRewriterService();
