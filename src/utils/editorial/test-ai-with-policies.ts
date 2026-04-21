/**
 * Test AI with Editorial Policies
 * اختبار خدمة AI مع سياسات التحرير من قاعدة البيانات
 * يطبع البرومت الكامل والاوتبوت
 */

import axios from 'axios';
import * as db from '../../config/database';

// ============================================================================
// TYPES
// ============================================================================

interface EditorialPolicy {
  id: number;
  name: string;
  description: string;
  task_type: string;
  editor_instructions: string;
  prompt_template: string;
  injected_vars: Record<string, any> | null;
  output_schema: Record<string, any> | null;
  is_active: boolean;
}

interface TestArticle {
  title: string;
  content: string;
}

interface PolicyTestResult {
  policyId: number;
  policyName: string;
  taskType: string;
  prompt: string;
  response: string;
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * تنظيف النص من الأحرف اللي بتسبب مشاكل
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
 * تحويل الـ output_schema لمثال JSON
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
        example[key] = null;
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
 * بناء البرومت النهائي
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

  // إضافة المتغيرات المحقونة
  if (injectedVars && Object.keys(injectedVars).length > 0) {
    prompt += '\n\n--- المتغيرات المحقونة ---\n';
    for (const [key, value] of Object.entries(injectedVars)) {
      if (Array.isArray(value)) {
        prompt += `${key}: ${value.join(', ')}\n`;
      } else if (typeof value === 'object' && value !== null) {
        for (const [subKey, subValue] of Object.entries(value)) {
          if (Array.isArray(subValue)) {
            prompt += `${subKey}: ${(subValue as string[]).join(', ')}\n`;
          } else if (typeof subValue === 'string') {
            prompt += `${subKey}: ${subValue}\n`;
          }
        }
      } else {
        prompt += `${key}: ${value}\n`;
      }
    }
  }

  // إضافة النص
  prompt += `\n\n--- النص المراد معالجته ---\n${cleanText}`;

  // إضافة schema الاوتبوت
  if (outputSchema && Object.keys(outputSchema).length > 0) {
    const exampleStr = JSON.stringify(schemaToExample(outputSchema), null, 2);
    prompt += `\n\n--- صيغة الاوتبوت المطلوبة (JSON فقط) ---\n${exampleStr}`;
  }

  return prompt;
}

// ============================================================================
// DATABASE
// ============================================================================

/**
 * الاتصال بقاعدة البيانات وجلب السياسات
 */
async function fetchEditorialPolicies(): Promise<EditorialPolicy[]> {
  console.log('\n📚 جاري جلب سياسات التحرير من قاعدة البيانات...\n');

  const query = `
    SELECT 
      id, name, description, task_type, editor_instructions, 
      prompt_template, injected_vars, output_schema, is_active
    FROM editorial_policies
    WHERE is_active = true
    ORDER BY id ASC
  `;

  const result = await db.query(query);
  const policies = result.rows as EditorialPolicy[];

  console.log(`✅ تم جلب ${policies.length} سياسة تحريرية نشطة\n`);

  return policies;
}

// ============================================================================
// AI API CALLS
// ============================================================================

/**
 * إرسال البرومت للـ AI وجلب الاوتبوت
 */
async function callAIModel(
  prompt: string,
  taskType: string,
  textLength: number
): Promise<{ response: string; executionTime: number }> {
  const startTime = Date.now();
  const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
  const apiUrl = `${baseUrl}/generate`;

  // حساب max_tokens بناءً على نوع المهمة وطول النص
  const textTasks = ['rewrite', 'replace', 'remove', 'cleanup', 'formatting', 'balance', 'disclaimer'];
  const maxTokens = textTasks.includes(taskType)
    ? Math.max(2048, Math.min(Math.ceil(textLength / 2) + 500, 8192))
    : 1024;

  try {
    const response = await axios.post(
      apiUrl,
      {
        prompt: sanitizeForJSON(prompt),
        think: false,
        max_tokens: maxTokens,
        temperature: 0.3,
      },
      { timeout: 120000 }
    );

    const executionTime = Date.now() - startTime;
    const responseText = response.data.result || response.data.text || response.data.output || '';

    return { response: responseText, executionTime };
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    const errorMsg = error?.response?.data?.detail || error?.message || 'خطأ غير معروف';
    throw new Error(`خطأ في استدعاء AI API: ${errorMsg}`);
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

/**
 * تنفيذ اختبار سياسة واحدة
 */
async function testSinglePolicy(
  policy: EditorialPolicy,
  article: TestArticle
): Promise<PolicyTestResult> {
  console.log(`\n${'='.repeat(100)}`);
  console.log(`🧪 اختبار السياسة: ${policy.name} (ID: ${policy.id})`);
  console.log(`📋 النوع: ${policy.task_type}`);
  console.log(`📝 الوصف: ${policy.description}`);
  console.log(`${'='.repeat(100)}\n`);

  try {
    // بناء البرومت
    const prompt = buildPrompt(
      policy.editor_instructions,
      article.content,
      policy.injected_vars,
      policy.output_schema
    );

    console.log(`📤 البرومت المرسل للـ AI:\n`);
    console.log(`${'─'.repeat(100)}`);
    console.log(prompt);
    console.log(`${'─'.repeat(100)}\n`);
    console.log(`📊 إحصائيات البرومت:`);
    console.log(`   - الطول: ${prompt.length} حرف`);
    console.log(`   - عدد الأسطر: ${prompt.split('\n').length}`);
    console.log(`\n`);

    // استدعاء AI
    console.log(`🚀 جاري إرسال الطلب للـ AI Model...\n`);
    const { response, executionTime } = await callAIModel(
      prompt,
      policy.task_type,
      article.content.length
    );

    console.log(`📡 الاوتبوت من الـ AI:\n`);
    console.log(`${'─'.repeat(100)}`);
    console.log(response || '(لا يوجد اوتبوت)');
    console.log(`${'─'.repeat(100)}\n`);
    console.log(`⏱️  وقت التنفيذ: ${executionTime}ms\n`);

    return {
      policyId: policy.id,
      policyName: policy.name,
      taskType: policy.task_type,
      prompt,
      response,
      executionTime,
      status: 'success',
    };
  } catch (error: any) {
    console.error(`❌ خطأ: ${error.message}\n`);

    return {
      policyId: policy.id,
      policyName: policy.name,
      taskType: policy.task_type,
      prompt: '',
      response: '',
      executionTime: 0,
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * تنفيذ جميع الاختبارات
 */
async function runAllTests(
  policies: EditorialPolicy[],
  article: TestArticle,
  limitPolicies?: number
): Promise<PolicyTestResult[]> {
  const results: PolicyTestResult[] = [];
  const policiesToTest = limitPolicies ? policies.slice(0, limitPolicies) : policies;

  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█ اختبار AI مع سياسات التحرير`);
  console.log(`█ عدد السياسات: ${policiesToTest.length}`);
  console.log(`█ الخبر: ${article.title}`);
  console.log(`█ طول المحتوى: ${article.content.length} حرف`);
  console.log(`${'█'.repeat(100)}\n`);

  for (const policy of policiesToTest) {
    const result = await testSinglePolicy(policy, article);
    results.push(result);
  }

  return results;
}

// ============================================================================
// SUMMARY & REPORTING
// ============================================================================

/**
 * طباعة ملخص النتائج
 */
function printSummary(results: PolicyTestResult[]): void {
  console.log(`\n${'█'.repeat(100)}`);
  console.log(`█ ملخص النتائج`);
  console.log(`${'█'.repeat(100)}\n`);

  const successful = results.filter((r) => r.status === 'success').length;
  const failed = results.filter((r) => r.status === 'error').length;
  const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);
  const avgTime = results.length > 0 ? Math.round(totalTime / results.length) : 0;

  console.log(`✅ نجح: ${successful}/${results.length}`);
  console.log(`❌ فشل: ${failed}/${results.length}`);
  console.log(`⏱️  إجمالي الوقت: ${totalTime}ms`);
  console.log(`⏱️  متوسط الوقت: ${avgTime}ms\n`);

  console.log(`📋 تفاصيل كل سياسة:\n`);
  results.forEach((result, index) => {
    const status = result.status === 'success' ? '✅' : '❌';
    console.log(`${index + 1}. ${status} ${result.policyName} (${result.taskType})`);
    console.log(`   - الوقت: ${result.executionTime}ms`);
    if (result.error) {
      console.log(`   - الخطأ: ${result.error}`);
    }
    console.log();
  });
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // اختبار الاتصال
    console.log('🔗 اختبار الاتصال بقاعدة البيانات...\n');
    await db.testConnection();
    console.log();

    // جلب السياسات
    const policies = await fetchEditorialPolicies();

    if (policies.length === 0) {
      console.error('❌ لم يتم العثور على سياسات تحريرية نشطة');
      process.exit(1);
    }

    // خبر تجريبي
    const testArticle: TestArticle = {
      title: 'قوات الاحتلال تشن غارات على غزة',
      content: `
        شنت قوات الاحتلال الإسرائيلي غارات جوية مكثفة على قطاع غزة اليوم الأربعاء، 
        استهدفت عدة مناطق سكنية وتجارية. وأسفرت الغارات عن استشهاد عدد من المدنيين 
        وإصابة عشرات آخرين. وقال الناطق باسم الدفاع المدني في غزة إن الغارات استهدفت 
        مباني سكنية في حي الشجاعية وحي الزيتون. وأضاف أن فرق الإنقاذ تعمل على انتشال 
        الجثث من تحت الأنقاض. وأشار إلى أن البنية التحتية تعرضت لأضرار جسيمة.
      `,
    };

    // تنفيذ الاختبارات (اختبر جميع السياسات)
    const results = await runAllTests(policies, testArticle);

    // طباعة الملخص
    printSummary(results);

    console.log(`\n✅ انتهى الاختبار بنجاح\n`);
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
    process.exit(1);
  }
}

// تشغيل البرنامج
main().catch(console.error);
