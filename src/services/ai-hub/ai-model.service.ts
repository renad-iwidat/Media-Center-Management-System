/**
 * AI Model Service
 * Handles communication with external AI model API
 * Used by ChatInterface and other AI-powered features
 */

interface AIModelRequest {
  prompt: string;
  think?: boolean;
  max_tokens?: number;
  temperature?: number;
}

interface AIModelResponse {
  id: string;
  task: string;
  status: 'pending' | 'completed' | 'failed';
  result?: string;
  error?: string;
}

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
    const aiModelUrl = process.env.AI_MODEL;
    
    if (!aiModelUrl) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const payload: AIModelRequest = {
      prompt,
      think: options?.think ?? false,
      max_tokens: options?.max_tokens ?? 800,
      temperature: options?.temperature ?? 0.3,
    };

    console.log(`\n🔄 [${new Date().toISOString()}] Calling AI Model`);
    console.log(`🌐 URL: ${aiModelUrl}/generate`);
    console.log(`📤 Payload:`, JSON.stringify(payload, null, 2));

    const startTime = Date.now();
    const response = await fetch(`${aiModelUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const duration = Date.now() - startTime;

    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      throw new Error(`AI Model API error: ${response.status} ${response.statusText}`);
    }

    const data: AIModelResponse = await response.json();

    console.log(`📥 Response Data:`, {
      id: data.id,
      task: data.task,
      status: data.status,
      resultLength: data.result?.length || 0,
      hasError: !!data.error,
    });

    // Check for errors in response
    if (data.error) {
      throw new Error(`AI Model error: ${data.error}`);
    }

    // Return the result
    if (data.result) {
      console.log(`✅ AI Model returned result (${data.result.length} characters)`);
      return data.result;
    }

    throw new Error('No result returned from AI model');
  } catch (error) {
    console.error('❌ AI Model Service Error:', error);
    throw error;
  }
}

/**
 * Stream AI response (for future implementation)
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
    const aiModelUrl = process.env.AI_MODEL;
    
    if (!aiModelUrl) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const payload: AIModelRequest = {
      prompt,
      think: options?.think ?? false,
      max_tokens: options?.max_tokens ?? 800,
      temperature: options?.temperature ?? 0.3,
    };

    const response = await fetch(`${aiModelUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`AI Model API error: ${response.status} ${response.statusText}`);
    }

    const data: AIModelResponse = await response.json();

    if (data.error) {
      throw new Error(`AI Model error: ${data.error}`);
    }

    if (data.result) {
      yield data.result;
    }
  } catch (error) {
    console.error('AI Model Stream Error:', error);
    throw error;
  }
}
