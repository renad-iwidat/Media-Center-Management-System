/**
 * Parallel STT Service
 * خدمة التفريغ الصوتي المتوازي
 * 
 * Splits audio into chunks and processes them in parallel for faster transcription
 * يقسم الصوت إلى أجزاء ويعالجها بشكل متوازي لتسريع التفريغ
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { transcribeAudioWithOpenAI } from './openai-stt.service';

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface ParallelSTTOptions {
  language?: string;
  chunkDurationSeconds?: number;
  maxConcurrentRequests?: number;
  timeout?: number;
  overlapSeconds?: number; // Overlap between chunks to avoid cutting words
}

interface AudioChunk {
  id: string;
  filePath: string;
  startTime: number;
  duration: number;
  index: number;
}

interface TranscriptionResult {
  chunkId: string;
  index: number;
  transcript: string;
  startTime: number;
  duration: number;
  processingTime: number;
}

/**
 * Transcribe audio buffer using parallel processing
 * تفريغ الصوت باستخدام المعالجة المتوازية
 */
export async function transcribeAudioBufferParallel(
  audioBuffer: Buffer,
  options: ParallelSTTOptions = {}
): Promise<string> {
  const {
    language = 'ar',
    chunkDurationSeconds = parseInt(process.env.STT_CHUNK_DURATION_SECONDS || '300'),
    maxConcurrentRequests = parseInt(process.env.STT_MAX_CONCURRENT_REQUESTS || '3'),
    timeout = 120000,
    overlapSeconds = parseInt(process.env.STT_OVERLAP_SECONDS || '3')
  } = options;

  console.log(`\n🚀 [${new Date().toISOString()}] Starting Parallel STT Processing`);
  console.log(`📊 Audio Buffer Size: ${audioBuffer.length} bytes`);
  console.log(`🔄 Chunk Duration: ${chunkDurationSeconds}s`);
  console.log(`⚡ Max Concurrent: ${maxConcurrentRequests}`);
  console.log(`🔗 Overlap: ${overlapSeconds}s`);

  const tempDir = getTempDir();
  let tempAudioPath: string | null = null;
  let chunks: AudioChunk[] = [];

  try {
    // Step 1: Save audio buffer to temporary file
    tempAudioPath = path.join(tempDir, `temp-audio-${randomUUID()}.mp3`);
    fs.writeFileSync(tempAudioPath, audioBuffer);
    console.log(`💾 Temporary audio saved: ${path.basename(tempAudioPath)}`);

    // Step 2: Get audio duration
    const duration = await getAudioDuration(tempAudioPath);
    console.log(`⏱️  Audio duration: ${Math.round(duration)}s`);

    // Step 3: Check if chunking is beneficial
    if (duration <= chunkDurationSeconds * 1.5) {
      console.log(`📝 Audio is short (${Math.round(duration)}s ≤ ${chunkDurationSeconds * 1.5}s), using single request...`);
      return await transcribeAudioBufferSingle(audioBuffer, { language, timeout });
    }

    // Step 4: Split audio into chunks
    chunks = await splitAudioIntoChunks(tempAudioPath, {
      chunkDurationSeconds,
      overlapSeconds,
      maxConcurrentRequests
    });

    console.log(`📦 Audio split into ${chunks.length} chunks`);

    // Step 5: Process chunks in parallel
    const results = await processChunksInParallel(chunks, {
      language,
      maxConcurrentRequests,
      timeout
    });

    // Step 6: Combine results
    const finalTranscript = combineTranscriptionResults(results, overlapSeconds);

    console.log(`✅ Parallel processing completed`);
    console.log(`📝 Final transcript: ${finalTranscript.length} characters`);
    console.log(`⚡ Processed ${chunks.length} chunks in parallel`);

    return finalTranscript;

  } finally {
    // Cleanup
    await cleanup(tempAudioPath, chunks);
  }
}

/**
 * Get audio duration using ffprobe
 * الحصول على مدة الصوت باستخدام ffprobe
 */
async function getAudioDuration(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
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
 * Split audio into overlapping chunks
 * تقسيم الصوت إلى أجزاء متداخلة
 */
async function splitAudioIntoChunks(
  audioPath: string,
  options: {
    chunkDurationSeconds: number;
    overlapSeconds: number;
    maxConcurrentRequests: number;
  }
): Promise<AudioChunk[]> {
  const { chunkDurationSeconds, overlapSeconds } = options;
  const tempDir = getTempDir();
  
  const duration = await getAudioDuration(audioPath);
  const chunks: AudioChunk[] = [];
  
  let startTime = 0;
  let chunkIndex = 0;

  while (startTime < duration) {
    const chunkId = randomUUID();
    const chunkPath = path.join(tempDir, `chunk-${chunkIndex}-${chunkId}.mp3`);
    
    // Calculate chunk duration (with overlap)
    const actualDuration = Math.min(chunkDurationSeconds, duration - startTime);
    
    // Extract chunk using ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .seekInput(startTime)
        .duration(actualDuration)
        .audioCodec('libmp3lame')
        .audioBitrate('128k')
        .output(chunkPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .run();
    });

    chunks.push({
      id: chunkId,
      filePath: chunkPath,
      startTime,
      duration: actualDuration,
      index: chunkIndex
    });

    console.log(`📦 Created chunk ${chunkIndex}: ${startTime}s - ${startTime + actualDuration}s`);

    // Move to next chunk (with overlap consideration)
    startTime += chunkDurationSeconds - overlapSeconds;
    chunkIndex++;
  }

  return chunks;
}

/**
 * Process chunks in parallel with concurrency control
 * معالجة الأجزاء بشكل متوازي مع التحكم في التزامن
 */
async function processChunksInParallel(
  chunks: AudioChunk[],
  options: {
    language: string;
    maxConcurrentRequests: number;
    timeout: number;
  }
): Promise<TranscriptionResult[]> {
  const { language, maxConcurrentRequests, timeout } = options;
  const results: TranscriptionResult[] = [];
  
  console.log(`🚀 Processing ${chunks.length} chunks with max ${maxConcurrentRequests} concurrent requests`);

  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += maxConcurrentRequests) {
    const batch = chunks.slice(i, i + maxConcurrentRequests);
    console.log(`📦 Processing batch ${Math.floor(i / maxConcurrentRequests) + 1}: chunks ${i + 1}-${Math.min(i + maxConcurrentRequests, chunks.length)}`);

    // Process batch in parallel
    const batchPromises = batch.map(async (chunk) => {
      const startTime = Date.now();
      
      try {
        console.log(`🎙️  Processing chunk ${chunk.index} (${chunk.startTime}s-${chunk.startTime + chunk.duration}s)`);
        
        // Read chunk file
        const chunkBuffer = fs.readFileSync(chunk.filePath);
        
        // Transcribe chunk
        const transcript = await transcribeAudioBufferSingle(chunkBuffer, {
          language,
          timeout
        });

        const processingTime = Date.now() - startTime;
        console.log(`✅ Chunk ${chunk.index} completed in ${processingTime}ms: ${transcript.length} chars`);

        return {
          chunkId: chunk.id,
          index: chunk.index,
          transcript,
          startTime: chunk.startTime,
          duration: chunk.duration,
          processingTime
        };

      } catch (error) {
        console.error(`❌ Chunk ${chunk.index} failed:`, error);
        
        // Return empty transcript for failed chunks
        return {
          chunkId: chunk.id,
          index: chunk.index,
          transcript: '',
          startTime: chunk.startTime,
          duration: chunk.duration,
          processingTime: Date.now() - startTime
        };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to avoid overwhelming the API
    if (i + maxConcurrentRequests < chunks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Sort results by index to maintain order
  results.sort((a, b) => a.index - b.index);

  const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0);
  const avgProcessingTime = totalProcessingTime / results.length;
  
  console.log(`📊 Parallel processing stats:`);
  console.log(`   - Total chunks: ${results.length}`);
  console.log(`   - Avg processing time: ${Math.round(avgProcessingTime)}ms`);
  console.log(`   - Total processing time: ${Math.round(totalProcessingTime)}ms`);
  console.log(`   - Successful chunks: ${results.filter(r => r.transcript.length > 0).length}`);

  return results;
}

/**
 * Combine transcription results with overlap handling
 * دمج نتائج التفريغ مع معالجة التداخل
 */
function combineTranscriptionResults(
  results: TranscriptionResult[],
  overlapSeconds: number
): string {
  if (results.length === 0) {
    return '';
  }

  if (results.length === 1) {
    return results[0].transcript;
  }

  let combinedTranscript = results[0].transcript;

  for (let i = 1; i < results.length; i++) {
    const currentTranscript = results[i].transcript;
    
    if (!currentTranscript) {
      continue;
    }

    // Simple overlap handling: remove potential duplicate words at boundaries
    const words = currentTranscript.split(' ');
    const lastWords = combinedTranscript.split(' ').slice(-5); // Last 5 words
    
    // Find overlap and remove duplicates
    let startIndex = 0;
    for (let j = 0; j < Math.min(5, words.length); j++) {
      if (lastWords.includes(words[j])) {
        startIndex = j + 1;
      }
    }

    const cleanTranscript = words.slice(startIndex).join(' ');
    
    if (cleanTranscript) {
      combinedTranscript += ' ' + cleanTranscript;
    }
  }

  return combinedTranscript.trim();
}

/**
 * Single audio buffer transcription (fallback for small files)
 * تفريغ مفرد للصوت (احتياطي للملفات الصغيرة)
 */
async function transcribeAudioBufferSingle(
  audioBuffer: Buffer,
  options: { language: string; timeout: number }
): Promise<string> {
  const { language } = options;

  try {
    // Use OpenAI Whisper for transcription
    const result = await transcribeAudioWithOpenAI(audioBuffer, {
      language,
      model: 'whisper-1',
      response_format: 'json',
      temperature: 0,
    });

    // Handle both string and object responses
    const transcript = typeof result === 'string' ? result : result.text;
    return transcript;
  } catch (error) {
    console.error(`❌ OpenAI Whisper transcription failed:`, error);
    throw error;
  }
}

/**
 * Get temp directory
 * الحصول على مجلد مؤقت
 */
function getTempDir(): string {
  const tempDir = path.join(os.tmpdir(), 'parallel-stt');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Cleanup temporary files
 * تنظيف الملفات المؤقتة
 */
async function cleanup(tempAudioPath: string | null, chunks: AudioChunk[]): Promise<void> {
  console.log('\n🗑️  Starting cleanup...');

  // Clean up main temp audio file
  if (tempAudioPath && fs.existsSync(tempAudioPath)) {
    try {
      fs.unlinkSync(tempAudioPath);
      console.log(`✅ Deleted temp audio: ${path.basename(tempAudioPath)}`);
    } catch (error) {
      console.warn(`⚠️  Could not delete temp audio: ${error}`);
    }
  }

  // Clean up chunk files
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

  console.log('✅ Cleanup completed');
}

/**
 * Main function is already exported above
 */

/**
 * Segment with absolute timestamps (adjusted for chunk position)
 * جزء مع توقيتات مطلقة (معدّلة حسب موقع الـ chunk)
 */
export interface TimestampedSegment {
  start: number;  // seconds from beginning of full audio
  end: number;    // seconds from beginning of full audio
  text: string;
}

/**
 * Result of transcription with timestamps
 */
export interface TranscriptionWithTimestampsResult {
  text: string;
  segments: TimestampedSegment[];
  duration: number;
}

/**
 * Transcribe audio buffer with timestamps using parallel processing
 * تفريغ الصوت مع التوقيتات باستخدام المعالجة المتوازية
 * 
 * يرجع النص الكامل + segments مع start/end لكل جملة
 * مفيد لاقتراح أفضل المقاطع مع توقيتات حقيقية
 */
export async function transcribeAudioBufferParallelWithTimestamps(
  audioBuffer: Buffer,
  options: ParallelSTTOptions = {}
): Promise<TranscriptionWithTimestampsResult> {
  const {
    language = 'ar',
    chunkDurationSeconds = parseInt(process.env.STT_CHUNK_DURATION_SECONDS || '300'),
    maxConcurrentRequests = parseInt(process.env.STT_MAX_CONCURRENT_REQUESTS || '3'),
    timeout = 120000,
    overlapSeconds = parseInt(process.env.STT_OVERLAP_SECONDS || '3')
  } = options;

  console.log(`\n🚀 [${new Date().toISOString()}] Starting Parallel STT with Timestamps`);
  console.log(`📊 Audio Buffer Size: ${audioBuffer.length} bytes`);
  console.log(`🔄 Chunk Duration: ${chunkDurationSeconds}s`);
  console.log(`⚡ Max Concurrent: ${maxConcurrentRequests}`);

  const tempDir = getTempDir();
  let tempAudioPath: string | null = null;
  let chunks: AudioChunk[] = [];

  try {
    // Save audio buffer to temporary file
    tempAudioPath = path.join(tempDir, `temp-audio-ts-${randomUUID()}.mp3`);
    fs.writeFileSync(tempAudioPath, audioBuffer);

    // Get audio duration
    const duration = await getAudioDuration(tempAudioPath);
    console.log(`⏱️  Audio duration: ${Math.round(duration)}s`);

    // Short audio — single request with timestamps
    if (duration <= chunkDurationSeconds * 1.5) {
      console.log('📝 Audio is short, using single request with timestamps...');
      const result = await transcribeAudioWithOpenAI(audioBuffer, {
        language,
        model: 'whisper-1',
        temperature: 0,
        includeTimestamps: true,
      });

      if (typeof result === 'string') {
        return { text: result, segments: [], duration };
      }

      return {
        text: result.text,
        segments: result.segments.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
        duration: result.duration || duration,
      };
    }

    // Split audio into chunks
    chunks = await splitAudioIntoChunks(tempAudioPath, {
      chunkDurationSeconds,
      overlapSeconds,
      maxConcurrentRequests
    });

    console.log(`📦 Audio split into ${chunks.length} chunks for timestamped transcription`);

    // Process chunks in parallel with timestamps
    const allSegments: TimestampedSegment[] = [];
    let fullText = '';

    for (let i = 0; i < chunks.length; i += maxConcurrentRequests) {
      const batch = chunks.slice(i, i + maxConcurrentRequests);

      const batchPromises = batch.map(async (chunk) => {
        try {
          const chunkBuffer = fs.readFileSync(chunk.filePath);

          // Request verbose_json to get segments with timestamps
          const result = await transcribeAudioWithOpenAI(chunkBuffer, {
            language,
            model: 'whisper-1',
            temperature: 0,
            includeTimestamps: true,
          });

          if (typeof result === 'string') {
            // Fallback: no segments available
            return {
              chunkStartTime: chunk.startTime,
              text: result,
              segments: [] as TimestampedSegment[],
            };
          }

          // Adjust segment timestamps to absolute position in full audio
          const adjustedSegments: TimestampedSegment[] = result.segments.map(seg => ({
            start: seg.start + chunk.startTime,
            end: seg.end + chunk.startTime,
            text: seg.text,
          }));

          return {
            chunkStartTime: chunk.startTime,
            text: result.text,
            segments: adjustedSegments,
          };
        } catch (error) {
          console.error(`❌ Chunk ${chunk.index} timestamps failed:`, error);
          return {
            chunkStartTime: chunk.startTime,
            text: '',
            segments: [] as TimestampedSegment[],
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      for (const result of batchResults) {
        if (result.text) {
          fullText += (fullText ? ' ' : '') + result.text;
        }
        allSegments.push(...result.segments);
      }

      // Delay between batches
      if (i + maxConcurrentRequests < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Sort segments by start time
    allSegments.sort((a, b) => a.start - b.start);

    // Remove duplicate segments from overlap regions
    const deduplicatedSegments = deduplicateSegments(allSegments, overlapSeconds);

    console.log(`✅ Timestamped transcription completed`);
    console.log(`📝 Text: ${fullText.length} chars, Segments: ${deduplicatedSegments.length}`);

    return {
      text: fullText.trim(),
      segments: deduplicatedSegments,
      duration,
    };

  } finally {
    await cleanup(tempAudioPath, chunks);
  }
}

/**
 * Remove duplicate segments from overlap regions
 * إزالة الـ segments المكررة من مناطق التداخل
 */
function deduplicateSegments(segments: TimestampedSegment[], overlapSeconds: number): TimestampedSegment[] {
  if (segments.length <= 1) return segments;

  const result: TimestampedSegment[] = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const current = segments[i];
    const last = result[result.length - 1];

    // Skip if this segment overlaps significantly with the last one
    if (current.start < last.end - 0.5) {
      // If the current segment has more text, replace the last one
      if (current.text.length > last.text.length) {
        result[result.length - 1] = current;
      }
      continue;
    }

    result.push(current);
  }

  return result;
}

/**
 * Format transcript with inline timestamps for LLM consumption
 * تنسيق النص مع التوقيتات لاستخدام الـ LLM
 * 
 * Output format:
 * [00:00] أول جملة في التفريغ
 * [00:05] ثاني جملة في التفريغ
 * [01:30] جملة بعد دقيقة ونص
 */
export function formatTranscriptWithTimestamps(result: TranscriptionWithTimestampsResult): string {
  if (!result.segments || result.segments.length === 0) {
    return result.text;
  }

  return result.segments
    .map(seg => {
      const timestamp = formatTime(seg.start);
      return `[${timestamp}] ${seg.text.trim()}`;
    })
    .join('\n');
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}