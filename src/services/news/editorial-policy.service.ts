/**
 * Editorial Policy Service
 * خدمة تطبيق سياسات التحرير على الأخبار عبر AI Model
 */

import { logAIUsage } from '../ai-hub/ai-usage-logger.service';
import { callAIChat, getChatCompletionsUrl } from '../ai-hub/ai-chat.service';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * تنظيف النص من الأحرف اللي بتسبب مشاكل بالـ JSON والـ vLLM
 * الـ vLLM backend ما بيقبل newlines بالـ prompt — لازم كل شي سطر واحد
 */
function sanitizeForJSON(text: string): string {
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

/**
 * القالب الافتراضي الموحد لجميع السياسات
 * Placeholders:
 *   {{editor_instructions}} — تعليمات المحرر
 *   {{injected_vars}}       — المتغيرات المحقونة (قوائم، قواميس، إلخ)
 *   {{text}}                — النص المراد معالجته
 *   {{output_schema}}       — شكل الـ JSON المطلوب
 */
const DEFAULT_PROMPT_TEMPLATE = `أنت محرر صحفي محترف . نفّذ التعليمات التالية بدقة على النص المعطى.

## التعليمات:
{{editor_instructions}}

## البيانات المرجعية:
{{injected_vars}}

## النص:
{{text}}

## صيغة الإخراج:
{{output_schema}}`;

/**
 * تحويل injected_vars لنص مقروء للبرومبت
 * نبعث الـ JSON كما هو عشان الموديل يفهمه بوضوح
 */
function formatInjectedVars(injectedVars: Record<string, any> | null): string {
  if (!injectedVars || Object.keys(injectedVars).length === 0) {
    return 'لا توجد بيانات مرجعية.';
  }
  return JSON.stringify(injectedVars, null, 2);
}

/**
 * تحويل output_schema لتعليمات واضحة للـ AI
 */
function formatOutputSchema(outputSchema: Record<string, any> | null): string {
  if (!outputSchema || Object.keys(outputSchema).length === 0) {
    return 'أعد النتيجة كنص عادي.';
  }
  return JSON.stringify(outputSchema, null, 2);
}

/**
 * بناء البرومت النهائي من القالب (prompt_template) أو القالب الافتراضي
 * يستبدل الـ placeholders بالقيم الفعلية:
 *   {{editor_instructions}} ← تعليمات المحرر
 *   {{injected_vars}}       ← المتغيرات المحقونة
 *   {{text}}                ← النص
 *   {{output_schema}}       ← شكل الـ JSON المطلوب
 */
function buildPrompt(
  editorInstructions: string,
  text: string,
  injectedVars: Record<string, any> | null,
  outputSchema: Record<string, any> | null,
  promptTemplate: string | null = null
): string {
  const template = promptTemplate && promptTemplate.trim()
    ? promptTemplate
    : DEFAULT_PROMPT_TEMPLATE;

  const prompt = template
    .replace(/\{\{editor_instructions\}\}/g, sanitizeForJSON(editorInstructions))
    .replace(/\{\{injected_vars\}\}/g, formatInjectedVars(injectedVars))
    .replace(/\{\{text\}\}/g, sanitizeForJSON(text))
    .replace(/\{\{output_schema\}\}/g, formatOutputSchema(outputSchema));

  return prompt.trim();
}

/**
 * استخراج قيمة حقل نصّي من JSON خام حتى لو كان مقطوعاً/ناقصاً.
 * يبدأ من `"field": "` ويقرأ القيمة حرفاً حرفاً مع احترام الـ escapes،
 * ويتوقف عند علامة الاقتباس غير المهرّبة أو نهاية النص (في حالة الانقطاع).
 * يُرجع null إذا لم يجد الحقل.
 */
function extractStringField(raw: string, field: string): string | null {
  const keyPattern = new RegExp(`"${field}"\\s*:\\s*"`);
  const match = keyPattern.exec(raw);
  if (!match) return null;

  let i = match.index + match[0].length;
  let out = '';
  while (i < raw.length) {
    const ch = raw[i];
    if (ch === '\\') {
      // معالجة الـ escape
      const next = raw[i + 1];
      switch (next) {
        case 'n': out += '\n'; break;
        case 't': out += '\t'; break;
        case 'r': out += '\r'; break;
        case '"': out += '"'; break;
        case '\\': out += '\\'; break;
        case '/': out += '/'; break;
        default: out += next ?? ''; break;
      }
      i += 2;
      continue;
    }
    if (ch === '"') {
      // نهاية القيمة (علامة اقتباس غير مهرّبة)
      return out;
    }
    out += ch;
    i++;
  }
  // وصلنا لنهاية النص بدون علامة إغلاق → القيمة مقطوعة، نرجّع المتوفّر
  return out;
}

/**
 * استخراج JSON من نتيجة الـ AI
 * بيحاول عدة طرق لاستخراج الـ JSON من الـ response
 * ويتأكد من أن الـ response يطابق الـ output_schema
 */
function extractJSON(
  text: string,
  outputSchema: Record<string, any> | null = null
): Record<string, any> {
  if (!text || !text.trim()) return {};
  const cleaned = text.trim();

  // محاولة 1: parse مباشر
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) {
      // التحقق من الـ schema إذا وُجد
      if (outputSchema && !validateSchema(parsed, outputSchema)) {
        console.warn('⚠️ JSON extracted but schema validation failed');
      }
      return parsed;
    }
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed);
        if (typeof inner === 'object' && inner !== null) {
          if (outputSchema && !validateSchema(inner, outputSchema)) {
            console.warn('⚠️ Inner JSON extracted but schema validation failed');
          }
          return inner;
        }
      } catch {}
    }
  } catch {}

  // محاولة 2: استخراج أول {} من النص
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (typeof p === 'object' && p !== null) {
        if (outputSchema && !validateSchema(p, outputSchema)) {
          console.warn('⚠️ First {} extracted but schema validation failed');
        }
        return p;
      }
    }
  } catch {}

  // محاولة 3: تنظيف escape sequences ثم استخراج {}
  try {
    const u = cleaned.replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\');
    const m = u.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (typeof p === 'object' && p !== null) {
        if (outputSchema && !validateSchema(p, outputSchema)) {
          console.warn('⚠️ Escaped {} extracted but schema validation failed');
        }
        return p;
      }
    }
  } catch {}

  // محاولة 3.5: استرجاع حقل نصّي من JSON مقطوع/ناقص (بسبب انقطاع التوليد)
  // لو الرد انقطع جوّا modified_text، الـ JSON بيصير ناقص؛ هون منستخرج
  // قيمة الحقل النصّي مباشرة بدل ما نخسرها ونرجع للنص الأصلي.
  try {
    const textFields = [
      'modified_text', 'modifiedText', 'rewritten_text', 'cleaned_text',
      'balanced_text', 'formatted_text', 'result_text', 'replaced_text',
      'new_text', 'edited_text', 'text', 'output', 'content',
    ];
    for (const field of textFields) {
      const recovered = extractStringField(cleaned, field);
      if (recovered && recovered.trim().length > 50) {
        return { [field]: recovered };
      }
    }
  } catch {}

  // محاولة 4: استخراج array
  try {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (Array.isArray(p)) {
        return { items: p };
      }
    }
  } catch {}

  // fallback: رجّع النص كـ modified_text
  return { modified_text: cleaned };
}

/**
 * التحقق من أن الـ JSON يطابق الـ output_schema
 */
function validateSchema(
  data: Record<string, any>,
  schema: Record<string, any>
): boolean {
  for (const [field, expectedType] of Object.entries(schema)) {
    if (!(field in data)) {
      console.warn(`Missing required field: ${field}`);
      return false;
    }

    const actualValue = data[field];
    const expected = String(expectedType).toLowerCase().trim();

    // التحقق من الـ type
    if (expected === 'string') {
      if (typeof actualValue !== 'string') {
        console.warn(`Field ${field} should be string, got ${typeof actualValue}`);
        return false;
      }
    } else if (expected === 'number' || expected.startsWith('number')) {
      if (typeof actualValue !== 'number') {
        console.warn(`Field ${field} should be number, got ${typeof actualValue}`);
        return false;
      }
    } else if (expected === 'boolean') {
      if (typeof actualValue !== 'boolean') {
        console.warn(`Field ${field} should be boolean, got ${typeof actualValue}`);
        return false;
      }
    } else if (expected === 'array') {
      if (!Array.isArray(actualValue)) {
        console.warn(`Field ${field} should be array, got ${typeof actualValue}`);
        return false;
      }
    } else if (expected.includes('|')) {
      // type union مثل "string or null"
      const allowedTypes = expected.split('|').map((t) => t.trim());
      const actualType = typeof actualValue;
      if (!allowedTypes.includes(actualType) && !allowedTypes.includes('null') && actualValue !== null) {
        console.warn(`Field ${field} should be one of ${allowedTypes}, got ${actualType}`);
        return false;
      }
    }
  }
  return true;
}

// ============================================================================
// UNIFIED OUTPUT SCHEMAS
// ============================================================================

/**
 * Schema موحد لسياسات التعديل (is_modifying = true)
 * كل سياسة تعديل لازم ترجع هالحقول
 */
const MODIFYING_OUTPUT_SCHEMA: Record<string, string> = {
  modified_text: 'string',
  changes: 'array',
  total_changes: 'number',
  notes: 'string',
};

/**
 * Schema موحد لسياسات الفحص (is_modifying = false)
 * كل سياسة فحص لازم ترجع هالحقول
 */
const INSPECTION_OUTPUT_SCHEMA: Record<string, string> = {
  status: 'string',
  issues: 'array',
  summary: 'string',
  details: 'object',
};

/**
 * اختيار الـ output schema المناسب:
 * - إذا السياسة عندها output_schema خاص بالداتابيس → نستخدمه
 * - إذا لا → نستخدم الموحد حسب is_modifying
 */
function resolveOutputSchema(
  policySchema: Record<string, any> | null,
  isModifying: boolean
): Record<string, any> {
  if (policySchema && Object.keys(policySchema).length > 0) {
    return policySchema;
  }
  return isModifying ? MODIFYING_OUTPUT_SCHEMA : INSPECTION_OUTPUT_SCHEMA;
}

// ============================================================================
// SERVICE
// ============================================================================

class EditorialPolicyService {
  /**
   * حساب max_tokens للـ completion بناءً على طول النص ونوع السياسة.
   *
   * سياسات التعديل (is_modifying) لازم ترجّع النص كامل داخل modified_text
   * إضافةً للـ JSON wrapper (notes/changes)، فبتحتاج توكنات أكثر من طول النص.
   * النص العربي ≈ 2.5 توكن/حرف → نحسب على هالأساس مع هامش أمان،
   * عشان ما ينقطع الرد ويصير JSON ناقص (اللي بيخلي النظام يحسبها "بدون تغيير").
   *
   * سياسات الفحص (is_modifying = false) بترجّع تقرير قصير فقط.
   * السقف الأقصى قابل للضبط عبر AI_MODEL_MAX_TOKENS (افتراضي 32000).
   */
  private calculateMaxTokens(textLength: number, isModifying: boolean): number {
    // سقف أقصى قابل للضبط من البيئة (الموديل بيتحمّل كونتكست كبير)
    const hardCap = Number(process.env.AI_MODEL_MAX_TOKENS) || 32000;

    if (!isModifying) {
      // فحص فقط — تقرير JSON قصير
      return Math.min(2048, hardCap);
    }

    // تعديل — لازم نعيد النص كامل + wrapper (notes/changes)
    // ~2.5 توكن للحرف العربي + هامش 2000 توكن للـ JSON والتغييرات
    const estimated = Math.ceil(textLength * 2.5) + 2000;

    // حد أدنى 4096، وحد أقصى = hardCap (افتراضي 32000)
    return Math.min(Math.max(estimated, 4096), hardCap);
  }

  /**
   * تطبيق سياسة تحريرية واحدة على نص
   *
   * @param policyName  اسم السياسة (للـ logging)
   * @param taskType    نوع المهمة (replace / rewrite / classify / ...)
   * @param editorInstructions  تعليمات المحرر من الداتابيس
   * @param text        النص المراد معالجته
   * @param injectedVars  متغيرات محقونة (مثل قوائم الكلمات المحظورة)
   * @param outputSchema  شكل الـ JSON المطلوب من الـ AI (إذا null يستخدم الموحد)
   * @param endpoint    الـ endpoint على الـ AI server (افتراضي: generate)
   * @param promptTemplate  قالب البرومبت (إذا null يستخدم الافتراضي)
   * @param isModifying  هل السياسة بتعدّل النص؟ (لاختيار الـ schema الموحد)
   */
  async applyPolicy(
    policyName: string,
    taskType: string,
    editorInstructions: string,
    text: string,
    injectedVars: Record<string, any> | null,
    outputSchema: Record<string, any> | null,
    endpoint: string = 'generate',
    promptTemplate: string | null = null,
    isModifying: boolean = true,
    userId?: number // إضافة رقم المستخدم
  ): Promise<{
    policyName: string;
    taskType: string;
    status: 'success' | 'error';
    modifiedText: string;
    result: Record<string, any>;
    rawResponse: string;
    executionTime: number;
    endpoint: string;
    hasChanges: boolean;
    error?: string;
  }> {
    const startTime = Date.now();
    const apiUrl = getChatCompletionsUrl();

    try {
      const resolvedSchema = resolveOutputSchema(outputSchema, isModifying);
      const prompt = buildPrompt(editorInstructions, text, injectedVars, resolvedSchema, promptTemplate);
      const maxTokens = this.calculateMaxTokens(text.length, isModifying);

      // === LOG: الريكويست الكامل ===
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📤 [${policyName}] REQUEST → ${apiUrl} (endpoint hint: ${endpoint})`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📤 [${policyName}] PROMPT:`);
      console.log(prompt);
      console.log(`${'='.repeat(80)}\n`);

      const responseText: string = await callAIChat(prompt, {
        system: 'أنت محرر صحفي محترف تطبّق سياسات التحرير بدقة وتعيد المخرجات بالصيغة المطلوبة.',
        maxTokens,
        temperature: 0.3,
        timeout: 300000,
      });

      const executionTime = Date.now() - startTime;

      // === LOG: الريسبونس الكامل ===
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📡 [${policyName}] RESPONSE (${executionTime}ms)`);
      console.log(`${'='.repeat(80)}`);
      console.log(responseText);
      console.log(`${'='.repeat(80)}\n`);

      const result = extractJSON(responseText, resolvedSchema);

      // النص المنظف (بعد sanitize) — نستخدمه للمقارنة العادلة
      const sanitizedOriginal = sanitizeForJSON(text);

      // استخراج النص المعدّل من الـ result
      const modifiedText: string =
        result.modified_text ||
        result.modifiedText ||
        result.text ||
        result.output ||
        result.content ||
        result.rewritten_text ||
        result.cleaned_text ||
        result.balanced_text ||
        result.formatted_text ||
        result.result_text ||
        result.replaced_text ||
        result.new_text ||
        result.edited_text ||
        (responseText && !responseText.startsWith('{') && !responseText.startsWith('[') ? responseText : null) ||
        text;

      // normalize للمقارنة العادلة — نشيل whitespace زايد ونعمل trim
      const normalizeForCompare = (s: string) => s.replace(/\s+/g, ' ').trim();
      const normalizedModified = normalizeForCompare(modifiedText);
      const normalizedOriginal = normalizeForCompare(text);
      const normalizedSanitized = normalizeForCompare(sanitizedOriginal);

      // المقارنة مع النص المنظف عشان نكتشف التغييرات الفعلية
      const hasRealChanges = normalizedModified !== normalizedOriginal && normalizedModified !== normalizedSanitized;

      console.log(`  📊 [${policyName}] مقارنة: modifiedText.length=${modifiedText.length}, text.length=${text.length}, sanitized.length=${sanitizedOriginal.length}`);
      console.log(`  📊 [${policyName}] hasRealChanges=${hasRealChanges}, normalized match original=${normalizedModified === normalizedOriginal}, normalized match sanitized=${normalizedModified === normalizedSanitized}`);

      // fallback ذكي: إذا ما لقينا النص بالحقول المعروفة، ندوّر على أطول string بالـ result
      let finalText = modifiedText;
      if (normalizeForCompare(finalText) === normalizedOriginal && Object.keys(result).length > 0) {
        let longestStr = '';
        for (const [_, value] of Object.entries(result)) {
          if (typeof value === 'string' && value.length > longestStr.length && normalizeForCompare(value) !== normalizedOriginal && normalizeForCompare(value) !== normalizedSanitized) {
            longestStr = value;
          }
        }
        if (longestStr.length > 50) {
          finalText = longestStr;
        }
      }

      // لو النص المعدّل مطابق للأصلي بس فيه modified_text مختلف عن الـ sanitized — نستخدمه
      if (normalizeForCompare(finalText) === normalizedOriginal && result.modified_text && normalizeForCompare(result.modified_text) !== normalizedSanitized) {
        finalText = result.modified_text;
      }

      // حساب hasChanges النهائي بالـ normalized comparison
      const normalizedFinal = normalizeForCompare(finalText);
      const finalHasChanges = normalizedFinal !== normalizedOriginal && normalizedFinal !== normalizedSanitized;

      console.log(`  📊 [${policyName}] finalHasChanges=${finalHasChanges}, finalText.length=${finalText.length}`);

      // تسجيل استخدام الذكاء الاصطناعي
      try {
        await logAIUsage({
          userIdentifier: userId ? String(userId) : 'unknown', // استخدام user_id مباشرة في user_identifier
          feature: 'text_tools',
          action: 'editorial_policy',
          endpoint: apiUrl,
          requestData: { policyName, taskType, textLength: text.length },
          responseStatus: 'success',
          responseData: { hasChanges: finalHasChanges },
          durationMs: executionTime,
        });
      } catch (logError) {
        console.error('❌ خطأ في تسجيل استخدام الذكاء الاصطناعي:', logError);
      }

      return {
        policyName,
        taskType,
        status: 'success',
        modifiedText: finalText,
        result,
        rawResponse: responseText,
        executionTime,
        endpoint: apiUrl,
        hasChanges: finalHasChanges,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error?.response?.data?.detail) {
        console.error(`❌ [${policyName}] detail:`, JSON.stringify(error.response.data.detail));
      }
      console.error(`❌ [${policyName}] error: ${error?.message || error}`);

      // تسجيل استخدام الذكاء الاصطناعي للأخطاء
      try {
        await logAIUsage({
          userIdentifier: userId ? String(userId) : 'unknown', // استخدام user_id مباشرة في user_identifier
          feature: 'text_tools',
          action: 'editorial_policy',
          endpoint: apiUrl,
          requestData: { policyName, taskType, textLength: text.length },
          responseStatus: 'error',
          responseData: { error: error?.message || 'خطأ غير معروف' },
          durationMs: executionTime,
        });
      } catch (logError) {
        console.error('❌ خطأ في تسجيل استخدام الذكاء الاصطناعي:', logError);
      }

      return {
        policyName,
        taskType,
        status: 'error',
        modifiedText: text,
        result: {},
        rawResponse: error?.response?.data?.error || error?.message || 'خطأ غير معروف',
        executionTime,
        endpoint: apiUrl,
        hasChanges: false,
        error: error?.message || 'خطأ في الاتصال بـ AI API',
      };
    }
  }
}

export const editorialPolicyService = new EditorialPolicyService();
