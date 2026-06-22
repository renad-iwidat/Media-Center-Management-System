/**
 * AI Chat Service (OpenAI-compatible)
 * ════════════════════════════════════════════════════════════════
 * خدمة موحّدة لاستدعاء موديل الـ AI المحلي عبر واجهة متوافقة مع OpenAI.
 *
 * المكافئ بالـ TypeScript لمثال Python التالي:
 *
 *   from openai import OpenAI
 *   client = OpenAI(base_url="http://93.127.132.59:8080/v1", api_key="not-needed")
 *   resp = client.chat.completions.create(
 *       model="Qwen/Qwen3-14B-AWQ",
 *       messages=[
 *           {"role": "system", "content": "You are a helpful assistant."},
 *           {"role": "user", "content": "اكتب جملة ترحيب."},
 *       ],
 *       max_tokens=512,
 *       temperature=0.2,
 *   )
 *   print(resp.choices[0].message.content)
 *
 * الإعدادات تُقرأ من متغيرات البيئة:
 *   AI_MODEL          → الـ base URL (مثال: http://93.127.132.59:8080)
 *   AI_MODEL_NAME     → اسم الموديل  (مثال: Qwen/Qwen3-14B-AWQ)
 *   AI_MODEL_API_KEY  → مفتاح الـ API (الموديل المحلي لا يحتاجه → not-needed)
 *   AI_MODEL_TIMEOUT  → مهلة الطلب بالميلي ثانية (افتراضي 120000)
 */

import axios from 'axios';

// ════════════════════════════════════════════════════════════════════════════
// DEFAULTS
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_BASE_URL = 'http://93.127.132.59:8080';
const DEFAULT_MODEL_NAME = 'Qwen/Qwen3-14B-AWQ';
const DEFAULT_API_KEY = 'not-needed';
const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant.';
const DEFAULT_MAX_TOKENS = 800;
const DEFAULT_TEMPERATURE = 0.3;
const DEFAULT_TIMEOUT = 120000;

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  /** رسالة النظام (system prompt) — إذا لم تُمرّر تُستخدم القيمة الافتراضية */
  system?: string;
  /** الحد الأقصى لعدد التوكنات في المخرجات */
  maxTokens?: number;
  /** درجة العشوائية (0 = حتمي) */
  temperature?: number;
  /** مهلة الطلب بالميلي ثانية */
  timeout?: number;
  /** اسم موديل مختلف لهذا الطلب فقط */
  model?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: { role: string; content: string };
    text?: string;
  }>;
  error?: any;
}

// ════════════════════════════════════════════════════════════════════════════
// CONFIG HELPERS
// ════════════════════════════════════════════════════════════════════════════

/** الـ base URL بدون أي slash زائدة في النهاية */
function getBaseUrl(): string {
  return (process.env.AI_MODEL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

/** اسم الموديل المُستخدم */
export function getModelName(): string {
  return process.env.AI_MODEL_NAME || DEFAULT_MODEL_NAME;
}

/** مفتاح الـ API (الموديل المحلي لا يحتاجه فعلياً) */
function getApiKey(): string {
  return process.env.AI_MODEL_API_KEY || DEFAULT_API_KEY;
}

/**
 * رابط الـ chat completions المتوافق مع OpenAI.
 * يتعامل مع الـ base URL سواء انتهى بـ /v1 أو لا.
 */
export function getChatCompletionsUrl(): string {
  const base = getBaseUrl();
  return base.endsWith('/v1')
    ? `${base}/chat/completions`
    : `${base}/v1/chat/completions`;
}

function getTimeout(override?: number): number {
  if (typeof override === 'number') return override;
  const fromEnv = Number(process.env.AI_MODEL_TIMEOUT);
  return Number.isFinite(fromEnv) && fromEnv > 0 ? fromEnv : DEFAULT_TIMEOUT;
}

// ════════════════════════════════════════════════════════════════════════════
// CORE
// ════════════════════════════════════════════════════════════════════════════

/**
 * استدعاء الموديل برسائل (messages) جاهزة بصيغة OpenAI.
 * يُرجع نص المحتوى من أول choice.
 */
export async function callAIChatMessages(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {}
): Promise<string> {
  const url = getChatCompletionsUrl();
  const model = options.model || getModelName();
  const apiKey = getApiKey();

  const response = await axios.post<ChatCompletionResponse>(
    url,
    {
      model,
      messages,
      max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: getTimeout(options.timeout),
    }
  );

  const data = response.data;

  if (data?.error) {
    throw new Error(`AI Model error: ${JSON.stringify(data.error)}`);
  }

  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? choice?.text ?? '';
  return typeof content === 'string' ? content : '';
}

/**
 * استدعاء مبسّط: نص (prompt) واحد + رسالة نظام اختيارية.
 * هذا هو البديل المباشر عن استدعاءات `/generate` القديمة.
 */
export async function callAIChat(
  prompt: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: options.system || DEFAULT_SYSTEM_PROMPT },
    { role: 'user', content: prompt },
  ];
  return callAIChatMessages(messages, options);
}
