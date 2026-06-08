/**
 * AI Call Service
 * خدمة مشتركة لاستدعاء OpenAI API
 * 
 * ملف مستقل لتجنب circular dependency بين:
 * - smart-transcription.service.ts
 * - transcript-correction.service.ts
 * 
 * يختار الموديل تلقائياً حسب عدد التوكنات:
 * - نصوص قصيرة (< 10K tokens): gpt-4o (أسرع وأرخص)
 * - نصوص متوسطة (10K-30K tokens): gpt-4.1 مع 16K output
 * - نصوص طويلة (> 30K tokens): gpt-4.1 (1M token context, 32K max output)
 */

/**
 * Estimate token count for Arabic text (rough approximation)
 * الحرف العربي ≈ 2-3 tokens، نستخدم 2.5 كمتوسط
 */
function estimateTokenCount(text: string): number {
  // Arabic characters are roughly 2-3 tokens each
  // Latin characters are roughly 0.25 tokens each (4 chars per token)
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const otherChars = text.length - arabicChars;
  return Math.ceil(arabicChars * 2.5 + otherChars * 0.25);
}

/**
 * Choose the appropriate model and max_tokens based on input size
 * اختيار الموديل المناسب حسب حجم النص
 * 
 * - نصوص قصيرة (< 30K tokens): gpt-4o (أسرع وأرخص)
 * - نصوص طويلة (>= 30K tokens): gpt-4.1 (1M context, 32K output)
 */
function chooseModelConfig(prompt: string): { model: string; maxTokens: number } {
  const estimatedTokens = estimateTokenCount(prompt);
  
  // For long texts (transcripts from long videos), use gpt-4.1
  // gpt-4.1: 1,000,000 input tokens, 32,768 max output tokens
  if (estimatedTokens > 30000) {
    console.log(`📊 [AI Call] Large input detected (~${estimatedTokens} tokens) → using gpt-4.1`);
    return { model: 'gpt-4.1', maxTokens: 32000 };
  }
  
  // For medium texts, use gpt-4.1 with moderate output
  if (estimatedTokens > 10000) {
    console.log(`📊 [AI Call] Medium input detected (~${estimatedTokens} tokens) → using gpt-4.1`);
    return { model: 'gpt-4.1', maxTokens: 16000 };
  }
  
  // For short texts, gpt-4o is faster and cheaper
  console.log(`📊 [AI Call] Short input detected (~${estimatedTokens} tokens) → using gpt-4o`);
  return { model: 'gpt-4o', maxTokens: 4096 };
}

/**
 * Call OpenAI Chat API for text generation
 * يختار الموديل تلقائياً حسب حجم النص
 */
export async function callOpenAIChatAPI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const { model, maxTokens } = chooseModelConfig(prompt);

  console.log(`🤖 [AI Call] Using model: ${model}, max_tokens: ${maxTokens}`);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'أنت محرر صحفي محترف في قناة إخبارية عربية. تلتزم بالدقة المطلقة في النقل وتحترم سياسة التحرير. تنسب كل معلومة إلى مصدرها الواضح وتلتزم بالشكل المطلوب في كل مخرج.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return (data as any).choices?.[0]?.message?.content || '';
}

/**
 * Call AI_MODEL first, fallback to OpenAI if it fails
 * 
 * ⚠️ تم التحديث: يستخدم OpenAI دائماً مع اختيار الموديل حسب عدد التوكنات
 * - نصوص قصيرة (< 10K tokens): gpt-4o (أسرع وأرخص)
 * - نصوص متوسطة (10K-30K tokens): gpt-4.1 مع 16K output
 * - نصوص طويلة (> 30K tokens): gpt-4.1 مع 32K output
 */
export async function callAIWithFallback(prompt: string): Promise<string> {
  const estimatedTokens = estimateTokenCount(prompt);
  
  console.log(`\n🤖 [AI Call] Input ~${estimatedTokens} tokens — using OpenAI directly`);
  const result = await callOpenAIChatAPI(prompt);
  console.log(`✅ [AI Call] OpenAI responded successfully`);
  return result;
}
