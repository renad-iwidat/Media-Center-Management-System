/**
 * Content Formatter
 * تنظيف وتنسيق المحتوى للنشر على المواقع الخارجية
 *
 * مسؤوليتان:
 * 1. sanitize — إزالة إيموجي وأحرف خاصة وجمل ترويجية
 * 2. formatAsHtml — تحويل النص لفقرات HTML منسقة
 */

// ── Emoji Regex Patterns ─────────────────────────────────────────────────────

const EMOJI_PATTERNS: RegExp[] = [
  /[\u{1F600}-\u{1F64F}]/gu,  // Emoticons
  /[\u{1F300}-\u{1F5FF}]/gu,  // Misc Symbols
  /[\u{1F680}-\u{1F6FF}]/gu,  // Transport
  /[\u{1F1E0}-\u{1F1FF}]/gu,  // Flags
  /[\u{2600}-\u{26FF}]/gu,    // Misc symbols
  /[\u{2700}-\u{27BF}]/gu,    // Dingbats
  /[\u{FE00}-\u{FE0F}]/gu,    // Variation Selectors
  /[\u{1F900}-\u{1F9FF}]/gu,  // Supplemental
  /[\u{1FA00}-\u{1FA6F}]/gu,  // Chess symbols
  /[\u{1FA70}-\u{1FAFF}]/gu,  // Symbols Extended
  /[\u{200D}]/gu,              // Zero Width Joiner
];

// ── Promo Patterns (جمل ترويجية) ────────────────────────────────────────────

const PROMO_PATTERNS: RegExp[] = [
  /تابعونا\s*(على|عبر|في)?\s*[^\.\n]*/gi,
  /اشتركو?ا?\s*(في|على|بـ)?\s*[^\.\n]*/gi,
  /للمزيد\s*(تابعو|زوروا|اضغطوا)?\s*[^\.\n]*/gi,
  /اقرأ\/ي?\s*أيضا?ً?\s*[^\.\n]*/gi,
  /تغطية\s*متواصلة\s*[^\.\n]*/gi,
  /انضم\s*(إلى|الى)?\s*(قناتنا|مجموعتنا)?\s*[^\.\n]*/gi,
  /للاشتراك\s*[^\.\n]*/gi,
  /رابط\s*(الخبر|المقال|القناة|التلغرام|التيليجرام)\s*[^\.\n]*/gi,
  /المصدر\s*:\s*(تليغرام|تيليجرام|فيسبوك|تويتر|إنستغرام|واتساب)\s*[^\.\n]*/gi,
  /(قناة|قناتنا|حسابنا|صفحتنا)\s*(على|في|بـ)?\s*(تليغرام|تيليجرام|فيسبوك|تويتر|إنستغرام|واتساب|يوتيوب)[^\.\n]*/gi,
];

// ══════════════════════════════════════════════════════════════════════════════
// Public API
// ══════════════════════════════════════════════════════════════════════════════

/**
 * تنظيف النص من الإيموجي والأحرف الخاصة
 * يُطبق على العنوان والمحتوى قبل الإرسال
 */
export function sanitizeForExternal(text: string): string {
  if (!text) return text;

  let cleaned = text;

  // إزالة الإيموجي
  for (const pattern of EMOJI_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // إزالة النجمات وتوحيد علامات التنصيص
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/[""'']/g, '"');

  return cleaned;
}

/**
 * تنظيف المحتوى من الروابط والهاشتاغات والجمل الترويجية
 * يُستخدم كـ fallback بدون AI
 */
export function removePromoContent(content: string): string {
  if (!content) return content;

  let cleaned = content;

  // حذف الروابط
  cleaned = cleaned.replace(/https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi, '');
  cleaned = cleaned.replace(/www\.[^\s<>"{}|\\^`\[\]]+/gi, '');

  // حذف الهاشتاغات
  cleaned = cleaned.replace(/#[\u0600-\u06FFa-zA-Z0-9_]+/g, '');

  // حذف الجمل الترويجية
  for (const pattern of PROMO_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // تنظيف المسافات الزائدة
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/\s{2,}/g, ' ');

  return cleaned.trim();
}

/**
 * تنسيق المحتوى كـ HTML مرتب بفقرات <p>
 * يحوّل النص العادي لفقرات منسقة ومقروءة
 */
export function formatAsHtml(content: string): string {
  if (!content) return content;

  let text = content.trim();

  // لو المحتوى أصلاً فيه <p> — تنظيف وإرجاع
  if (/<p[\s>]/i.test(text)) {
    return cleanExistingHtml(text);
  }

  // تحويل <br> لأسطر جديدة
  text = text.replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '\n\n');
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // إزالة تاجات HTML الهيكلية مع الحفاظ على المحتوى
  text = text.replace(/<\/?(div|span|section|article|header|footer|main|aside)[^>]*>/gi, '\n');
  text = text.replace(/<[^>]+>/g, '');

  // تقسيم لفقرات
  const paragraphs = splitIntoParagraphs(text);

  // لف كل فقرة بـ <p>
  return paragraphs
    .map(p => `<p>${p.replace(/\s+/g, ' ').trim()}</p>`)
    .join('\n');
}

/**
 * pipeline كامل: تنظيف + تنسيق
 * يُستخدم لتجهيز المحتوى النهائي قبل الإرسال
 */
export function prepareContentForPublish(content: string): string {
  const sanitized = sanitizeForExternal(content);
  return formatAsHtml(sanitized);
}

/**
 * تنظيف العنوان فقط (بدون تنسيق HTML)
 */
export function prepareTitleForPublish(title: string): string {
  return sanitizeForExternal(title).replace(/\s+/g, ' ').trim();
}

// ══════════════════════════════════════════════════════════════════════════════
// Private Helpers
// ══════════════════════════════════════════════════════════════════════════════

function cleanExistingHtml(html: string): string {
  let text = html;
  text = text.replace(/<p>\s*<\/p>/gi, '');
  text = text.replace(/(<p[^>]*>)\s+/gi, '$1');
  text = text.replace(/\s+(<\/p>)/gi, '$1');
  return text;
}

function splitIntoParagraphs(text: string): string[] {
  // تقسيم حسب الأسطر الفاضية (فقرات طبيعية)
  let paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  // لو فقرة واحدة بس — نجرب التقسيم بسطر واحد
  if (paragraphs.length <= 1 && text.includes('\n')) {
    paragraphs = text
      .split(/\n/)
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }

  // لو لسا فقرة وحدة طويلة (+200 حرف) — نقسم كل 2-3 جمل
  if (paragraphs.length === 1 && paragraphs[0].length > 200) {
    const sentences = paragraphs[0].split(/(?<=[.!?؟])\s+/);
    if (sentences.length > 3) {
      const chunks: string[] = [];
      for (let i = 0; i < sentences.length; i += 3) {
        chunks.push(sentences.slice(i, i + 3).join(' '));
      }
      return chunks;
    }
  }

  return paragraphs;
}
