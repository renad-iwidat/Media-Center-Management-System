/**
 * AI Model Service
 * Handles communication with the local AI model via an OpenAI-compatible API
 * Used by ChatInterface and other AI-powered features
 *
 * ════════════════════════════════════════════════════════════════
 * يستخدم واجهة /v1/chat/completions المتوافقة مع OpenAI.
 * الإعدادات (الـ URL، اسم الموديل، المفتاح) تُدار في ai-chat.service.ts
 * عبر متغيرات البيئة: AI_MODEL, AI_MODEL_NAME, AI_MODEL_API_KEY.
 */

import { callAIChat, getChatCompletionsUrl, getModelName } from './ai-chat.service';

/**
 * Send a prompt to the AI model and get the result
 */
export async function generateAIResponse(
  prompt: string,
  options?: {
    think?: boolean;
    max_tokens?: number;
    temperature?: number;
  }
): Promise<string> {
  try {
    if (!process.env.AI_MODEL) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const maxTokens = options?.max_tokens ?? 800;
    const temperature = options?.temperature ?? 0.3;

    console.log(`\n🔄 [${new Date().toISOString()}] Calling AI Model`);
    console.log(`🌐 URL: ${getChatCompletionsUrl()}`);
    console.log(`🤖 Model: ${getModelName()}`);
    console.log(`📤 max_tokens: ${maxTokens}, temperature: ${temperature}`);

    const startTime = Date.now();
    const result = await callAIChat(prompt, { maxTokens, temperature });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Response Time: ${duration}ms`);

    if (!result || !result.trim()) {
      throw new Error('No result returned from AI model');
    }

    console.log(`✅ AI Model returned result (${result.length} characters)`);
    return result;
  } catch (error) {
    console.error('❌ AI Model Service Error:', error);
    throw error;
  }
}

/**
 * Stream AI response (for future implementation)
 * حالياً يرجّع النتيجة كاملة كـ chunk واحد عبر نفس الواجهة المتوافقة مع OpenAI
 */
export async function* streamAIResponse(
  prompt: string,
  options?: {
    think?: boolean;
    max_tokens?: number;
    temperature?: number;
  }
): AsyncGenerator<string> {
  try {
    if (!process.env.AI_MODEL) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const result = await callAIChat(prompt, {
      maxTokens: options?.max_tokens ?? 800,
      temperature: options?.temperature ?? 0.3,
    });

    if (result) {
      yield result;
    }
  } catch (error) {
    console.error('AI Model Stream Error:', error);
    throw error;
  }
}
