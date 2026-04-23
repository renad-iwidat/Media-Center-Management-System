/**
 * Text-to-Speech Controller
 * Handles TTS requests from the frontend
 */

import { Request, Response } from 'express';
import { textToSpeechBase64, getAvailableVoices, TTSVoice } from '../../services/ai-hub/tts.service';
import {
  getClientIdentifier,
  isRateLimited,
  incrementRequestCount,
  getRemainingRequests,
  getResetTime,
} from '../../services/ai-hub/rate-limiter.service';

interface TTSRequest {
  text: string;
  voice?: TTSVoice;
}

interface TTSResponse {
  success: boolean;
  audioBase64?: string;
  mimeType?: string;
  error?: string;
  remaining?: number;
  resetTime?: number;
}

interface VoicesResponse {
  success: boolean;
  voices?: Record<string, { name: string; description: string }>;
  error?: string;
}

/**
 * POST /api/ai-hub/tts/generate
 * Convert text to speech
 */
export async function generateTTS(
  req: Request<{}, {}, TTSRequest>,
  res: Response<TTSResponse>
): Promise<void> {
  try {
    const { text, voice = 'nova' } = req.body;
    const clientId = getClientIdentifier(req);
    const timestamp = new Date().toISOString();

    // Log incoming request
    console.log('\n' + '='.repeat(80));
    console.log(`📨 [${timestamp}] TTS REQUEST`);
    console.log('='.repeat(80));
    console.log(`🔗 Client IP: ${clientId}`);
    console.log(`📝 Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    console.log(`🎤 Voice: ${voice}`);

    // Validate input
    if (!text || text.trim().length === 0) {
      console.warn('⚠️  Empty text provided');
      res.status(400).json({
        success: false,
        error: 'Text cannot be empty',
      });
      return;
    }

    // Check rate limiting
    if (isRateLimited(clientId)) {
      const remaining = getRemainingRequests(clientId);
      const resetTime = getResetTime(clientId);
      console.warn(`⚠️  Rate limit exceeded for ${clientId}`);
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        remaining,
        resetTime,
      });
      return;
    }

    // Increment request count
    incrementRequestCount(clientId);
    const remaining = getRemainingRequests(clientId);
    const resetTime = getResetTime(clientId);

    console.log(`📊 Rate Limit: ${remaining} remaining, resets at ${new Date(resetTime).toISOString()}`);

    // Generate TTS
    console.log('🔄 Generating audio...');
    const audioBase64 = await textToSpeechBase64(text, voice as TTSVoice);

    console.log(`✅ TTS generated successfully`);
    console.log(`📊 Audio size: ${audioBase64.length} characters (base64)`);

    res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/mpeg',
      remaining,
      resetTime,
    });
  } catch (error) {
    console.error('❌ TTS Controller Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}

/**
 * GET /api/ai-hub/tts/voices
 * Get available voices
 */
export async function getVoices(
  req: Request,
  res: Response<VoicesResponse>
): Promise<void> {
  try {
    console.log(`\n📋 [${new Date().toISOString()}] Fetching available voices`);

    const voices = getAvailableVoices();

    console.log(`✅ Returned ${Object.keys(voices).length} voices`);

    res.json({
      success: true,
      voices,
    });
  } catch (error) {
    console.error('❌ Get Voices Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
}
