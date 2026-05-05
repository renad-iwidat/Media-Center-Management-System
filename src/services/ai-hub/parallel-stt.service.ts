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
    chunkDurationSeconds = parseInt(process.env.STT_CHUNK_DURATION_SECONDS || '30'),
    maxConcurrentRequests = parseInt(process.env.STT_MAX_CONCURRENT_REQUESTS || '3'),
    timeout = 60000,
    overlapSeconds = parseInt(process.env.STT_OVERLAP_SECONDS || '2')
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
      console.log('📝 Audio is short, using single request...');
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
  const sttApiUrl = process.env.AI_MODEL;
  
  if (!sttApiUrl) {
    throw new Error('AI_MODEL environment variable is not configured');
  }

  const { language, timeout } = options;

  // Create FormData with audio file
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/mpeg' });
  formData.append('file', audioBlob, 'audio.mp3');
  formData.append('language', language);

  const response = await fetch(`${sttApiUrl}/stt`, {
    method: 'POST',
    body: formData,
    // Increase timeout to 5 minutes for large audio files
    signal: AbortSignal.timeout(Math.max(timeout, 300000)), // At least 5 minutes
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`STT API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`STT error: ${data.error}`);
  }

  return data.transcript || '';
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