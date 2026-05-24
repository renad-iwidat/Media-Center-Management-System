/**
 * AI Call Service
 * خدمة مشتركة لاستدعاء AI_MODEL و OpenAI
 * 
 * ملف مستقل لتجنب circular dependency بين:
 * - smart-transcription.service.ts
 * - transcript-correction.service.ts
 * 
 * يستخدم gpt-4.1 (1M token context, 32K max output) لدعم النصوص الطويلة
 * مثل تفريغ فيديوهات ساعة أو ساعتين
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
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call AI_MODEL first, fallback to OpenAI if it fails
 * 
 * للنصوص الطويلة (فيديو ساعة+): يتخطى AI_MODEL ويروح مباشرة على OpenAI gpt-4.1
 * لأن AI_MODEL المحلي ما بيتحمل نصوص كبيرة
 */
export async function callAIWithFallback(prompt: string): Promise<string> {
  const aiModelUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
  const estimatedTokens = estimateTokenCount(prompt);
  
  // For large inputs, skip AI_MODEL entirely — it can't handle them
  if (estimatedTokens > 15000) {
    console.log(`\n🤖 [AI Call] Large input (~${estimatedTokens} tokens) — skipping AI_MODEL, using OpenAI directly`);
    const result = await callOpenAIChatAPI(prompt);
    console.log(`✅ [AI Call] OpenAI responded successfully`);
    return result;
  }
  
  // Try AI_MODEL first for smaller inputs
  try {
    console.log(`\n🤖 [AI Call] Calling AI_MODEL: ${aiModelUrl} (~${estimatedTokens} tokens)`);
    
    const response = await fetch(`${aiModelUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI_MODEL returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response is valid
    if (data.result && data.result.length > 100) {
      console.log(`✅ [AI Call] AI_MODEL responded successfully`);
      return data.result;
    } else {
      throw new Error('AI_MODEL response too short or invalid');
    }
  } catch (error: any) {
    console.log(`⚠️ [AI Call] AI_MODEL failed: ${error.message}`);
    console.log(`🔄 [AI Call] Falling back to OpenAI...`);
    
    // Fallback to OpenAI
    try {
      const result = await callOpenAIChatAPI(prompt);
      console.log(`✅ [AI Call] OpenAI fallback responded successfully`);
      return result;
    } catch (openaiError: any) {
      console.error(`❌ [AI Call] OpenAI fallback also failed: ${openaiError.message}`);
      throw new Error(`Both AI_MODEL and OpenAI failed: ${error.message} / ${openaiError.message}`);
    }
  }
}
