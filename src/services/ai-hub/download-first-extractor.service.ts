/**
 * Download-First Audio Extractor Service
 * خدمة استخراج الصوت بالتحميل أولاً
 * 
 * This service downloads the entire video first, then processes it in chunks
 * هذه الخدمة تحمل الفيديو كاملاً أولاً، ثم تعالجه على شكل أجزاء
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import https from 'https';
import http from 'http';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set FFmpeg path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Get temp directory
const getTempDir = () => {
  const tempDir = path.join(os.tmpdir(), 'media-center-download-first');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

interface DownloadFirstOptions {
  outputFormat?: 'mp3' | 'wav' | 'aac';
  bitrate?: string;
  timeout?: number;
  maxFileSize?: number; // Maximum video file size in bytes
  enableChunking?: boolean;
  chunkDurationSeconds?: number;
  maxConcurrentChunks?: number;
}

interface DownloadProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

interface ProcessingResult {
  audioBuffer?: Buffer;
  transcript?: string;
  chunks?: any[];
  videoSize: number;
  audioSize: number;
  processingTime: number;
}

/**
 * Download video file from URL with progress tracking
 * تحميل ملف الفيديو من الرابط مع تتبع التقدم
 */
async function downloadVideoFile(
  videoUrl: string,
  options: DownloadFirstOptions = {}
): Promise<{ filePath: string; size: number }> {
  const maxFileSize = options.maxFileSize || parseInt(process.env.MAX_VIDEO_DOWNLOAD_SIZE_MB || '1024') * 1024 * 1024; // 1GB default
  const timeout = options.timeout || 1200000; // 20 minutes default for large files

  console.log(`\n📥 [${new Date().toISOString()}] Starting Video Download`);
  console.log(`🌐 Video URL: ${videoUrl}`);
  console.log(`📊 Max File Size: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
  console.log(`⏱️  Timeout: ${timeout / 1000}s`);

  const tempDir = getTempDir();
  const videoFileName = `video-${randomUUID()}.mp4`;
  const videoFilePath = path.join(tempDir, videoFileName);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let downloadedBytes = 0;
    let totalBytes = 0;

    // Choose appropriate module based on URL protocol
    const client = videoUrl.startsWith('https:') ? https : http;

    const request = client.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'video/*, */*',
        'Accept-Encoding': 'identity', // Disable compression for accurate size tracking
      },
      timeout: timeout
    }, (response) => {
      // Check response status
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      // Get total file size
      const contentLength = response.headers['content-length'];
      if (contentLength) {
        totalBytes = parseInt(contentLength, 10);
        console.log(`📊 Video file size: ${Math.round(totalBytes / 1024 / 1024)}MB`);

        // Check if file is too large
        if (totalBytes > maxFileSize) {
          reject(new Error(`Video file too large: ${Math.round(totalBytes / 1024 / 1024)}MB (max: ${Math.round(maxFileSize / 1024 / 1024)}MB)`));
          return;
        }
      } else {
        console.log('⚠️  Content-Length header not found, downloading without size limit');
      }

      // Create write stream
      const writeStream = fs.createWriteStream(videoFilePath);
      let lastProgressTime = Date.now();

      // Track download progress
      response.on('data', (chunk: Buffer) => {
        downloadedBytes += chunk.length;

        // Check size limit during download
        if (downloadedBytes > maxFileSize) {
          writeStream.destroy();
          fs.unlinkSync(videoFilePath);
          reject(new Error(`Download exceeded size limit: ${Math.round(downloadedBytes / 1024 / 1024)}MB`));
          return;
        }

        // Log progress every 3 seconds for large files
        const now = Date.now();
        const progressInterval = totalBytes > 100 * 1024 * 1024 ? 3000 : 5000; // 3s for files >100MB, 5s for smaller
        if (now - lastProgressTime > progressInterval) {
          const percentage = totalBytes > 0 ? Math.round((downloadedBytes / totalBytes) * 100) : 0;
          const speed = downloadedBytes / ((now - startTime) / 1000); // bytes per second
          const speedMB = Math.round(speed / 1024 / 1024 * 100) / 100; // MB/s

          console.log(`📥 Download Progress: ${Math.round(downloadedBytes / 1024 / 1024)}MB${totalBytes > 0 ? ` (${percentage}%)` : ''} - ${speedMB}MB/s`);
          lastProgressTime = now;
        }

        writeStream.write(chunk);
      });

      response.on('end', () => {
        writeStream.end();
        const duration = Date.now() - startTime;
        const avgSpeed = downloadedBytes / (duration / 1000); // bytes per second
        const avgSpeedMB = Math.round(avgSpeed / 1024 / 1024 * 100) / 100; // MB/s

        console.log(`✅ Download completed: ${Math.round(downloadedBytes / 1024 / 1024)}MB in ${Math.round(duration / 1000)}s (avg: ${avgSpeedMB}MB/s)`);
        
        resolve({
          filePath: videoFilePath,
          size: downloadedBytes
        });
      });

      response.on('error', (error) => {
        writeStream.destroy();
        if (fs.existsSync(videoFilePath)) {
          fs.unlinkSync(videoFilePath);
        }
        reject(new Error(`Download stream error: ${error.message}`));
      });

      // Pipe response to file
      response.pipe(writeStream);

      writeStream.on('error', (error) => {
        if (fs.existsSync(videoFilePath)) {
          fs.unlinkSync(videoFilePath);
        }
        reject(new Error(`Write stream error: ${error.message}`));
      });
    });

    request.on('error', (error) => {
      reject(new Error(`Request error: ${error.message}`));
    });

    request.on('timeout', () => {
      request.destroy();
      if (fs.existsSync(videoFilePath)) {
        fs.unlinkSync(videoFilePath);
      }
      reject(new Error(`Download timeout after ${timeout / 1000}s`));
    });
  });
}

/**
 * Extract audio from downloaded video file
 * استخراج الصوت من ملف الفيديو المحمل
 */
async function extractAudioFromDownloadedVideo(
  videoFilePath: string,
  options: DownloadFirstOptions = {}
): Promise<Buffer> {
  const outputFormat = options.outputFormat || 'mp3';
  const bitrate = options.bitrate || '128k';
  const timeout = options.timeout || 300000; // 5 minutes

  console.log(`\n🎵 [${new Date().toISOString()}] Extracting Audio from Downloaded Video`);
  console.log(`📁 Video File: ${path.basename(videoFilePath)}`);
  console.log(`🎵 Output Format: ${outputFormat}`);
  console.log(`📊 Bitrate: ${bitrate}`);

  const tempDir = getTempDir();
  const audioFileName = `audio-${randomUUID()}.${outputFormat}`;
  const audioFilePath = path.join(tempDir, audioFileName);

  try {
    const startTime = Date.now();

    // Extract audio using FFmpeg
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(videoFilePath)
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format(outputFormat)
        .output(audioFilePath)
        .outputOptions([
          '-vn',              // ignore video
          '-ac', '2',         // stereo
          '-ar', '44100',     // sample rate
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts'
        ])
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg command:', commandLine.substring(0, 150) + '...');
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`📊 Audio Extraction Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Audio extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ FFmpeg error:', err.message);
          reject(err);
        });

      // Set timeout
      setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error(`Audio extraction timeout after ${timeout}ms`));
      }, timeout);

      command.run();
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Audio Extraction Time: ${Math.round(duration / 1000)}s`);

    // Read extracted audio file
    if (!fs.existsSync(audioFilePath)) {
      throw new Error('Audio extraction failed: Output file not created');
    }

    const audioBuffer = fs.readFileSync(audioFilePath);
    console.log(`✅ Audio extracted: ${Math.round(audioBuffer.length / 1024)}KB`);

    // Clean up audio file
    fs.unlinkSync(audioFilePath);
    console.log(`🗑️  Temporary audio file deleted`);

    return audioBuffer;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(audioFilePath)) {
      fs.unlinkSync(audioFilePath);
    }
    throw error;
  }
}

/**
 * Process video with download-first approach and chunked transcription
 * معالجة الفيديو بطريقة التحميل أولاً والتفريغ المقسم
 */
export async function processVideoWithDownloadFirst(
  videoUrl: string,
  transcriptionFunction: (audioBuffer: Buffer) => Promise<string>,
  options: DownloadFirstOptions = {}
): Promise<ProcessingResult> {
  const enableChunking = options.enableChunking ?? true;
  const chunkDuration = options.chunkDurationSeconds || 180; // 3 minutes
  const maxConcurrent = options.maxConcurrentChunks || 3;

  console.log(`\n🚀 [${new Date().toISOString()}] Starting Download-First Video Processing`);
  console.log(`🌐 Video URL: ${videoUrl}`);
  console.log(`🔄 Chunking Enabled: ${enableChunking}`);
  console.log(`⏱️  Chunk Duration: ${chunkDuration}s`);
  console.log(`⚡ Max Concurrent: ${maxConcurrent}`);

  const startTime = Date.now();
  let videoFilePath: string | null = null;
  let tempAudioPath: string | null = null;
  let chunks: any[] = [];

  try {
    // Step 1: Download video file
    console.log('\n📥 Step 1: Downloading video file...');
    const downloadResult = await downloadVideoFile(videoUrl, options);
    videoFilePath = downloadResult.filePath;
    const videoSize = downloadResult.size;

    console.log(`✅ Video downloaded: ${path.basename(videoFilePath)} (${Math.round(videoSize / 1024 / 1024)}MB)`);

    // Step 2: Extract audio from downloaded video
    console.log('\n🎵 Step 2: Extracting audio from downloaded video...');
    const audioBuffer = await extractAudioFromDownloadedVideo(videoFilePath, options);
    const audioSize = audioBuffer.length;

    console.log(`✅ Audio extracted: ${Math.round(audioSize / 1024)}KB`);

    // Step 3: Process audio (with or without chunking)
    let transcript: string;

    if (!enableChunking) {
      console.log('\n📝 Step 3: Processing audio as single file...');
      transcript = await transcriptionFunction(audioBuffer);
    } else {
      // Save audio to temporary file for chunking
      const tempDir = getTempDir();
      tempAudioPath = path.join(tempDir, `temp-audio-${randomUUID()}.mp3`);
      fs.writeFileSync(tempAudioPath, audioBuffer);
      console.log(`💾 Temporary audio saved for chunking: ${path.basename(tempAudioPath)}`);

      // Check if chunking is needed
      const { getAudioDuration } = await import('./chunked-audio-processor.service');
      const duration = await getAudioDuration(tempAudioPath);

      if (duration <= chunkDuration) {
        console.log(`\n📝 Step 3: Audio duration (${Math.round(duration)}s) is short, processing as single file...`);
        transcript = await transcriptionFunction(audioBuffer);
      } else {
        console.log(`\n🔄 Step 3: Audio duration (${Math.round(duration)}s) requires chunking...`);
        
        const { 
          splitAudioIntoChunks, 
          processAudioChunksInParallel, 
          combineTranscripts, 
          cleanupChunks 
        } = await import('./chunked-audio-processor.service');

        // Split into chunks
        chunks = await splitAudioIntoChunks(tempAudioPath, {
          chunkDurationSeconds: chunkDuration,
          maxConcurrentChunks: maxConcurrent,
          timeout: options.timeout
        });

        console.log(`📦 Audio split into ${chunks.length} chunks`);

        // Process chunks in parallel
        const processedChunks = await processAudioChunksInParallel(
          chunks,
          async (chunk) => {
            const chunkBuffer = fs.readFileSync(chunk.filePath);
            return await transcriptionFunction(chunkBuffer);
          },
          { maxConcurrentChunks: maxConcurrent }
        );

        // Combine results
        transcript = combineTranscripts(processedChunks);
        console.log(`✅ Chunked processing completed: ${transcript.length} characters`);
      }
    }

    const processingTime = Date.now() - startTime;

    console.log(`\n🎉 Processing completed successfully!`);
    console.log(`⏱️  Total Processing Time: ${Math.round(processingTime / 1000)}s`);
    console.log(`📊 Video Size: ${Math.round(videoSize / 1024 / 1024)}MB`);
    console.log(`📊 Audio Size: ${Math.round(audioSize / 1024)}KB`);
    console.log(`📝 Transcript Length: ${transcript.length} characters`);

    return {
      audioBuffer,
      transcript,
      chunks: chunks.length > 0 ? chunks : undefined,
      videoSize,
      audioSize,
      processingTime
    };

  } finally {
    // Comprehensive cleanup
    console.log('\n🗑️  Starting comprehensive cleanup...');

    // Clean up video file
    if (videoFilePath && fs.existsSync(videoFilePath)) {
      try {
        fs.unlinkSync(videoFilePath);
        console.log(`✅ Deleted video file: ${path.basename(videoFilePath)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete video file: ${error}`);
      }
    }

    // Clean up temporary audio file
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
        console.log(`✅ Deleted temp audio: ${path.basename(tempAudioPath)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete temp audio: ${error}`);
      }
    }

    // Clean up chunk files
    if (chunks.length > 0) {
      try {
        const { cleanupChunks } = await import('./chunked-audio-processor.service');
        await cleanupChunks(chunks);
        console.log(`✅ Deleted ${chunks.length} chunk files`);
      } catch (error) {
        console.warn('⚠️  Error during chunk cleanup:', error);
      }
    }

    // Clean up temp directory if empty
    try {
      const tempDir = getTempDir();
      const files = fs.readdirSync(tempDir);
      if (files.length === 0) {
        fs.rmdirSync(tempDir);
        console.log(`✅ Deleted empty temp directory`);
      } else {
        console.log(`📁 Temp directory not empty (${files.length} files remaining)`);
      }
    } catch (error) {
      console.log('📁 Temp directory cleanup skipped');
    }

    console.log('✅ Comprehensive cleanup completed');
  }
}

/**
 * Simple download-first extraction (without transcription)
 * استخراج بسيط بطريقة التحميل أولاً (بدون تفريغ)
 */
export async function extractAudioWithDownloadFirst(
  videoUrl: string,
  options: DownloadFirstOptions = {}
): Promise<{ audioBuffer: Buffer; videoSize: number; processingTime: number }> {
  console.log(`\n🚀 [${new Date().toISOString()}] Starting Simple Download-First Audio Extraction`);
  
  const startTime = Date.now();
  let videoFilePath: string | null = null;

  try {
    // Download video
    const downloadResult = await downloadVideoFile(videoUrl, options);
    videoFilePath = downloadResult.filePath;
    const videoSize = downloadResult.size;

    // Extract audio
    const audioBuffer = await extractAudioFromDownloadedVideo(videoFilePath, options);
    
    const processingTime = Date.now() - startTime;

    console.log(`✅ Simple extraction completed in ${Math.round(processingTime / 1000)}s`);

    return {
      audioBuffer,
      videoSize,
      processingTime
    };

  } finally {
    // Clean up video file
    if (videoFilePath && fs.existsSync(videoFilePath)) {
      try {
        fs.unlinkSync(videoFilePath);
        console.log(`🗑️  Video file deleted: ${path.basename(videoFilePath)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete video file: ${error}`);
      }
    }
  }
}

/**
 * Get video information from URL (downloads first few MB to analyze)
 * الحصول على معلومات الفيديو من الرابط (يحمل أول بضعة ميجابايت للتحليل)
 */
export async function getVideoInfoFromUrl(videoUrl: string): Promise<any> {
  console.log(`\n📊 Getting video information from URL: ${videoUrl}`);
  
  let tempVideoPath: string | null = null;

  try {
    // Download first 10MB for analysis
    const partialDownload = await downloadVideoFile(videoUrl, {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      timeout: 60000 // 1 minute
    });

    tempVideoPath = partialDownload.filePath;

    // Get video info using FFprobe
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempVideoPath!, (err: Error | null, metadata: any) => {
        if (err) {
          reject(err);
          return;
        }

        const info = {
          format: metadata.format,
          streams: metadata.streams,
          duration: metadata.format?.duration,
          bitrate: metadata.format?.bit_rate,
          hasAudio: metadata.streams?.some((s: any) => s.codec_type === 'audio'),
          hasVideo: metadata.streams?.some((s: any) => s.codec_type === 'video'),
          estimatedSize: partialDownload.size
        };

        resolve(info);
      });
    });

  } finally {
    // Clean up partial download
    if (tempVideoPath && fs.existsSync(tempVideoPath)) {
      try {
        fs.unlinkSync(tempVideoPath);
        console.log(`🗑️  Partial download deleted`);
      } catch (error) {
        console.warn(`⚠️  Could not delete partial download: ${error}`);
      }
    }
  }
}