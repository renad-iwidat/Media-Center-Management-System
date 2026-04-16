/**
 * Editorial Policy Service
 * خدمة تطبيق سياسات التحرير على الأخبار عبر AI Model
 */

import axios from 'axios';

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
// SERVICE
// ============================================================================

class EditorialPolicyService {
  /**
   * حساب max_tokens للـ completion
   * الموديل بيقبل حتى 5000 token كـ prompt، والـ response حده 3000
   */
  private calculateMaxTokens(): number {
    return 1000;
  }

  /**
   * تطبيق سياسة تحريرية واحدة على نص
   *
   * @param policyName  اسم السياسة (للـ logging)
   * @param taskType    نوع المهمة (replace / rewrite / classify / ...)
   * @param editorInstructions  تعليمات المحرر من الداتابيس
   * @param text        النص المراد معالجته
   * @param injectedVars  متغيرات محقونة (مثل قوائم الكلمات المحظورة)
   * @param outputSchema  شكل الـ JSON المطلوب من الـ AI
   * @param endpoint    الـ endpoint على الـ AI server (افتراضي: generate)
   */
  async applyPolicy(
    policyName: string,
    taskType: string,
    editorInstructions: string,
    text: string,
    injectedVars: Record<string, any> | null,
    outputSchema: Record<string, any> | null,
    endpoint: string = 'generate',
    promptTemplate: string | null = null
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
    const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
    const apiUrl = `${baseUrl}/${endpoint}`;

    try {
      const prompt = buildPrompt(editorInstructions, text, injectedVars, outputSchema, promptTemplate);
      const maxTokens = this.calculateMaxTokens();

      const requestBody = { prompt, think: false, max_tokens: maxTokens, temperature: 0.3 };

      // === LOG: الريكويست الكامل ===
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📤 [${policyName}] REQUEST → ${apiUrl}`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📤 [${policyName}] FULL REQUEST BODY:`);
      console.log(JSON.stringify(requestBody, null, 2));
      console.log(`${'='.repeat(80)}\n`);

      const response = await axios.post(apiUrl, requestBody, { timeout: 120000 });

      const executionTime = Date.now() - startTime;
      const rawData = response.data;

      // === LOG: الريسبونس الكامل ===
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📡 [${policyName}] RESPONSE (${executionTime}ms)`);
      console.log(`${'='.repeat(80)}`);
      console.log(`📡 [${policyName}] FULL RESPONSE:`);
      console.log(JSON.stringify(rawData, null, 2));
      console.log(`${'='.repeat(80)}\n`);

      // فحص إذا الـ AI server رجّع خطأ داخل الـ response body
      if (rawData.status === 'failed' || rawData.error) {
        const errorMsg = rawData.error || 'AI server returned failed status';
        console.error(`❌ [${policyName}] AI server error:`, errorMsg);
        throw new Error(`AI server error: ${errorMsg}`);
      }

      // استخراج النص من الـ response
      const responseText: string =
        rawData.result ||
        rawData.text ||
        rawData.output ||
        rawData.response ||
        rawData.generated_text ||
        rawData.content ||
        (rawData.choices && rawData.choices[0]?.text) ||
        (rawData.choices && rawData.choices[0]?.message?.content) ||
        (typeof rawData === 'string' ? rawData : '');

      const result = extractJSON(responseText, outputSchema);

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

      // المقارنة مع النص المنظف عشان نكتشف التغييرات الفعلية
      const hasRealChanges = modifiedText !== text && modifiedText !== sanitizedOriginal;

      // fallback ذكي: إذا ما لقينا النص بالحقول المعروفة، ندوّر على أطول string بالـ result
      let finalText = modifiedText;
      if (finalText === text && Object.keys(result).length > 0) {
        let longestStr = '';
        for (const [_, value] of Object.entries(result)) {
          if (typeof value === 'string' && value.length > longestStr.length && value !== text && value !== sanitizedOriginal) {
            longestStr = value;
          }
        }
        if (longestStr.length > 50) {
          finalText = longestStr;
        }
      }

      // لو النص المعدّل مطابق للأصلي بس فيه modified_text مختلف عن الـ sanitized — نستخدمه
      if (finalText === text && result.modified_text && result.modified_text !== sanitizedOriginal) {
        finalText = result.modified_text;
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
        hasChanges: finalText !== text && finalText !== sanitizedOriginal,
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;

      if (error?.response?.data?.detail) {
        console.error(`❌ [${policyName}] detail:`, JSON.stringify(error.response.data.detail));
      }
      console.error(`❌ [${policyName}] error: ${error?.message || error}`);

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
