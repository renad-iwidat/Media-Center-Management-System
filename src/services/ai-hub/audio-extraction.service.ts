/**
 * Audio Extraction Service
 * Extracts audio from video files
 * يستخرج الصوت من ملفات الفيديو
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);

// Get the correct temp directory for the OS
const getTempDir = () => {
  const tempDir = path.join(os.tmpdir(), 'media-center-audio-extraction');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
};

interface ExtractionOptions {
  outputFormat?: 'mp3' | 'wav' | 'aac';
  bitrate?: string;
  timeout?: number;
}

/**
 * Extract audio from video file URL
 * استخرج الصوت من رابط فيديو
 */
export async function extractAudioFromVideoUrl(
  videoUrl: string,
  options: ExtractionOptions = {}
): Promise<Buffer> {
  try {
    const outputFormat = options.outputFormat || 'mp3';
    const bitrate = options.bitrate || '128k';
    const timeout = options.timeout || 300000; // 5 minutes default

    console.log(`\n🎬 [${new Date().toISOString()}] Starting Audio Extraction from Video URL`);
    console.log(`🌐 Video URL: ${videoUrl}`);
    console.log(`🎵 Output Format: ${outputFormat}`);
    console.log(`📊 Bitrate: ${bitrate}`);

    // Download video file
    console.log('📥 Downloading video file...');
    const videoBuffer = await downloadVideoFile(videoUrl, timeout);
    console.log(`✅ Video downloaded (${videoBuffer.length} bytes)`);

    // Save video to temporary file
    const tempDir = getTempDir();
    const tempVideoPath = path.join(tempDir, `video-${Date.now()}.mp4`);
    fs.writeFileSync(tempVideoPath, videoBuffer);
    console.log(`💾 Video saved to: ${tempVideoPath}`);

    // Extract audio
    const audioBuffer = await extractAudioFromFile(tempVideoPath, options);

    // Clean up temporary video file
    fs.unlinkSync(tempVideoPath);
    console.log(`🗑️  Temporary video file deleted`);

    return audioBuffer;
  } catch (error) {
    console.error('❌ Audio Extraction Error:', error);
    throw error;
  }
}

/**
 * Extract audio from local video file using fluent-ffmpeg
 * استخرج الصوت من ملف فيديو محلي باستخدام fluent-ffmpeg
 */
export async function extractAudioFromFile(
  videoFilePath: string,
  options: ExtractionOptions = {}
): Promise<Buffer> {
  try {
    const outputFormat = options.outputFormat || 'mp3';
    const bitrate = options.bitrate || '128k';
    const timeout = options.timeout || 300000; // 5 minutes default

    console.log(`\n🎬 [${new Date().toISOString()}] Starting Audio Extraction from File`);
    console.log(`📁 Video File: ${videoFilePath}`);
    console.log(`🎵 Output Format: ${outputFormat}`);
    console.log(`📊 Bitrate: ${bitrate}`);

    // Check if file exists
    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`Video file not found: ${videoFilePath}`);
    }

    // Create temporary output file
    const tempDir = getTempDir();
    const tempAudioPath = path.join(tempDir, `audio-${Date.now()}.${outputFormat}`);

    console.log('🔄 Extracting audio using fluent-ffmpeg...');
    const startTime = Date.now();

    // Extract audio using fluent-ffmpeg
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(videoFilePath)
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format(outputFormat)
        .output(tempAudioPath)
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg command:', commandLine);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`📊 Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Audio extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ FFmpeg error:', err);
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
    console.log(`⏱️  Extraction Time: ${duration}ms`);

    // Read extracted audio file
    if (!fs.existsSync(tempAudioPath)) {
      throw new Error('Audio extraction failed: Output file not created');
    }

    const audioBuffer = fs.readFileSync(tempAudioPath);
    console.log(`✅ Audio extracted (${audioBuffer.length} bytes)`);

    // Clean up temporary audio file
    fs.unlinkSync(tempAudioPath);
    console.log(`🗑️  Temporary audio file deleted`);

    return audioBuffer;
  } catch (error) {
    console.error('❌ Audio Extraction Error:', error);
    throw error;
  }
}

/**
 * Extract audio and save to file using fluent-ffmpeg
 * استخرج الصوت واحفظه في ملف باستخدام fluent-ffmpeg
 */
export async function extractAudioAndSave(
  videoFilePath: string,
  outputFilePath: string,
  options: ExtractionOptions = {}
): Promise<string> {
  try {
    const bitrate = options.bitrate || '128k';
    const timeout = options.timeout || 300000; // 5 minutes default

    console.log(`\n🎬 [${new Date().toISOString()}] Extracting Audio and Saving to File`);
    console.log(`📁 Video File: ${videoFilePath}`);
    console.log(`💾 Output File: ${outputFilePath}`);
    console.log(`📊 Bitrate: ${bitrate}`);

    // Check if file exists
    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`Video file not found: ${videoFilePath}`);
    }

    console.log('🔄 Extracting audio using fluent-ffmpeg...');
    const startTime = Date.now();

    // Extract audio using fluent-ffmpeg
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(videoFilePath)
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .output(outputFilePath)
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg command:', commandLine);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`📊 Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Audio extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ FFmpeg error:', err);
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
    console.log(`⏱️  Extraction Time: ${duration}ms`);

    // Get file size
    if (!fs.existsSync(outputFilePath)) {
      throw new Error('Audio extraction failed: Output file not created');
    }

    const stats = fs.statSync(outputFilePath);
    console.log(`✅ Audio extracted and saved (${stats.size} bytes)`);

    return outputFilePath;
  } catch (error) {
    console.error('❌ Audio Extraction Error:', error);
    throw error;
  }
}

/**
 * Get video information using fluent-ffmpeg
 * احصل على معلومات الفيديو باستخدام fluent-ffmpeg
 */
export async function getVideoInfo(videoFilePath: string): Promise<any> {
  try {
    console.log(`\n📊 Getting video information: ${videoFilePath}`);

    if (!fs.existsSync(videoFilePath)) {
      throw new Error(`Video file not found: ${videoFilePath}`);
    }

    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoFilePath, (err: Error | null, metadata: any) => {
        if (err) {
          console.error('❌ Error getting video info:', err);
          reject(err);
          return;
        }

        console.log(`✅ Video information retrieved`);

        const info = {
          format: metadata.format,
          streams: metadata.streams,
          duration: metadata.format?.duration,
          bitrate: metadata.format?.bit_rate,
          hasAudio: metadata.streams?.some((s: any) => s.codec_type === 'audio'),
          hasVideo: metadata.streams?.some((s: any) => s.codec_type === 'video'),
        };

        resolve(info);
      });
    });
  } catch (error) {
    console.error('❌ Error getting video info:', error);
    throw error;
  }
}

/**
 * Download video file from URL with better error handling
 * حمّل ملف الفيديو من رابط مع معالجة أفضل للأخطاء
 */
async function downloadVideoFile(
  videoUrl: string,
  timeout: number
): Promise<Buffer> {
  try {
    console.log(`📥 Downloading video from: ${videoUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`⏰ Download timeout after ${timeout}ms`);
    }, timeout);

    const response = await fetch(videoUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to download video: ${response.status} ${response.statusText}`);
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
      throw new Error(`Download timeout: Video download took longer than ${timeout}ms`);
    }
    console.error('❌ Error downloading video file:', error);
    throw error;
  }
}

/**
 * Supported video formats
 */
export const SUPPORTED_VIDEO_FORMATS = [
  'mp4',
  'avi',
  'mov',
  'mkv',
  'flv',
  'wmv',
  'webm',
  'ogv',
  '3gp',
  'ts',
  'mts',
  'm2ts',
];

/**
 * Supported audio output formats
 */
export const SUPPORTED_AUDIO_FORMATS = ['mp3', 'wav', 'aac', 'flac', 'ogg'];