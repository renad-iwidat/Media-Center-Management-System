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
 * تحويل الـ output_schema من الداتابيس لمثال JSON واقعي
 * بيساعد الـ AI يفهم الشكل المطلوب
 */
function schemaToExample(schema: Record<string, any>): Record<string, any> {
  const example: Record<string, any> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();
      if (lower === 'string') {
        example[key] = '...';
      } else if (lower === 'number' || lower.startsWith('number')) {
        example[key] = 0;
      } else if (lower === 'boolean') {
        example[key] = true;
      } else if (lower === 'array') {
        example[key] = [];
      } else if (lower === 'string or null') {
        example[key] = '... or null';
      } else if (lower.includes('|')) {
        example[key] = value.split('|').map((o: string) => o.trim()).join(' or ');
      } else {
        example[key] = value;
      }
    } else if (typeof value === 'object' && value !== null) {
      example[key] = schemaToExample(value);
    } else {
      example[key] = value;
    }
  }
  return example;
}

/**
 * بناء البرومت النهائي من 4 أقسام:
 * 1. editor_instructions  2. injected_vars  3. النص  4. output_schema
 */
function buildPrompt(
  editorInstructions: string,
  text: string,
  injectedVars: Record<string, any> | null,
  outputSchema: Record<string, any> | null
): string {
  const cleanInstructions = sanitizeForJSON(editorInstructions);
  const cleanText = sanitizeForJSON(text);

  let prompt = cleanInstructions;

  // إضافة المتغيرات المحقونة (injected_vars) إذا وُجدت
  if (injectedVars && Object.keys(injectedVars).length > 0) {
    prompt += ' --- المتغيرات ---';
    for (const [key, value] of Object.entries(injectedVars)) {
      if (Array.isArray(value)) {
        // array عادي — كل عنصر بسطر منفصل مرقّم
        prompt += ` [${key}]:`;
        value.forEach((item: any, i: number) => {
          prompt += ` (${i + 1}) ${item}`;
        });
      } else if (typeof value === 'object' && value !== null) {
        prompt += ` [${key}]:`;
        for (const [subKey, subValue] of Object.entries(value)) {
          if (Array.isArray(subValue)) {
            // array داخل object — مثل forbidden_terms.titles
            prompt += ` ${subKey}: ${(subValue as string[]).join(' | ')}`;
          } else if (typeof subValue === 'string') {
            // key-value pair — مثل replace_map أو approved_disclaimers
            prompt += ` "${subKey}" → "${subValue}" ;`;
          }
        }
      } else {
        prompt += ` ${key}: ${value}`;
      }
    }
  }

  // إضافة النص المراد معالجته
  prompt += ` النص: ${cleanText}`;

  // إضافة صيغة الاوتبوت المطلوبة
  if (outputSchema && Object.keys(outputSchema).length > 0) {
    const exampleStr = JSON.stringify(schemaToExample(outputSchema));
    prompt += ` أعد الناتج بصيغة JSON فقط بدون أي شرح أو نص إضافي وبالشكل التالي: ${exampleStr}`;
  }

  return prompt.replace(/\s{2,}/g, ' ').trim();
}

/**
 * استخراج JSON من نتيجة الـ AI
 * بيحاول عدة طرق لاستخراج الـ JSON من الـ response
 */
function extractJSON(text: string): Record<string, any> {
  if (!text || !text.trim()) return {};
  const cleaned = text.trim();

  // محاولة 1: parse مباشر
  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed === 'object' && parsed !== null) return parsed;
    if (typeof parsed === 'string') {
      try {
        const inner = JSON.parse(parsed);
        if (typeof inner === 'object' && inner !== null) return inner;
      } catch {}
    }
  } catch {}

  // محاولة 2: استخراج أول {} من النص
  try {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (typeof p === 'object' && p !== null) return p;
    }
  } catch {}

  // محاولة 3: تنظيف escape sequences ثم استخراج {}
  try {
    const u = cleaned.replace(/\\"/g, '"').replace(/\\n/g, ' ').replace(/\\\\/g, '\\');
    const m = u.match(/\{[\s\S]*\}/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (typeof p === 'object' && p !== null) return p;
    }
  } catch {}

  // محاولة 4: استخراج array
  try {
    const m = cleaned.match(/\[[\s\S]*\]/);
    if (m) {
      const p = JSON.parse(m[0]);
      if (Array.isArray(p)) return { items: p };
    }
  } catch {}

  // fallback: رجّع النص كـ modified_text
  return { modified_text: cleaned };
}

// ============================================================================
// SERVICE
// ============================================================================

class EditorialPolicyService {
  /**
   * حساب max_tokens بناءً على نوع المهمة وطول النص
   * السياسات اللي بتعدّل النص تحتاج tokens أكثر
   */
  private calculateMaxTokens(taskType: string, textLength: number): number {
    const textTasks = ['rewrite', 'replace', 'remove', 'cleanup', 'formatting', 'balance', 'disclaimer'];
    if (textTasks.includes(taskType)) {
      // النص العربي بياخد tokens أكثر — نحسب بناءً على طول النص الكامل + هامش للـ JSON
      return Math.max(4096, Math.min(Math.ceil(textLength * 1.5) + 1000, 16384));
    }
    return 2048;
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
    endpoint: string = 'generate'
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
      const prompt = buildPrompt(editorInstructions, text, injectedVars, outputSchema);
      const maxTokens = this.calculateMaxTokens(taskType, text.length);

      // تقدير عدد الـ tokens (النص العربي تقريباً 1 token لكل 2-3 أحرف)
      const estimatedPromptTokens = Math.ceil(prompt.length / 2);
      const totalEstimatedTokens = estimatedPromptTokens + maxTokens;

      console.log(`📤 [${policyName}] → ${apiUrl}`);
      console.log(`📤 [${policyName}] task: ${taskType} | max_tokens: ${maxTokens} | prompt: ${prompt.length} chars (~${estimatedPromptTokens} tokens)`);
      console.log(`📤 [${policyName}] estimated total tokens (prompt + completion): ~${totalEstimatedTokens}`);

      const response = await axios.post(
        apiUrl,
        {
          prompt,
          think: false,
          max_tokens: maxTokens,
          temperature: 0.3,
        },
        { timeout: 120000 }
      );

      const executionTime = Date.now() - startTime;
      const rawData = response.data;

      console.log(`📡 [${policyName}] response in ${executionTime}ms`);
      console.log(`📡 [${policyName}] rawData keys:`, Object.keys(rawData));
      console.log(`📡 [${policyName}] rawData:`, JSON.stringify(rawData).substring(0, 500));

      // فحص إذا الـ AI server رجّع خطأ داخل الـ response body
      if (rawData.status === 'failed' || rawData.error) {
        const errorMsg = rawData.error || 'AI server returned failed status';
        console.error(`❌ [${policyName}] AI server error:`, errorMsg);
        throw new Error(`AI server error: ${errorMsg}`);
      }

      // استخراج النص من الـ response (بيختلف حسب الـ AI server)
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

      console.log(`📡 [${policyName}] responseText (first 300):`, responseText?.substring(0, 300) || '(empty)');

      const result = extractJSON(responseText);
      console.log(`📡 [${policyName}] extractJSON keys:`, Object.keys(result));

      // استخراج النص المعدّل من الـ result
      // بنحاول كل الأسماء الممكنة اللي الـ AI ممكن يستخدمها للنص المعدّل
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

      console.log(`📡 [${policyName}] modifiedText === originalText?`, modifiedText === text);
      if (modifiedText === text) {
        console.warn(`⚠️ [${policyName}] النص ما تغيّر! result keys:`, Object.keys(result), '| result:', JSON.stringify(result).substring(0, 500));
      }

      // fallback ذكي: إذا ما لقينا النص بالحقول المعروفة، ندوّر على أطول string بالـ result
      let finalText = modifiedText;
      if (finalText === text && Object.keys(result).length > 0) {
        let longestStr = '';
        for (const [key, value] of Object.entries(result)) {
          if (typeof value === 'string' && value.length > longestStr.length && value !== text) {
            longestStr = value;
          }
        }
        if (longestStr.length > 50) {
          console.log(`📡 [${policyName}] fallback: استخدمنا أطول string بالـ result (${longestStr.length} chars)`);
          finalText = longestStr;
        }
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
        hasChanges: finalText !== text,
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
