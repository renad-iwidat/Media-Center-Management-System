/**
 * Production-Ready Streaming Audio Extractor
 * مستخرج الصوت المتدفق للإنتاج
 * 
 * End-to-end streaming بدون Buffer intermediate
 */

import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

// Error Classification
export class ExtractionError extends Error {
  constructor(
    message: string,
    public type: 'NETWORK' | 'FFMPEG' | 'TIMEOUT' | 'VALIDATION' | 'SECURITY',
    public details?: any
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}

// Structured Logging
interface LogEvent {
  event: string;
  timestamp: string;
  sessionId: string;
  url?: string;
  duration?: number;
  error?: string;
  [key: string]: any;
}

class Logger {
  private sessionId: string;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || randomUUID();
  }

  log(event: string, data: Partial<LogEvent> = {}) {
    const logEntry: LogEvent = {
      event,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  }

  error(event: string, error: Error, data: Partial<LogEvent> = {}) {
    this.log(event, {
      ...data,
      error: error.message,
      stack: error.stack
    });
  }
}

// Security & Validation
class URLValidator {
  private static readonly ALLOWED_DOMAINS = [
    's3.amazonaws.com',
    's3.eu-north-1.amazonaws.com',
    'media-center-management-system.s3.eu-north-1.amazonaws.com'
  ];

  private static readonly MAX_URL_LENGTH = 2048;
  private static readonly BLOCKED_PATTERNS = [
    /localhost/i,
    /127\.0\.0\.1/,
    /192\.168\./,
    /10\./,
    /172\.(1[6-9]|2[0-9]|3[01])\./
  ];

  static validate(url: string): void {
    if (!url || url.length > this.MAX_URL_LENGTH) {
      throw new ExtractionError('Invalid URL length', 'VALIDATION');
    }

    try {
      const urlObj = new URL(url);
      
      // Check for SSRF
      for (const pattern of this.BLOCKED_PATTERNS) {
        if (pattern.test(urlObj.hostname)) {
          throw new ExtractionError('Blocked URL pattern', 'SECURITY');
        }
      }

      // Whitelist domains for production
      if (process.env.NODE_ENV === 'production') {
        const isAllowed = this.ALLOWED_DOMAINS.some(domain => 
          urlObj.hostname.endsWith(domain)
        );
        if (!isAllowed) {
          throw new ExtractionError('Domain not whitelisted', 'SECURITY');
        }
      }
    } catch (error) {
      if (error instanceof ExtractionError) throw error;
      throw new ExtractionError('Invalid URL format', 'VALIDATION');
    }
  }
}

// Process Queue Management
class ProcessQueue {
  private static instance: ProcessQueue;
  private activeProcesses = new Set<string>();
  private readonly maxConcurrent: number;

  private constructor() {
    this.maxConcurrent = parseInt(process.env.MAX_FFMPEG_PROCESSES || '3');
  }

  static getInstance(): ProcessQueue {
    if (!ProcessQueue.instance) {
      ProcessQueue.instance = new ProcessQueue();
    }
    return ProcessQueue.instance;
  }

  async acquire(sessionId: string): Promise<void> {
    while (this.activeProcesses.size >= this.maxConcurrent) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    this.activeProcesses.add(sessionId);
  }

  release(sessionId: string): void {
    this.activeProcesses.delete(sessionId);
  }

  getActiveCount(): number {
    return this.activeProcesses.size;
  }
}

// Streaming Audio Extractor
export interface StreamingExtractionOptions {
  outputFormat?: 'mp3' | 'wav' | 'aac';
  bitrate?: string;
  timeout?: number;
  maxSize?: number; // bytes
  sessionId?: string;
}

export class StreamingAudioExtractor {
  private logger: Logger;
  private sessionId: string;
  private processQueue: ProcessQueue;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || randomUUID();
    this.logger = new Logger(this.sessionId);
    this.processQueue = ProcessQueue.getInstance();
  }

  /**
   * Extract audio as stream (no intermediate files)
   * استخراج الصوت كـ stream مباشر
   */
  async extractAsStream(
    videoUrl: string,
    options: StreamingExtractionOptions = {}
  ): Promise<Readable> {
    const startTime = Date.now();
    const {
      outputFormat = 'mp3',
      bitrate = '128k',
      timeout = 300000,
      maxSize = 100 * 1024 * 1024 // 100MB default
    } = options;

    this.logger.log('extraction_start', {
      url: videoUrl,
      outputFormat,
      bitrate,
      timeout,
      maxSize
    });

    // Security validation
    URLValidator.validate(videoUrl);

    // Acquire process slot
    await this.processQueue.acquire(this.sessionId);

    try {
      return await this.performStreamingExtraction(
        videoUrl,
        { outputFormat, bitrate, timeout, maxSize }
      );
    } finally {
      this.processQueue.release(this.sessionId);
      const duration = Date.now() - startTime;
      this.logger.log('extraction_complete', { duration });
    }
  }

  private async performStreamingExtraction(
    videoUrl: string,
    options: Required<Pick<StreamingExtractionOptions, 'outputFormat' | 'bitrate' | 'timeout' | 'maxSize'>>
  ): Promise<Readable> {
    const { outputFormat, bitrate, timeout, maxSize } = options;
    
    // Create output stream
    const outputStream = new PassThrough();
    let timeoutId: NodeJS.Timeout | null = null;
    let totalBytes = 0;

    return new Promise((resolve, reject) => {
      // Enhanced URL encoding for Arabic characters
      const encodedUrl = this.encodeUrlSafely(videoUrl);
      
      this.logger.log('ffmpeg_start', {
        originalUrl: videoUrl,
        encodedUrl,
        activeProcesses: this.processQueue.getActiveCount()
      });

      const command = ffmpeg(encodedUrl)
        .inputOptions([
          '-reconnect', '1',
          '-reconnect_streamed', '1',
          '-reconnect_delay_max', '5',
          '-user_agent', 'Mozilla/5.0 (compatible; MediaExtractor/2.0)',
          '-headers', 'Accept: video/*, */*'
        ])
        .audioCodec('libmp3lame')
        .audioBitrate(bitrate)
        .format(outputFormat)
        .outputOptions([
          '-vn',              // ignore video
          '-ac', '2',         // stereo
          '-ar', '44100',     // sample rate
          '-threads', '2',    // limit CPU usage
          '-avoid_negative_ts', 'make_zero',
          '-fflags', '+genpts'
        ])
        .on('start', (commandLine: string) => {
          this.logger.log('ffmpeg_command', {
            command: commandLine.substring(0, 200) + '...'
          });
          
          // Set timeout with proper cleanup
          timeoutId = setTimeout(() => {
            this.logger.log('ffmpeg_timeout', { timeout });
            command.kill('SIGKILL');
            reject(new ExtractionError(`Extraction timeout after ${timeout}ms`, 'TIMEOUT'));
          }, timeout);
        })
        .on('progress', (progress: any) => {
          if (progress.percent) {
            this.logger.log('ffmpeg_progress', {
              percent: Math.round(progress.percent),
              timemark: progress.timemark
            });
          }
        })
        .on('end', () => {
          if (timeoutId) clearTimeout(timeoutId);
          this.logger.log('ffmpeg_success', { totalBytes });
          outputStream.end();
        })
        .on('error', (err: Error) => {
          if (timeoutId) clearTimeout(timeoutId);
          this.logger.error('ffmpeg_error', err);
          
          // Classify error
          const errorType = this.classifyFFmpegError(err);
          reject(new ExtractionError(err.message, errorType, { originalError: err }));
        });

      // Pipe to output stream with size monitoring
      const ffmpegStream = command.pipe();
      
      ffmpegStream.on('data', (chunk: Buffer) => {
        totalBytes += chunk.length;
        
        // Size limit check
        if (totalBytes > maxSize) {
          command.kill('SIGKILL');
          reject(new ExtractionError(`Stream size exceeded limit: ${maxSize} bytes`, 'VALIDATION'));
          return;
        }
        
        outputStream.write(chunk);
      });

      ffmpegStream.on('end', () => {
        outputStream.end();
      });

      ffmpegStream.on('error', (err: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        outputStream.destroy(err);
      });

      // Return stream immediately
      resolve(outputStream);
    });
  }

  private encodeUrlSafely(url: string): string {
    try {
      const urlObj = new URL(url);
      // Only encode the pathname to preserve Arabic characters
      urlObj.pathname = encodeURI(decodeURI(urlObj.pathname));
      return urlObj.toString();
    } catch {
      // Fallback to simple encoding
      return encodeURI(url);
    }
  }

  private classifyFFmpegError(error: Error): ExtractionError['type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('connection') || message.includes('network')) {
      return 'NETWORK';
    }
    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT';
    }
    if (message.includes('invalid') || message.includes('format')) {
      return 'VALIDATION';
    }
    
    return 'FFMPEG';
  }

  /**
   * Extract audio and pipe directly to response
   * استخراج الصوت وإرساله مباشرة للاستجابة
   */
  async pipeToResponse(
    videoUrl: string,
    response: any, // Express Response
    options: StreamingExtractionOptions = {}
  ): Promise<void> {
    const audioStream = await this.extractAsStream(videoUrl, options);
    
    // Set appropriate headers
    response.setHeader('Content-Type', 'audio/mpeg');
    response.setHeader('Content-Disposition', 'attachment; filename="extracted-audio.mp3"');
    
    // Pipe directly to response
    await pipeline(audioStream, response);
  }

  /**
   * Extract audio and upload directly to S3
   * استخراج الصوت ورفعه مباشرة لـ S3
   */
  async pipeToS3(
    videoUrl: string,
    s3Client: any,
    bucketName: string,
    key: string,
    options: StreamingExtractionOptions = {}
  ): Promise<string> {
    const audioStream = await this.extractAsStream(videoUrl, options);
    
    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: audioStream,
      ContentType: 'audio/mpeg'
    };

    const result = await s3Client.upload(uploadParams).promise();
    
    this.logger.log('s3_upload_success', {
      location: result.Location,
      key: result.Key
    });

    return result.Location;
  }

  /**
   * Get extraction statistics
   * احصل على إحصائيات الاستخراج
   */
  getStats(): { activeProcesses: number; sessionId: string } {
    return {
      activeProcesses: this.processQueue.getActiveCount(),
      sessionId: this.sessionId
    };
  }
}

// Export utilities
export { Logger, URLValidator, ProcessQueue };