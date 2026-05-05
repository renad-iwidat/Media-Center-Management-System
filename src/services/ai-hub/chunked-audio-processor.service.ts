/**
 * Chunked Audio Processor Service
 * معالج الصوت المقسم إلى أجزاء
 * 
 * يقسم الصوت الكبير إلى أجزاء صغيرة ويعالجها بشكل متوازي
 * لتسريع عملية التحويل من صوت إلى نص
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface ChunkProcessingOptions {
  chunkDurationSeconds?: number; // Duration of each chunk in seconds
  maxConcurrentChunks?: number; // Max parallel processing
  language?: string;
  timeout?: number;
}

interface AudioChunk {
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  filePath: string;
  size: number;
  transcript?: string;
}

interface ProcessingProgress {
  totalChunks: number;
  processedChunks: number;
  currentChunk: number;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
}

/**
 * Get audio duration in seconds
 * احصل على مدة الصوت بالثواني
 */
export async function getAudioDuration(audioFilePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(audioFilePath, (err: Error | null, metadata: any) => {
      if (err) {
        console.error('❌ Error getting audio duration:', err);
        reject(err);
        return;
      }

      const duration = metadata.format?.duration || 0;
      console.log(`⏱️  Audio Duration: ${duration} seconds (${Math.round(duration / 60)} minutes)`);
      resolve(duration);
    });
  });
}

/**
 * Split audio into chunks
 * قسّم الصوت إلى أجزاء
 */
export async function splitAudioIntoChunks(
  audioFilePath: string,
  options: ChunkProcessingOptions = {}
): Promise<AudioChunk[]> {
  try {
    const chunkDuration = options.chunkDurationSeconds || 300; // 5 minutes default
    const timeout = options.timeout || 600000; // 10 minutes

    console.log(`\n🎵 [${new Date().toISOString()}] Starting Audio Chunking`);
    console.log(`📁 Audio File: ${audioFilePath}`);
    console.log(`⏱️  Chunk Duration: ${chunkDuration} seconds (${Math.round(chunkDuration / 60)} minutes)`);

    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Audio file not found: ${audioFilePath}`);
    }

    // Get audio duration
    const totalDuration = await getAudioDuration(audioFilePath);
    const totalChunks = Math.ceil(totalDuration / chunkDuration);

    console.log(`📊 Total Chunks: ${totalChunks}`);

    const chunks: AudioChunk[] = [];
    const tempDir = path.join(os.tmpdir(), 'media-center-audio-chunks');

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create chunks
    for (let i = 0; i < totalChunks; i++) {
      const startTime = i * chunkDuration;
      const endTime = Math.min((i + 1) * chunkDuration, totalDuration);
      const duration = endTime - startTime;

      const chunkFileName = `chunk-${String(i).padStart(4, '0')}.mp3`;
      const chunkFilePath = path.join(tempDir, chunkFileName);

      console.log(`\n📍 Creating Chunk ${i + 1}/${totalChunks}`);
      console.log(`⏱️  Time Range: ${formatTime(startTime)} - ${formatTime(endTime)} (${formatTime(duration)})`);

      // Extract chunk using ffmpeg
      await new Promise<void>((resolve, reject) => {
        const command = ffmpeg(audioFilePath)
          .setStartTime(startTime)
          .duration(duration)
          .audioCodec('libmp3lame')
          .audioBitrate('128k')
          .format('mp3')
          .output(chunkFilePath)
          .on('start', (commandLine: string) => {
            console.log(`🎬 FFmpeg: ${commandLine.substring(0, 100)}...`);
          })
          .on('progress', (progress: any) => {
            if (progress.percent) {
              console.log(`  📊 Progress: ${Math.round(progress.percent)}%`);
            }
          })
          .on('end', () => {
            console.log(`✅ Chunk ${i + 1} created`);
            resolve();
          })
          .on('error', (err: Error) => {
            console.error(`❌ Error creating chunk ${i + 1}:`, err);
            reject(err);
          });

        // Set timeout
        setTimeout(() => {
          command.kill('SIGKILL');
          reject(new Error(`Chunk creation timeout after ${timeout}ms`));
        }, timeout);

        command.run();
      });

      // Get chunk file size
      const stats = fs.statSync(chunkFilePath);

      chunks.push({
        index: i,
        startTime,
        endTime,
        filePath: chunkFilePath,
        size: stats.size,
      });

      console.log(`💾 Chunk Size: ${formatBytes(stats.size)}`);
    }

    console.log(`\n✅ Audio chunking completed: ${totalChunks} chunks created`);
    console.log(`📊 Total Size: ${formatBytes(chunks.reduce((sum, c) => sum + c.size, 0))}`);

    return chunks;
  } catch (error) {
    console.error('❌ Audio Chunking Error:', error);
    throw error;
  }
}

/**
 * Process audio chunks in parallel
 * معالجة أجزاء الصوت بشكل متوازي
 */
export async function processAudioChunksInParallel(
  chunks: AudioChunk[],
  processingFunction: (chunk: AudioChunk) => Promise<string>,
  options: ChunkProcessingOptions = {}
): Promise<AudioChunk[]> {
  try {
    const maxConcurrent = options.maxConcurrentChunks || 2; // Default to 2 for OpenAI balance

    console.log(`\n🔄 [${new Date().toISOString()}] Starting Chunk Processing`);
    console.log(`📊 Total Chunks: ${chunks.length}`);
    console.log(`⚡ Max Concurrent: ${maxConcurrent}`);
    
    if (maxConcurrent === 1) {
      console.log(`📝 Sequential processing mode (for stability)`);
    } else {
      console.log(`🚀 Parallel processing mode (${maxConcurrent} concurrent)`);
    }

    const processedChunks: AudioChunk[] = new Array(chunks.length);
    const startTime = Date.now();
    let completedCount = 0;

    if (maxConcurrent === 1) {
      // Sequential processing for maximum stability
      for (const chunk of chunks) {
        try {
          console.log(`🎵 Processing Chunk ${chunk.index + 1}/${chunks.length} sequentially...`);
          const chunkStartTime = Date.now();
          const transcript = await processingFunction(chunk);
          const chunkDuration = Date.now() - chunkStartTime;
          
          processedChunks[chunk.index] = { ...chunk, transcript };
          completedCount++;
          
          console.log(`✅ Chunk ${chunk.index + 1} completed in ${formatDuration(chunkDuration)} (${transcript.length} chars)`);

          // Calculate progress
          const progress = Math.round((completedCount / chunks.length) * 100);
          const elapsedTime = Date.now() - startTime;
          const estimatedTotalTime = (elapsedTime / completedCount) * chunks.length;
          const estimatedRemaining = estimatedTotalTime - elapsedTime;

          console.log(`📊 Progress: ${progress}% | Elapsed: ${formatDuration(elapsedTime)} | Remaining: ${formatDuration(estimatedRemaining)}`);
          
          // Small delay between chunks to be respectful to APIs
          if (chunk.index < chunks.length - 1) {
            console.log(`⏳ Waiting 1s before next chunk...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`❌ Error processing chunk ${chunk.index + 1}:`, error);
          throw error;
        }
      }
    } else {
      // Parallel processing with concurrency control (good for OpenAI)
      const queue = [...chunks];
      const activePromises = new Set<Promise<void>>();

      const processChunk = async (chunk: AudioChunk): Promise<void> => {
        try {
          console.log(`🎵 Processing Chunk ${chunk.index + 1}/${chunks.length} (parallel)...`);
          const chunkStartTime = Date.now();
          const transcript = await processingFunction(chunk);
          const chunkDuration = Date.now() - chunkStartTime;
          
          processedChunks[chunk.index] = { ...chunk, transcript };
          completedCount++;
          
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
    }

    const totalDuration = Date.now() - startTime;
    console.log(`\n✅ All chunks processed in ${formatDuration(totalDuration)}`);

    return processedChunks.filter(Boolean);
  } catch (error) {
    console.error('❌ Chunk Processing Error:', error);
    throw error;
  }
}

/**
 * Combine transcripts from chunks
 * دمج النصوص من الأجزاء
 */
export function combineTranscripts(chunks: AudioChunk[]): string {
  console.log(`\n📝 Combining ${chunks.length} transcripts...`);

  const sortedChunks = [...chunks].sort((a, b) => a.index - b.index);
  const combinedTranscript = sortedChunks
    .map((chunk) => chunk.transcript || '')
    .filter((text) => text.length > 0)
    .join(' ');

  console.log(`✅ Transcripts combined: ${combinedTranscript.length} characters`);

  return combinedTranscript;
}

/**
 * Clean up temporary chunk files
 * حذف ملفات الأجزاء المؤقتة
 */
export async function cleanupChunks(chunks: AudioChunk[]): Promise<void> {
  console.log(`\n🗑️  Cleaning up ${chunks.length} chunk files...`);

  for (const chunk of chunks) {
    try {
      if (fs.existsSync(chunk.filePath)) {
        fs.unlinkSync(chunk.filePath);
        console.log(`  ✅ Deleted: ${path.basename(chunk.filePath)}`);
      }
    } catch (error) {
      console.error(`  ❌ Error deleting ${chunk.filePath}:`, error);
    }
  }

  console.log(`✅ Cleanup completed`);
}

/**
 * Format time in seconds to HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format bytes to human readable format
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format duration in milliseconds to readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Export utility functions
 */
export { formatTime, formatBytes, formatDuration };
