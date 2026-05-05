/**
 * Audio Extraction Service
 * Extracts audio from video files
 * يستخرج الصوت من ملفات الفيديو
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set FFmpeg path - use ffmpeg-static for reliable cross-platform support
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
  console.log(`✅ FFmpeg path set to: ${ffmpegStatic}`);
} else {
  console.warn('⚠️  ffmpeg-static not found, using system ffmpeg');
}

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
 * Extract audio from video file URL with integrated chunked processing
 * استخرج الصوت من رابط فيديو مع معالجة مقسمة متكاملة
 * 
 * يحمل الفيديو على شكل stream، يحوله لصوت، ثم يقسمه ويعالجه بشكل متوازي
 */
export async function extractAudioFromVideoUrl(
  videoUrl: string,
  options: ExtractionOptions = {}
): Promise<Buffer> {
  const outputFormat = options.outputFormat || 'mp3';
  const bitrate = options.bitrate || '128k';
  const timeout = options.timeout || 300000; // 5 minutes default

  console.log(`\n🎬 [${new Date().toISOString()}] Starting Streaming Audio Extraction`);
  console.log(`🌐 Video URL: ${videoUrl}`);
  console.log(`🎵 Output Format: ${outputFormat}`);
  console.log(`📊 Bitrate: ${bitrate}`);

  let tempAudioPath: string | null = null;

  try {
    // Try direct ffmpeg first (works for most URLs)
    try {
      console.log('🚀 Attempting direct ffmpeg extraction from URL...');
      return await extractAudioDirectFromUrl(videoUrl, options);
    } catch (directError) {
      const directErrorMessage = directError instanceof Error ? directError.message : String(directError);
      console.log('⚠️  Direct ffmpeg failed, trying streaming extraction...');
      console.log(`❌ Direct error: ${directErrorMessage}`);
      
      // Fallback: Stream video and extract audio on-the-fly
      try {
        const result = await extractAudioWithStreamingDownload(videoUrl, options);
        return result;
      } catch (streamError) {
        const streamErrorMessage = streamError instanceof Error ? streamError.message : String(streamError);
        console.error('❌ Both methods failed!');
        console.error('Direct method error:', directErrorMessage);
        console.error('Streaming method error:', streamErrorMessage);
        throw new Error(`Audio extraction failed: ${streamErrorMessage}`);
      }
    }
  } finally {
    // Ensure cleanup of any temporary files
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
        console.log(`🗑️  Final cleanup: Deleted ${tempAudioPath}`);
      } catch (cleanupError) {
        console.warn(`⚠️  Warning: Could not delete ${tempAudioPath}:`, cleanupError);
      }
    }
  }
}

/**
 * Extract audio with automatic chunked processing for large files
 * استخراج الصوت مع معالجة مقسمة تلقائية للملفات الكبيرة
 */
export async function extractAudioWithChunkedProcessing(
  videoUrl: string,
  transcriptionFunction: (audioBuffer: Buffer) => Promise<string>,
  options: ExtractionOptions & { 
    enableChunking?: boolean;
    chunkDurationSeconds?: number;
    maxConcurrentChunks?: number;
  } = {}
): Promise<{ audioBuffer: Buffer; transcript?: string; chunks?: any[] }> {
  const enableChunking = options.enableChunking ?? true;
  const chunkDuration = options.chunkDurationSeconds || 180; // 3 minutes default
  const maxConcurrent = options.maxConcurrentChunks || 3;

  console.log(`\n🎯 [${new Date().toISOString()}] Starting Audio Extraction with Chunked Processing`);
  console.log(`🔄 Chunking Enabled: ${enableChunking}`);
  console.log(`⏱️  Chunk Duration: ${chunkDuration}s`);
  console.log(`⚡ Max Concurrent: ${maxConcurrent}`);

  let tempAudioPath: string | null = null;
  let chunks: any[] = [];

  try {
    // Step 1: Extract audio from video
    console.log('🎵 Step 1: Extracting audio from video...');
    const audioBuffer = await extractAudioFromVideoUrl(videoUrl, options);
    
    if (!enableChunking) {
      console.log('📝 Chunking disabled, processing as single file...');
      const transcript = await transcriptionFunction(audioBuffer);
      return { audioBuffer, transcript };
    }

    // Step 2: Save audio to temporary file for chunking
    const tempDir = getTempDir();
    tempAudioPath = path.join(tempDir, `temp-audio-${Date.now()}.mp3`);
    fs.writeFileSync(tempAudioPath, audioBuffer);
    console.log(`💾 Temporary audio saved: ${tempAudioPath}`);

    // Step 3: Check if chunking is needed (for files > 2 minutes)
    const { getAudioDuration } = await import('./chunked-audio-processor.service');
    const duration = await getAudioDuration(tempAudioPath);
    
    if (duration <= chunkDuration) {
      console.log(`⏭️  Audio duration (${Math.round(duration)}s) is short, processing as single file...`);
      const transcript = await transcriptionFunction(audioBuffer);
      return { audioBuffer, transcript };
    }

    // Step 4: Process with chunking for large files
    console.log(`🔄 Audio duration (${Math.round(duration)}s) requires chunking...`);
    
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
    const finalTranscript = combineTranscripts(processedChunks);

    console.log(`✅ Chunked processing completed: ${finalTranscript.length} characters`);

    return { 
      audioBuffer, 
      transcript: finalTranscript, 
      chunks: processedChunks 
    };

  } finally {
    // Cleanup: Delete all temporary files
    console.log('\n🗑️  Starting comprehensive cleanup...');
    
    // Clean up main temp audio file
    if (tempAudioPath && fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
        console.log(`✅ Deleted main temp audio: ${path.basename(tempAudioPath)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete ${tempAudioPath}:`, error);
      }
    }

    // Clean up chunk files
    if (chunks.length > 0) {
      try {
        const { cleanupChunks } = await import('./chunked-audio-processor.service');
        await cleanupChunks(chunks);
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
        console.log(`✅ Deleted empty temp directory: ${tempDir}`);
      } else {
        console.log(`📁 Temp directory not empty (${files.length} files remaining)`);
      }
    } catch (error) {
      // Directory cleanup is not critical
      console.log('📁 Temp directory cleanup skipped');
    }

    console.log('✅ Comprehensive cleanup completed');
  }
}

/**
 * Try to extract audio directly from URL using ffmpeg
 * محاولة استخراج الصوت مباشرة من URL باستخدام ffmpeg
 */
async function extractAudioDirectFromUrl(
  videoUrl: string,
  options: ExtractionOptions = {}
): Promise<Buffer> {
  const outputFormat = options.outputFormat || 'mp3';
  const bitrate = options.bitrate || '128k';
  const timeout = options.timeout || 300000;

  // Create temporary output file for audio
  const tempDir = getTempDir();
  const tempAudioPath = path.join(tempDir, `audio-direct-${Date.now()}.${outputFormat}`);

  console.log('🎯 Extracting audio directly from URL using ffmpeg...');
  const startTime = Date.now();

  try {
    // Extract audio using ffmpeg directly from URL
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(videoUrl)
        .inputOptions([
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5'
        ])
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format(outputFormat)
        .output(tempAudioPath)
        .outputOptions([
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts'
        ])
        .on('start', (commandLine: string) => {
          console.log('🎬 FFmpeg command:', commandLine.substring(0, 150) + '...');
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`📊 Direct Progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('✅ Direct audio extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ Direct FFmpeg error:', err.message);
          reject(err);
        });

      // Set timeout for direct method (shorter timeout)
      setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error(`Direct extraction timeout after ${timeout / 2}ms`));
      }, timeout / 2);

      command.run();
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Direct Extraction Time: ${duration}ms`);

    // Read extracted audio file
    if (!fs.existsSync(tempAudioPath)) {
      throw new Error('Direct extraction failed: Output file not created');
    }

    const audioBuffer = fs.readFileSync(tempAudioPath);
    console.log(`✅ Direct audio extracted (${audioBuffer.length} bytes)`);

    // Clean up temporary audio file
    fs.unlinkSync(tempAudioPath);
    console.log(`🗑️  Direct temporary audio file deleted`);

    return audioBuffer;
  } catch (error) {
    // Clean up on error
    if (fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
    }
    throw error;
  }
}

/**
 * Streaming method: Download video as stream and extract audio on-the-fly
 * طريقة streaming: حمّل الفيديو كـ stream واستخرج الصوت مباشرة
 * 
 * هذه الطريقة توفر الذاكرة والوقت للفيديوهات الكبيرة
 */
async function extractAudioWithStreamingDownload(
  videoUrl: string,
  options: ExtractionOptions = {}
): Promise<Buffer> {
  const outputFormat = options.outputFormat || 'mp3';
  const bitrate = options.bitrate || '128k';
  const timeout = options.timeout || 300000;

  console.log('🌊 Using streaming method: Stream + Extract on-the-fly');
  
  const tempDir = getTempDir();
  const tempAudioPath = path.join(tempDir, `audio-stream-${Date.now()}.${outputFormat}`);

  try {
    // Encode URL to handle Arabic characters
    const encodedUrl = encodeURI(videoUrl);
    console.log(`� Encoded streaming URL: ${encodedUrl}`);

    console.log('� Starting streaming audio extraction...');
    const startTime = Date.now();

    // Use ffmpeg to stream video and extract audio directly
    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg()
        .input(encodedUrl)
        .inputOptions([
          '-reconnect', '1',           // Auto-reconnect on connection loss
          '-reconnect_streamed', '1',  // Reconnect for streamed inputs
          '-reconnect_delay_max', '5', // Max delay between reconnection attempts
          '-user_agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ])
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format(outputFormat)
        .output(tempAudioPath)
        .outputOptions([
          '-avoid_negative_ts', 'make_zero', // Handle timestamp issues
          '-fflags', '+genpts'               // Generate presentation timestamps
        ])
        .on('start', (commandLine: string) => {
          console.log('🎬 Streaming FFmpeg command:', commandLine.substring(0, 200) + '...');
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            console.log(`📊 Streaming Progress: ${Math.round(progress.percent)}%`);
          } else if (progress.timemark) {
            console.log(`⏱️  Processing: ${progress.timemark}`);
          }
        })
        .on('end', () => {
          console.log('✅ Streaming audio extraction completed');
          resolve();
        })
        .on('error', (err: Error) => {
          console.error('❌ Streaming FFmpeg error:', err.message);
          
          // If encoded URL fails, try original URL
          if (encodedUrl !== videoUrl) {
            console.log('🔄 Retrying with original URL...');
            extractAudioStreamWithOriginalUrl(videoUrl, tempAudioPath, options)
              .then(() => resolve())
              .catch(reject);
          } else {
            reject(err);
          }
        });

      // Set timeout for streaming extraction
      setTimeout(() => {
        command.kill('SIGKILL');
        reject(new Error(`Streaming extraction timeout after ${timeout}ms`));
      }, timeout);

      command.run();
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Streaming Extraction Time: ${duration}ms`);

    // Read extracted audio file
    if (!fs.existsSync(tempAudioPath)) {
      throw new Error('Streaming extraction failed: Output file not created');
    }

    const audioBuffer = fs.readFileSync(tempAudioPath);
    console.log(`✅ Streaming audio extracted (${audioBuffer.length} bytes)`);

    return audioBuffer;
  } finally {
    // Clean up temporary audio file
    if (fs.existsSync(tempAudioPath)) {
      fs.unlinkSync(tempAudioPath);
      console.log(`🗑️  Temporary audio file deleted`);
    }
  }
}

/**
 * Retry streaming extraction with original URL
 * إعادة محاولة الاستخراج مع الرابط الأصلي
 */
async function extractAudioStreamWithOriginalUrl(
  videoUrl: string,
  outputPath: string,
  options: ExtractionOptions = {}
): Promise<void> {
  const bitrate = options.bitrate || '128k';
  const outputFormat = options.outputFormat || 'mp3';

  console.log('🔄 Streaming with original URL...');

  return new Promise<void>((resolve, reject) => {
    const command = ffmpeg()
      .input(videoUrl)
      .inputOptions([
        '-user_agent', 'Mozilla/5.0 (compatible; MediaExtractor/1.0)',
        '-headers', 'Accept: video/*, */*'
      ])
      .audioCodec('libmp3lame')
      .audioBitrate(bitrate)
      .format(outputFormat)
      .output(outputPath)
      .outputOptions([
        '-avoid_negative_ts', 'make_zero',
        '-fflags', '+genpts'
      ])
      .on('start', (commandLine: string) => {
        console.log('🎬 Original URL streaming command:', commandLine.substring(0, 200) + '...');
      })
      .on('progress', (progress: any) => {
        if (progress.percent) {
          console.log(`📊 Original URL Progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('✅ Original URL streaming completed');
        resolve();
      })
      .on('error', (err: Error) => {
        console.error('❌ Original URL streaming error:', err.message);
        reject(err);
      });

    // Shorter timeout for retry
    setTimeout(() => {
      command.kill('SIGKILL');
      reject(new Error('Original URL streaming timeout'));
    }, 120000); // 2 minutes

    command.run();
  });
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