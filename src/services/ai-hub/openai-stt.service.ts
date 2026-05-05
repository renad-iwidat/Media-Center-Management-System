/**
 * OpenAI Whisper STT Service
 * خدمة تحويل الصوت إلى نص باستخدام OpenAI Whisper API
 * 
 * Features:
 * - High accuracy for Arabic
 * - Reliable cloud service
 * - No timeout issues
 * - Supports multiple languages
 */

import fs from 'fs';
import path from 'path';

interface OpenAISTTOptions {
  language?: string;
  model?: 'whisper-1';
  response_format?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
  temperature?: number;
  prompt?: string;
}

interface OpenAISTTResponse {
  text: string;
}

/**
 * Transcribe audio buffer using OpenAI Whisper API
 * تفريغ الصوت باستخدام OpenAI Whisper
 */
export async function transcribeAudioWithOpenAI(
  audioBuffer: Buffer,
  options: OpenAISTTOptions = {}
): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not configured');
    }

    const {
      language = 'ar', // Arabic by default
      model = 'whisper-1',
      response_format = 'json',
      temperature = 0,
      prompt
    } = options;

    console.log(`\n🤖 [${new Date().toISOString()}] Starting OpenAI Whisper Transcription`);
    console.log(`🌐 API: OpenAI Whisper API`);
    console.log(`📊 Audio Buffer Size: ${audioBuffer.length} bytes`);
    console.log(`🗣️  Language: ${language}`);
    console.log(`🎯 Model: ${model}`);

    // Validate audio buffer
    validateAudioBuffer(audioBuffer);

    // Create FormData for OpenAI API
    const formData = new FormData();
    formData.append('file', new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' }), 'audio.mp3');
    formData.append('model', model);
    formData.append('language', language);
    formData.append('response_format', response_format);
    formData.append('temperature', temperature.toString());
    
    if (prompt) {
      formData.append('prompt', prompt);
    }

    console.log('📤 Sending to OpenAI Whisper API...');
    const startTime = Date.now();

    // Retry logic with exponential backoff
    let lastError: Error | null = null;
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}/${maxRetries}`);
        
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
          body: formData,
          // OpenAI has generous timeouts, but we'll set a reasonable limit
          signal: AbortSignal.timeout(300000), // 5 minutes
        });

        const duration = Date.now() - startTime;
        console.log(`⏱️  Response Time: ${duration}ms`);
        console.log(`📊 Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ OpenAI API Error:', errorText);
          
          // Parse OpenAI error for better handling
          let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error?.message) {
              errorMessage = errorData.error.message;
            }
          } catch (e) {
            // Use raw error text if JSON parsing fails
            errorMessage += ` - ${errorText}`;
          }
          
          throw new Error(errorMessage);
        }

        const data: OpenAISTTResponse = await response.json();

        console.log(`📥 OpenAI Response received`);
        console.log(`📝 Transcript Length: ${data.text?.length || 0} characters`);

        // Return the transcript
        if (data.text) {
          console.log(`✅ OpenAI Whisper transcription completed (${data.text.length} characters)`);
          return data.text.trim();
        }

        throw new Error('No transcript returned from OpenAI Whisper API');
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Attempt ${attempt} failed:`, error);
        
        // Check if it's a rate limit error (429) or server error (5xx)
        if (error instanceof Error && error.message.includes('429')) {
          console.log('⏳ Rate limit hit, waiting longer...');
          const delay = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s for rate limits
          if (attempt < maxRetries) {
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        } else if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s for other errors
          console.log(`⏳ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`OpenAI Whisper failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);

  } catch (error) {
    console.error('❌ OpenAI STT Service Error:', error);
    throw error;
  }
}

/**
 * Transcribe audio from file path using OpenAI Whisper
 * تفريغ الصوت من ملف باستخدام OpenAI Whisper
 */
export async function transcribeAudioFileWithOpenAI(
  filePath: string,
  options: OpenAISTTOptions = {}
): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    console.log(`\n🤖 [${new Date().toISOString()}] Starting OpenAI Whisper Transcription from File`);
    console.log(`📁 File Path: ${filePath}`);

    // Read audio file
    const audioBuffer = fs.readFileSync(filePath);
    console.log(`✅ Audio file read (${audioBuffer.length} bytes)`);

    // Use the buffer transcription function
    return await transcribeAudioWithOpenAI(audioBuffer, options);

  } catch (error) {
    console.error('❌ OpenAI STT File Service Error:', error);
    throw error;
  }
}

/**
 * Validate audio buffer for OpenAI Whisper API
 * التحقق من صحة ملف الصوت لـ OpenAI Whisper
 */
function validateAudioBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid audio buffer: Buffer is empty');
  }

  // Check minimum file size (1KB)
  if (buffer.length < 1024) {
    throw new Error(`Invalid audio buffer: File too small (${buffer.length} bytes)`);
  }

  // OpenAI Whisper has a 25MB limit
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (buffer.length > maxSize) {
    throw new Error(`Invalid audio buffer: File too large (${buffer.length} bytes, max: ${maxSize})`);
  }

  console.log(`✅ Audio buffer validated: ${buffer.length} bytes (within OpenAI limits)`);
}

/**
 * Get optimal chunk size for OpenAI Whisper
 * الحصول على حجم الجزء الأمثل لـ OpenAI Whisper
 */
export function getOptimalChunkSize(audioDurationSeconds: number): number {
  // OpenAI Whisper works best with longer audio segments
  // But we'll keep chunks reasonable for progress tracking
  
  if (audioDurationSeconds <= 300) { // 5 minutes or less
    return audioDurationSeconds; // Process as single chunk
  } else if (audioDurationSeconds <= 1800) { // 30 minutes or less
    return 300; // 5-minute chunks
  } else {
    return 600; // 10-minute chunks for very long audio
  }
}

/**
 * Supported languages for OpenAI Whisper
 * اللغات المدعومة في OpenAI Whisper
 */
export const OPENAI_SUPPORTED_LANGUAGES = {
  ar: 'Arabic (العربية)',
  en: 'English',
  fr: 'French (Français)',
  es: 'Spanish (Español)',
  de: 'German (Deutsch)',
  it: 'Italian (Italiano)',
  pt: 'Portuguese (Português)',
  ru: 'Russian (Русский)',
  zh: 'Chinese (中文)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)',
  hi: 'Hindi (हिन्दी)',
  tr: 'Turkish (Türkçe)',
  pl: 'Polish (Polski)',
  nl: 'Dutch (Nederlands)',
  sv: 'Swedish (Svenska)',
  da: 'Danish (Dansk)',
  no: 'Norwegian (Norsk)',
  fi: 'Finnish (Suomi)',
  he: 'Hebrew (עברית)',
  th: 'Thai (ไทย)',
  vi: 'Vietnamese (Tiếng Việt)',
  uk: 'Ukrainian (Українська)',
  cs: 'Czech (Čeština)',
  hu: 'Hungarian (Magyar)',
  ro: 'Romanian (Română)',
  bg: 'Bulgarian (Български)',
  hr: 'Croatian (Hrvatski)',
  sk: 'Slovak (Slovenčina)',
  sl: 'Slovenian (Slovenščina)',
  et: 'Estonian (Eesti)',
  lv: 'Latvian (Latviešu)',
  lt: 'Lithuanian (Lietuvių)',
  mt: 'Maltese (Malti)',
  cy: 'Welsh (Cymraeg)',
  ga: 'Irish (Gaeilge)',
  is: 'Icelandic (Íslenska)',
  mk: 'Macedonian (Македонски)',
  sq: 'Albanian (Shqip)',
  bs: 'Bosnian (Bosanski)',
  sr: 'Serbian (Српски)',
  me: 'Montenegrin (Crnogorski)',
};

/**
 * Audio format support for OpenAI Whisper
 * صيغ الصوت المدعومة في OpenAI Whisper
 */
export const OPENAI_SUPPORTED_FORMATS = [
  'mp3', 'mp4', 'm4a', 'wav', 'webm', 'flac', 'ogg', 'oga', 'opus'
];

/**
 * Check if OpenAI API key is configured
 * التحقق من تكوين مفتاح OpenAI API
 */
export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Get OpenAI API usage info (for monitoring)
 * معلومات استخدام OpenAI API (للمراقبة)
 */
export async function getOpenAIUsageInfo(): Promise<any> {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Note: OpenAI doesn't provide a direct usage endpoint in the public API
    // This is a placeholder for future implementation
    return {
      configured: true,
      model: 'whisper-1',
      maxFileSize: '25MB',
      supportedLanguages: Object.keys(OPENAI_SUPPORTED_LANGUAGES).length,
      supportedFormats: OPENAI_SUPPORTED_FORMATS.length,
    };

  } catch (error) {
    console.error('Error getting OpenAI usage info:', error);
    return {
      configured: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}