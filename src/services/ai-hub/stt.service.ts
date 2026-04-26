/**
 * Speech-to-Text (STT) Service
 * Handles audio transcription using external STT API
 * Supports multiple languages including Arabic
 */

import fs from 'fs';
import path from 'path';

interface STTResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  transcript: string;
  language: string;
  error?: string;
}

interface STTOptions {
  language?: string;
  timeout?: number;
}

/**
 * Transcribe audio from a URL
 * Downloads the audio file and sends it to the STT API
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  options: STTOptions = {}
): Promise<string> {
  try {
    const sttApiUrl = process.env.AI_MODEL;
    
    if (!sttApiUrl) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const language = options.language || 'ar'; // Default to Arabic
    const timeout = options.timeout || 60000; // 60 seconds default

    console.log(`\n🎙️  [${new Date().toISOString()}] Starting STT Transcription`);
    console.log(`🌐 STT API URL: ${sttApiUrl}/stt`);
    console.log(`📥 Audio URL: ${audioUrl}`);
    console.log(`🗣️  Language: ${language}`);

    // Download audio file from URL
    console.log('📥 Downloading audio file...');
    const audioBuffer = await downloadAudioFile(audioUrl, timeout);
    console.log(`✅ Audio downloaded (${audioBuffer.length} bytes)`);

    // Validate audio buffer
    validateAudioBuffer(audioBuffer, audioUrl);

    // Create FormData with audio file
    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('language', language);

    console.log('📤 Sending to STT API...');
    console.log(`📦 FormData created with file size: ${audioBuffer.length} bytes`);
    const startTime = Date.now();

    const response = await fetch(`${sttApiUrl}/stt`, {
      method: 'POST',
      body: formData,
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', errorText);
      console.error('🔍 Request Details:', {
        url: `${sttApiUrl}/stt`,
        method: 'POST',
        audioUrl: audioUrl,
        audioSize: audioBuffer.length,
        language: language,
      });
      throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: STTResponse = await response.json();

    console.log(`📥 STT Response:`, {
      id: data.id,
      status: data.status,
      language: data.language,
      transcriptLength: data.transcript?.length || 0,
      hasError: !!data.error,
    });

    // Check for errors in response
    if (data.error) {
      throw new Error(`STT error: ${data.error}`);
    }

    // Return the transcript
    if (data.transcript) {
      console.log(`✅ Transcription completed (${data.transcript.length} characters)`);
      return data.transcript;
    }

    throw new Error('No transcript returned from STT API');
  } catch (error) {
    console.error('❌ STT Service Error:', error);
    throw error;
  }
}

/**
 * Transcribe audio from a local file path
 */
export async function transcribeAudioFromFile(
  filePath: string,
  options: STTOptions = {}
): Promise<string> {
  try {
    const sttApiUrl = process.env.AI_MODEL;
    
    if (!sttApiUrl) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    const language = options.language || 'ar'; // Default to Arabic

    console.log(`\n🎙️  [${new Date().toISOString()}] Starting STT Transcription from File`);
    console.log(`🌐 STT API URL: ${sttApiUrl}/stt`);
    console.log(`📁 File Path: ${filePath}`);
    console.log(`🗣️  Language: ${language}`);

    // Read audio file
    const audioBuffer = fs.readFileSync(filePath);
    console.log(`✅ Audio file read (${audioBuffer.length} bytes)`);

    // Validate audio buffer
    validateAudioBuffer(audioBuffer, filePath);

    // Create FormData with audio file
    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: getMimeType(filePath) });
    formData.append('file', audioBlob, path.basename(filePath));
    formData.append('language', language);

    console.log('📤 Sending to STT API...');
    console.log(`📦 FormData created with file size: ${audioBuffer.length} bytes`);
    const startTime = Date.now();

    const response = await fetch(`${sttApiUrl}/stt`, {
      method: 'POST',
      body: formData,
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', errorText);
      console.error('🔍 Request Details:', {
        url: `${sttApiUrl}/stt`,
        method: 'POST',
        filePath: filePath,
        audioSize: audioBuffer.length,
        language: language,
      });
      throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: STTResponse = await response.json();

    console.log(`📥 STT Response:`, {
      id: data.id,
      status: data.status,
      language: data.language,
      transcriptLength: data.transcript?.length || 0,
      hasError: !!data.error,
    });

    // Check for errors in response
    if (data.error) {
      throw new Error(`STT error: ${data.error}`);
    }

    // Return the transcript
    if (data.transcript) {
      console.log(`✅ Transcription completed (${data.transcript.length} characters)`);
      return data.transcript;
    }

    throw new Error('No transcript returned from STT API');
  } catch (error) {
    console.error('❌ STT Service Error:', error);
    throw error;
  }
}

/**
 * Download audio file from URL with better error handling
 */
async function downloadAudioFile(
  audioUrl: string,
  timeout: number
): Promise<Buffer> {
  try {
    console.log(`📥 Downloading audio from: ${audioUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏰ Download timeout after ${timeout}ms`);
    }, timeout);

    const response = await fetch(audioUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      console.log(`📏 Content-Length: ${contentLength} bytes`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`✅ Downloaded ${buffer.length} bytes`);
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Download timeout: Audio download took longer than ${timeout}ms`);
    }
    console.error('❌ Error downloading audio file:', error);
    throw error;
  }
}

/**
 * Validate audio buffer
 */
function validateAudioBuffer(buffer: Buffer, source: string): void {
  if (!buffer || buffer.length === 0) {
    throw new Error(`Invalid audio buffer from ${source}: Buffer is empty`);
  }

  // Check minimum file size (1KB)
  if (buffer.length < 1024) {
    throw new Error(`Invalid audio buffer from ${source}: File too small (${buffer.length} bytes)`);
  }

  // Check maximum file size (50MB)
  const maxSize = 50 * 1024 * 1024;
  if (buffer.length > maxSize) {
    throw new Error(`Invalid audio buffer from ${source}: File too large (${buffer.length} bytes, max: ${maxSize})`);
  }

  console.log(`✅ Audio buffer validated: ${buffer.length} bytes`);
}

/**
 * Get MIME type based on file extension
 */
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: { [key: string]: string } = {
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.m4a': 'audio/mp4',
    '.ogg': 'audio/ogg',
    '.flac': 'audio/flac',
    '.webm': 'audio/webm',
  };
  return mimeTypes[ext] || 'audio/mpeg';
}

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm'];

/**
 * Supported languages for STT
 */
export const SUPPORTED_LANGUAGES = {
  ar: 'Arabic (العربية)',
  en: 'English',
  fr: 'French',
  es: 'Spanish',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
};

/**
 * Transcribe audio from buffer
 * تحويل الصوت من Buffer إلى نص
 */
export async function transcribeAudioFromBuffer(
  audioBuffer: Buffer,
  options: STTOptions = {}
): Promise<string> {
  try {
    const sttApiUrl = process.env.AI_MODEL;
    
    if (!sttApiUrl) {
      throw new Error('AI_MODEL environment variable is not configured');
    }

    const language = options.language || 'ar'; // Default to Arabic

    console.log(`\n🎙️  [${new Date().toISOString()}] Starting STT Transcription from Buffer`);
    console.log(`🌐 STT API URL: ${sttApiUrl}/stt`);
    console.log(`📊 Audio Buffer Size: ${audioBuffer.length} bytes`);
    console.log(`🗣️  Language: ${language}`);

    // Validate audio buffer
    validateAudioBuffer(audioBuffer, 'Buffer');

    // Create FormData with audio file
    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
    formData.append('file', audioBlob, 'audio.mp3');
    formData.append('language', language);

    console.log('📤 Sending to STT API...');
    console.log(`📦 FormData created with file size: ${audioBuffer.length} bytes`);
    const startTime = Date.now();

    const response = await fetch(`${sttApiUrl}/stt`, {
      method: 'POST',
      body: formData,
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response Time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Response Error:', errorText);
      console.error('🔍 Request Details:', {
        url: `${sttApiUrl}/stt`,
        method: 'POST',
        audioSize: audioBuffer.length,
        language: language,
      });
      throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data: STTResponse = await response.json();

    console.log(`📥 STT Response:`, {
      id: data.id,
      status: data.status,
      language: data.language,
      transcriptLength: data.transcript?.length || 0,
      hasError: !!data.error,
    });

    // Check for errors in response
    if (data.error) {
      throw new Error(`STT error: ${data.error}`);
    }

    // Return the transcript
    if (data.transcript) {
      console.log(`✅ Transcription completed (${data.transcript.length} characters)`);
      return data.transcript;
    }

    throw new Error('No transcript returned from STT API');
  } catch (error) {
    console.error('❌ STT Service Error:', error);
    throw error;
  }
}