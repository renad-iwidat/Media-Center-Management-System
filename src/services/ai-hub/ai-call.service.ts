/**
 * AI Call Service
 * خدمة مشتركة لاستدعاء AI_MODEL و OpenAI
 * 
 * ملف مستقل لتجنب circular dependency بين:
 * - smart-transcription.service.ts
 * - transcript-correction.service.ts
 */

/**
 * Call OpenAI Chat API for text generation
 */
export async function callOpenAIChatAPI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
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
      max_tokens: 4000,
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
 */
export async function callAIWithFallback(prompt: string): Promise<string> {
  const aiModelUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
  
  // Try AI_MODEL first
  try {
    console.log(`\n🤖 [AI Call] Calling AI_MODEL: ${aiModelUrl}`);
    
    const response = await fetch(`${aiModelUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 2000,
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
