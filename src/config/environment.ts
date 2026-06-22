import dotenv from 'dotenv';
import Joi from 'joi';

dotenv.config();

/**
 * Environment Configuration — مع validation عند الإقلاع
 * ════════════════════════════════════════════════════════════════
 * كل متغيرات البيئة المستخدمة في النظام تُعرّف وتُتحقّق هنا.
 * لو متغير إلزامي ناقص → التطبيق يوقف فوراً عند الإقلاع (fail fast)
 * بدل ما يقع لاحقاً وقت أول استخدام.
 */

const schema = Joi.object({
  // ── Server ────────────────────────────────────────────────
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(7845),

  // ── Database (إلزامي) ─────────────────────────────────────
  DATABASE_URL: Joi.string().uri({ scheme: ['postgresql', 'postgres'] }).required(),

  // ── Authentication ────────────────────────────────────────
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),

  // ── NewsDesk API (سحب الأخبار) ────────────────────────────
  NEWSDESK_API_URL: Joi.string().uri().default('https://newsdesk-api.liminal.ps'),

  // ── AI Model (تصنيف/تنظيف/STT) ────────────────────────────
  AI_MODEL: Joi.string().uri().optional(),
  AI_MODEL_NAME: Joi.string().default('Qwen/Qwen3-14B-AWQ'),
  AI_MODEL_API_KEY: Joi.string().default('not-needed'),
  AI_MODEL_TIMEOUT: Joi.number().integer().min(1000).default(120000),

  // ── OpenAI (TTS/STT) ──────────────────────────────────────
  OPENAI_API_KEY: Joi.string().optional(),

  // ── Scheduler / Pipeline ──────────────────────────────────
  ARTICLES_PER_SOURCE: Joi.number().integer().min(1).default(20),
  SCHEDULER_INTERVAL: Joi.number().integer().min(1).default(10),

  // ── Facebook Publishing (اختياري) ─────────────────────────
  FACEBOOK_PAGE_ID: Joi.string().allow('').default(''),
  FACEBOOK_ACCESS_TOKEN: Joi.string().allow('').default(''),
}).unknown(true); // نسمح بمتغيرات إضافية (streaming/STT لها ملف منفصل)

const { value: env, error } = schema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const details = error.details.map((d) => `  • ${d.message}`).join('\n');
  // fail fast — لا نشغّل التطبيق بإعدادات ناقصة/خاطئة
  throw new Error(`❌ فشل التحقق من متغيرات البيئة (environment):\n${details}`);
}

/**
 * الإعدادات بعد التحقق — typed ومضمونة القيم.
 * تبقى الأسماء كما هي للتوافق مع الكود الحالي.
 */
export const environment = {
  // Database
  DATABASE_URL: env.DATABASE_URL as string,

  // Server
  PORT: env.PORT as number,
  NODE_ENV: env.NODE_ENV as 'development' | 'production' | 'test',

  // Authentication
  JWT_SECRET: env.JWT_SECRET as string,
  JWT_EXPIRES_IN: env.JWT_EXPIRES_IN as string,

  // NewsDesk API
  NEWSDESK_API_URL: env.NEWSDESK_API_URL as string,

  // AI
  AI_MODEL: env.AI_MODEL as string | undefined,
  AI_MODEL_NAME: env.AI_MODEL_NAME as string,
  AI_MODEL_API_KEY: env.AI_MODEL_API_KEY as string,
  AI_MODEL_TIMEOUT: env.AI_MODEL_TIMEOUT as number,
  OPENAI_API_KEY: env.OPENAI_API_KEY as string | undefined,

  // Scheduler / Pipeline
  ARTICLES_PER_SOURCE: env.ARTICLES_PER_SOURCE as number,
  SCHEDULER_INTERVAL: env.SCHEDULER_INTERVAL as number,

  // Facebook Publishing
  FACEBOOK_PAGE_ID: env.FACEBOOK_PAGE_ID as string,
  FACEBOOK_ACCESS_TOKEN: env.FACEBOOK_ACCESS_TOKEN as string,
};
