/**
 * Chat Controller
 * Handles chat requests from the AI HUB frontend
 */

import { Request, Response } from 'express';
import { generateAIResponse } from '../../services/ai-hub/ai-model.service';
import {
  getClientIdentifier,
  isRateLimited,
  incrementRequestCount,
  getRemainingRequests,
  getResetTime,
} from '../../services/ai-hub/rate-limiter.service';

interface ChatRequest {
  prompt: string;
  think?: boolean;
  max_tokens?: number;
  temperature?: number;
}

interface ChatResponse {
  success: boolean;
  result?: string;
  error?: string;
  remaining?: number;
  resetTime?: number;
}

/**
 * POST /api/ai-hub/chat/generate
 * Generate AI response for a given prompt
 */
export async function generateChatResponse(
  req: Request<{}, {}, ChatRequest>,
  res: Response<ChatResponse>
): Promise<void> {
  try {
    const { prompt, think, max_tokens, temperature } = req.body;
    const clientId = getClientIdentifier(req);
    const timestamp = new Date().toISOString();

    // Log incoming request
    console.log('\n' + '='.repeat(80));
    console.log(`📨 [${timestamp}] INCOMING REQUEST`);
    console.log('='.repeat(80));
    console.log(`🔗 Client IP: ${clientId}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`);
    console.log(`⚙️  Options:`, { think, max_tokens, temperature });

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.log('❌ Validation Error: Prompt is empty or invalid');
      console.log('='.repeat(80) + '\n');
      res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a non-empty string',
      });
      return;
    }

    // Check rate limit
    if (isRateLimited(clientId)) {
      const remaining = getRemainingRequests(clientId);
      const resetTime = getResetTime(clientId);
      console.log(`⛔ Rate Limit Exceeded for ${clientId}`);
      console.log(`📊 Remaining: ${remaining}, Reset Time: ${new Date(resetTime).toLocaleString()}`);
      console.log('='.repeat(80) + '\n');
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded. You have reached the maximum of 3 messages per day. Please try again after ${new Date(resetTime).toLocaleString()}.`,
        remaining,
        resetTime,
      });
      return;
    }

    console.log('✅ Validation passed, calling AI model...');

    // Call AI model service
    const startTime = Date.now();
    const result = await generateAIResponse(prompt, {
      think,
      max_tokens,
      temperature,
    });
    const duration = Date.now() - startTime;

    // Increment request count
    incrementRequestCount(clientId);

    // Get remaining requests
    const remaining = getRemainingRequests(clientId);
    const resetTime = getResetTime(clientId);

    // Log successful response
    console.log('\n' + '='.repeat(80));
    console.log(`✨ [${new Date().toISOString()}] RESPONSE GENERATED`);
    console.log('='.repeat(80));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Remaining Messages: ${remaining}`);
    console.log(`🔄 Reset Time: ${new Date(resetTime).toLocaleString()}`);
    console.log(`📤 Response Preview: ${result.substring(0, 100)}${result.length > 100 ? '...' : ''}`);
    console.log('='.repeat(80) + '\n');

    res.status(200).json({
      success: true,
      result,
      remaining,
      resetTime,
    });
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.log('\n' + '='.repeat(80));
    console.log(`❌ [${timestamp}] ERROR OCCURRED`);
    console.log('='.repeat(80));
    console.error('Error Details:', error);
    console.log('='.repeat(80) + '\n');

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
