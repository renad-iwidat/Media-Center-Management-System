/**
 * Text-to-Speech Service
 * Handles conversion of text to speech using OpenAI API
 */

import * as fs from 'fs';
import * as path from 'path';

export type TTSVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

interface TTSRequest {
  text: string;
  voice: TTSVoice;
  model?: string;
  speed?: number;
}

interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  error?: string;
  message?: string;
}

/**
 * Convert text to speech using OpenAI API
 * Returns audio as base64 string
 * 
 * يدعم النصوص بالعربية والإنجليزية وجميع اللغات المدعومة من OpenAI
 */
export async function textToSpeech(
  text: string,
  voice: TTSVoice = 'nova'
): Promise<Buffer> {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Validate voice
    const validVoices: TTSVoice[] = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
    if (!validVoices.includes(voice)) {
      throw new Error(`Invalid voice. Must be one of: ${validVoices.join(', ')}`);
    }

    console.log(`\n🔄 [${new Date().toISOString()}] Converting text to speech`);
    console.log(`📝 Text length: ${text.length} characters`);
    console.log(`📝 Text preview: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    console.log(`🎤 Voice: ${voice}`);

    const startTime = Date.now();

    // OpenAI TTS API supports Arabic and other languages
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text, // OpenAI handles UTF-8 Arabic text correctly
        voice: voice,
        speed: 1.3, // Increased speed from 1.0 to 1.3
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ OpenAI API Error:', errorData);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText} - ${
          errorData?.error?.message || 'Unknown error'
        }`
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log(`✅ Audio generated successfully (${audioBuffer.byteLength} bytes)`);

    return Buffer.from(audioBuffer);
  } catch (error) {
    console.error('❌ TTS Service Error:', error);
    throw error;
  }
}

/**
 * Convert text to speech and return as base64
 */
export async function textToSpeechBase64(
  text: string,
  voice: TTSVoice = 'nova'
): Promise<string> {
  const audioBuffer = await textToSpeech(text, voice);
  return audioBuffer.toString('base64');
}

/**
 * Get available voices with descriptions
 */
export function getAvailableVoices(): Record<TTSVoice, { name: string; description: string }> {
  return {
    alloy: {
      name: 'Alloy',
      description: 'Neutral, balanced voice',
    },
    echo: {
      name: 'Echo',
      description: 'Warm, friendly voice',
    },
    fable: {
      name: 'Fable',
      description: 'Storytelling voice',
    },
    onyx: {
      name: 'Onyx',
      description: 'Deep, professional voice',
    },
    nova: {
      name: 'Nova',
      description: 'Bright, energetic voice',
    },
    shimmer: {
      name: 'Shimmer',
      description: 'Clear, crisp voice',
    },
  };
}
