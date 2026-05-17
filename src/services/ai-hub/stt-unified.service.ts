/**
 * OpenAI-Only STT Service
 * Handles audio transcription using OpenAI Whisper API exclusively with chunking support
 * خدمة تحويل الصوت إلى نص باستخدام OpenAI Whisper فقط مع دعم التقسيم
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { transcribeAudioWithOpenAI, isOpenAIConfigured } from './openai-stt.service';

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface STTOptions {
  language?: string;
  chunkDurationSeconds?: number;
  maxConcurrentChunks?: number;
  enableChunking?: boolean;
}

interface AudioChunk {
  id: string;
  filePath: string;
  startTime: number;
  duration: number;
  index: number;
  transcript?: string;
}

/**
 * Main transcription function - OpenAI Whisper only with smart chunking
 * الدالة الرئيسية للتفريغ - OpenAI Whisper فقط مع تقسيم ذكي
 */
export async function transcribeAudioFromBuffer(
  audioBuffer: Buffer,
  options: STTOptions = {}
): Promise<string> {
  try {
    const language = options.language || 'ar';
    const chunkDuration = options.chunkDurationSeconds || 600; // 10 minutes (OpenAI optimal)
    const maxConcurrent = options.maxConcurrentChunks || 3; // 3 concurrent for OpenAI
    const enableChunking = options.enableChunking ?? true;

    console.log(`\n🤖 [${new Date().toISOString()}] Starting OpenAI-Only STT Transcription`);
    console.log(`📊 Audio Buffer Size: ${audioBuffer.length} bytes`);
    console.log(`🗣️  Language: ${language}`);
    console.log(`🔄 Chunking: ${enableChunking}`);
    console.log(`⏱️  Chunk Duration: ${chunkDuration}s`);
    console.log(`⚡ Max Concurrent: ${maxConcurrent}`);

    // Check OpenAI availability
    if (!isOpenAIConfigured()) {
      throw new Error('OPENAI_API_KEY is not configured. This service requires OpenAI Whisper API.');
    }

    // Validate audio buffer
    validateAudioBuffer(audioBuffer);

    // Get audio duration first
    const tempDir = getTempDir();
    const tempAudioPath = path.join(tempDir, `temp-audio-${randomUUID()}.mp3`);
    
    try {
      // Save audio to temporary file for duration check
      fs.writeFileSync(tempAudioPath, audioBuffer);
      console.log(`💾 Temporary audio saved: ${path.basename(tempAudioPath)}`);

      const duration = await getAudioDuration(tempAudioPath);
      console.log(`⏱️  Audio Duration: ${Math.round(duration)}s (${Math.round(duration/60)} minutes)`);

      // Decide chunking strategy
      if (!enableChunking || duration <= chunkDuration) {
        console.log('� Processing as single chunk (no chunking needed)...');
        const result = await transcribeAudioWithOpenAI(audioBuffer, { language, includeTimestamps: false });
        return typeof result === 'string' ? result : result.text;
      } else {
        console.log(`🔄 Audio requires chunking (${Math.round(duration)}s > ${chunkDuration}s)`);
        return await transcribeWithChunking(tempAudioPath, {
          language,
          chunkDuration,
          maxConcurrent,
          totalDuration: duration
        });
      }

    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempAudioPath)) {
        try {
          fs.unlinkSync(tempAudioPath);
          console.log(`🗑️  Deleted temp audio: ${path.basename(tempAudioPath)}`);
        } catch (error) {
          console.warn(`⚠️  Could not delete temp file: ${error}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ OpenAI-Only STT Service Error:', error);
    throw error;
  }
}

/**
 * Transcribe with chunking using OpenAI Whisper
 * تفريغ مع التقسيم باستخدام OpenAI Whisper
 */
async function transcribeWithChunking(
  audioFilePath: string,
  options: {
    language: string;
    chunkDuration: number;
    maxConcurrent: number;
    totalDuration: number;
  }
): Promise<string> {
  const { language, chunkDuration, maxConcurrent, totalDuration } = options;
  
  console.log(`\n🔄 [${new Date().toISOString()}] Starting OpenAI Chunked Processing`);
  console.log(`📊 Total Duration: ${Math.round(totalDuration)}s`);
  console.log(`⏱️  Chunk Duration: ${chunkDuration}s`);
  console.log(`⚡ Max Concurrent: ${maxConcurrent}`);

  let chunks: AudioChunk[] = [];

  try {
    // Step 1: Split audio into chunks
    chunks = await splitAudioIntoChunks(audioFilePath, chunkDuration, totalDuration);
    console.log(`📦 Created ${chunks.length} chunks`);

    // Step 2: Process chunks with OpenAI
    const processedChunks = await processChunksWithOpenAI(chunks, language, maxConcurrent);

    // Step 3: Combine transcripts
    const finalTranscript = combineTranscripts(processedChunks);

    console.log(`✅ OpenAI chunked processing completed`);
    console.log(`📝 Final transcript: ${finalTranscript.length} characters`);

    return finalTranscript;

  } finally {
    // Cleanup chunk files
    await cleanupChunks(chunks);
  }
}

/**
 * Split audio into chunks for OpenAI processing
 * تقسيم الصوت إلى أجزاء لمعالجة OpenAI
 */
async function splitAudioIntoChunks(
  audioPath: string,
  chunkDuration: number,
  totalDuration: number
): Promise<AudioChunk[]> {
  const tempDir = getTempDir();
  const chunks: AudioChunk[] = [];
  
  let startTime = 0;
  let chunkIndex = 0;

  console.log(`🔄 Splitting audio into ${chunkDuration}s chunks...`);

  while (startTime < totalDuration) {
    const chunkId = randomUUID();
    const chunkPath = path.join(tempDir, `openai-chunk-${chunkIndex}-${chunkId}.mp3`);
    
    // Calculate actual chunk duration
    const actualDuration = Math.min(chunkDuration, totalDuration - startTime);
    
    console.log(`📍 Creating Chunk ${chunkIndex + 1}: ${formatTime(startTime)} - ${formatTime(startTime + actualDuration)}`);

    // Extract chunk using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .seekInput(startTime)
        .duration(actualDuration)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .audioChannels(2)
        .audioFrequency(44100)
        .output(chunkPath)
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`📊 Chunk ${chunkIndex + 1} Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log(`✅ Chunk ${chunkIndex + 1} created: ${formatBytes(fs.statSync(chunkPath).size)}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ Error creating chunk ${chunkIndex + 1}:`, err);
          reject(err);
        })
        .run();
    });

    chunks.push({
      id: chunkId,
      filePath: chunkPath,
      startTime,
      duration: actualDuration,
      index: chunkIndex
    });

    startTime += chunkDuration;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Process chunks with OpenAI Whisper in parallel
 * معالجة الأجزاء مع OpenAI Whisper بشكل متوازي
 */
async function processChunksWithOpenAI(
  chunks: AudioChunk[],
  language: string,
  maxConcurrent: number
): Promise<AudioChunk[]> {
  console.log(`\n🤖 [${new Date().toISOString()}] Processing ${chunks.length} chunks with OpenAI`);
  console.log(`⚡ Max Concurrent: ${maxConcurrent}`);

  const processedChunks: AudioChunk[] = new Array(chunks.length);
  const startTime = Date.now();
  let completedCount = 0;

  // Queue-based parallel processing
  const queue = [...chunks];
  const activePromises = new Set<Promise<void>>();

  const processChunk = async (chunk: AudioChunk): Promise<void> => {
    try {
      console.log(`🎵 Processing Chunk ${chunk.index + 1}/${chunks.length} with OpenAI...`);
      const chunkStartTime = Date.now();
      
      // Read chunk file
      const chunkBuffer = fs.readFileSync(chunk.filePath);
      
      // Transcribe with OpenAI
      const transcriptionResult = await transcribeAudioWithOpenAI(chunkBuffer, { language, includeTimestamps: false });
      const transcript = typeof transcriptionResult === 'string' ? transcriptionResult : transcriptionResult.text;
      
      const chunkDuration = Date.now() - chunkStartTime;
      completedCount++;
      
      processedChunks[chunk.index] = { ...chunk, transcript };
      
      console.log(`✅ Chunk ${chunk.index + 1} completed in ${formatDuration(chunkDuration)} (${transcript.length} chars)`);

      // Calculate progress
      const progress = Math.round((completedCount / chunks.length) * 100);
      const elapsedTime = Date.now() - startTime;
      const estimatedTotalTime = (elapsedTime / completedCount) * chunks.length;
      const estimatedRemaining = estimatedTotalTime - elapsedTime;

      console.log(`📊 Progress: ${progress}% | Elapsed: ${formatDuration(elapsedTime)} | Remaining: ${formatDuration(estimatedRemaining)}`);
      
    } catch (error) {
      console.error(`❌ Error processing chunk ${chunk.index + 1}:`, error);
      throw error;
    }
  };

  // Process all chunks with concurrency control
  while (queue.length > 0 || activePromises.size > 0) {
    // Fill up to maxConcurrent active promises
    while (queue.length > 0 && activePromises.size < maxConcurrent) {
      const chunk = queue.shift()!;
      const promise = processChunk(chunk).then(() => {
        activePromises.delete(promise);
      }).catch((error) => {
        activePromises.delete(promise);
        throw error;
      });
      activePromises.add(promise);
    }

    // Wait for at least one to complete before processing more
    if (activePromises.size > 0) {
      await Promise.race(activePromises);
    }
  }

  const totalDuration = Date.now() - startTime;
  console.log(`\n✅ All chunks processed with OpenAI in ${formatDuration(totalDuration)}`);

  return processedChunks.filter(Boolean);
}

/**
 * Combine transcripts from chunks
 * دمج النصوص من الأجزاء
 */
function combineTranscripts(chunks: AudioChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  if (chunks.length === 1) {
    return chunks[0].transcript || '';
  }

  // Sort chunks by index to maintain order
  const sortedChunks = chunks.sort((a, b) => a.index - b.index);
  
  let combinedTranscript = '';

  for (const chunk of sortedChunks) {
    if (chunk.transcript) {
      if (combinedTranscript) {
        // Add space between chunks
        combinedTranscript += ' ' + chunk.transcript.trim();
      } else {
        combinedTranscript = chunk.transcript.trim();
      }
    }
  }

  return combinedTranscript.trim();
}

/**
 * Get audio duration using ffprobe
 * الحصول على مدة الصوت باستخدام ffprobe
 */
async function getAudioDuration(audioFilePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      const duration = metadata.format?.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Cleanup chunk files
 * تنظيف ملفات الأجزاء
 */
async function cleanupChunks(chunks: AudioChunk[]): Promise<void> {
  console.log('\n🗑️  Cleaning up chunk files...');

  for (const chunk of chunks) {
    if (fs.existsSync(chunk.filePath)) {
      try {
        fs.unlinkSync(chunk.filePath);
        console.log(`✅ Deleted chunk: ${path.basename(chunk.filePath)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete chunk: ${error}`);
      }
    }
  }

  // Clean up temp directory if empty
  try {
    const tempDir = getTempDir();
    const files = fs.readdirSync(tempDir);
    if (files.length === 0) {
      fs.rmdirSync(tempDir);
      console.log(`✅ Deleted empty temp directory`);
    }
  } catch (error) {
    // Directory cleanup is not critical
  }

  console.log('✅ Chunk cleanup completed');
}

/**
 * Transcribe audio from file path using OpenAI only
 * تفريغ الصوت من مسار الملف باستخدام OpenAI فقط
 */
export async function transcribeAudioFromFile(
  filePath: string,
  options: STTOptions = {}
): Promise<string> {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    console.log(`\n🤖 [${new Date().toISOString()}] Starting OpenAI STT from File`);
    console.log(`📁 File Path: ${filePath}`);

    // Read audio file
    const audioBuffer = fs.readFileSync(filePath);
    console.log(`✅ Audio file read: ${formatBytes(audioBuffer.length)}`);

    // Use the buffer transcription function
    return await transcribeAudioFromBuffer(audioBuffer, options);

  } catch (error) {
    console.error('❌ OpenAI STT File Service Error:', error);
    throw error;
  }
}

/**
 * Transcribe audio from URL using OpenAI only
 * تفريغ الصوت من رابط باستخدام OpenAI فقط
 */
export async function transcribeAudioFromUrl(
  audioUrl: string,
  options: STTOptions = {}
): Promise<string> {
  try {
    console.log(`\n🤖 [${new Date().toISOString()}] Starting OpenAI STT from URL`);
    console.log(`📥 Audio URL: ${audioUrl}`);

    // Download audio file from URL
    console.log('📥 Downloading audio file...');
    const audioBuffer = await downloadAudioFile(audioUrl);
    console.log(`✅ Audio downloaded: ${formatBytes(audioBuffer.length)}`);

    // Use the buffer transcription function
    return await transcribeAudioFromBuffer(audioBuffer, options);

  } catch (error) {
    console.error('❌ OpenAI STT URL Service Error:', error);
    throw error;
  }
}

/**
 * Download audio file from URL
 * تحميل ملف الصوت من رابط
 */
async function downloadAudioFile(audioUrl: string): Promise<Buffer> {
  try {
    console.log(`📥 Downloading audio from: ${audioUrl}`);
    
    const response = await fetch(audioUrl, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(300000), // 5 minutes timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`📄 Content-Type: ${contentType}`);
    
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      console.log(`📏 Content-Length: ${formatBytes(parseInt(contentLength))}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`✅ Downloaded: ${formatBytes(buffer.length)}`);
    return buffer;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Download timeout: Audio download took longer than 5 minutes`);
    }
    console.error('❌ Error downloading audio file:', error);
    throw error;
  }
}

/**
 * Get temp directory for OpenAI processing
 * الحصول على مجلد مؤقت لمعالجة OpenAI
 */
function getTempDir(): string {
  const tempDir = path.join(os.tmpdir(), 'openai-stt-chunks');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Validate audio buffer for OpenAI Whisper
 * التحقق من صحة buffer الصوت لـ OpenAI Whisper
 */
function validateAudioBuffer(buffer: Buffer): void {
  if (!buffer || buffer.length === 0) {
    throw new Error('Invalid audio buffer: Buffer is empty');
  }

  // Check minimum file size (1KB)
  if (buffer.length < 1024) {
    throw new Error(`Invalid audio buffer: File too small (${buffer.length} bytes)`);
  }

  // OpenAI Whisper has a 25MB limit per request
  const maxSize = 25 * 1024 * 1024; // 25MB
  if (buffer.length > maxSize) {
    console.log(`⚠️  Audio buffer (${buffer.length} bytes) exceeds OpenAI single request limit (${maxSize}), will use chunking`);
  }

  console.log(`✅ Audio buffer validated: ${formatBytes(buffer.length)}`);
}

/**
 * Format time in MM:SS format
 * تنسيق الوقت بصيغة MM:SS
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format bytes in human readable format
 * تنسيق البايتات بصيغة قابلة للقراءة
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format duration in human readable format
 * تنسيق المدة بصيغة قابلة للقراءة
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
}

/**
 * Get OpenAI STT service status
 * الحصول على حالة خدمة OpenAI STT
 */
export async function getOpenAISTTServiceStatus(): Promise<{
  available: boolean;
  configured: boolean;
  maxFileSize: string;
  supportedLanguages: number;
  recommendedChunkSize: string;
}> {
  const configured = isOpenAIConfigured();

  return {
    available: configured,
    configured: configured,
    maxFileSize: '25MB per chunk',
    supportedLanguages: Object.keys(SUPPORTED_LANGUAGES).length,
    recommendedChunkSize: '10 minutes (600 seconds)',
  };
}

/**
 * Supported audio formats (combined from both services)
 * صيغ الصوت المدعومة (مجمعة من كلا الخدمتين)
 */
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'webm', 'mp4', 'opus'];

/**
 * Supported languages (combined from both services)
 * اللغات المدعومة (مجمعة من كلا الخدمتين)
 */
export const SUPPORTED_LANGUAGES = {
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
};