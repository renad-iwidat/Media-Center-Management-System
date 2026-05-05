/**
 * Production-Ready Streaming Extraction Controller
 * كونترولر استخراج الصوت المتدفق للإنتاج
 */

import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { 
  StreamingAudioExtractor, 
  ExtractionError,
  StreamingExtractionOptions 
} from '../../services/ai-hub/streaming-audio-extractor.service';

// Job Management (Simple in-memory for now, use Redis/DB for production)
interface ExtractionJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl: string;
  options: StreamingExtractionOptions;
  result?: {
    audioUrl?: string;
    transcript?: string;
    size?: number;
    duration?: number;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  progress?: number;
}

class JobManager {
  private static jobs = new Map<string, ExtractionJob>();
  
  static createJob(videoUrl: string, options: StreamingExtractionOptions): string {
    const jobId = randomUUID();
    const job: ExtractionJob = {
      id: jobId,
      status: 'pending',
      videoUrl,
      options,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, job);
    return jobId;
  }
  
  static getJob(jobId: string): ExtractionJob | undefined {
    return this.jobs.get(jobId);
  }
  
  static updateJob(jobId: string, updates: Partial<ExtractionJob>): void {
    const job = this.jobs.get(jobId);
    if (job) {
      Object.assign(job, updates, { updatedAt: new Date() });
      this.jobs.set(jobId, job);
    }
  }
  
  static deleteJob(jobId: string): void {
    this.jobs.delete(jobId);
  }
  
  static cleanup(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (now.getTime() - job.createdAt.getTime() > maxAge) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Cleanup old jobs every hour
setInterval(() => JobManager.cleanup(), 60 * 60 * 1000);

export class StreamingExtractionController {
  /**
   * Start extraction job (async)
   * بدء مهمة استخراج (غير متزامن)
   * POST /api/ai-hub/streaming-extraction/start
   */
  static async startExtraction(req: Request, res: Response) {
    try {
      const {
        videoUrl,
        outputFormat = 'mp3',
        bitrate = '128k',
        timeout = 300000,
        maxSize = 100 * 1024 * 1024 // 100MB
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required'
        });
      }

      // Create job
      const jobId = JobManager.createJob(videoUrl, {
        outputFormat,
        bitrate,
        timeout,
        maxSize,
        sessionId: randomUUID()
      });

      // Start processing asynchronously
      StreamingExtractionController.processJob(jobId).catch(error => {
        console.error(`Job ${jobId} failed:`, error);
        JobManager.updateJob(jobId, {
          status: 'failed',
          error: error.message
        });
      });

      res.json({
        success: true,
        data: {
          jobId,
          status: 'pending',
          message: 'Extraction job started'
        }
      });
    } catch (error) {
      console.error('Error starting extraction job:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to start extraction'
      });
    }
  }

  /**
   * Get job status
   * احصل على حالة المهمة
   * GET /api/ai-hub/streaming-extraction/status/:jobId
   */
  static async getJobStatus(req: Request, res: Response) {
    try {
      const { jobId } = req.params;
      const job = JobManager.getJob(jobId);

      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Job not found'
        });
      }

      res.json({
        success: true,
        data: {
          jobId: job.id,
          status: job.status,
          progress: job.progress,
          result: job.result,
          error: job.error,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      });
    } catch (error) {
      console.error('Error getting job status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get job status'
      });
    }
  }

  /**
   * Stream audio directly (synchronous)
   * تدفق الصوت مباشرة (متزامن)
   * POST /api/ai-hub/streaming-extraction/stream
   */
  static async streamAudio(req: Request, res: Response) {
    try {
      const {
        videoUrl,
        outputFormat = 'mp3',
        bitrate = '128k',
        timeout = 300000
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required'
        });
      }

      const extractor = new StreamingAudioExtractor();
      
      // Set response headers
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', 'attachment; filename="extracted-audio.mp3"');
      res.setHeader('Transfer-Encoding', 'chunked');

      // Pipe audio directly to response
      await extractor.pipeToResponse(videoUrl, res, {
        outputFormat,
        bitrate,
        timeout
      });

    } catch (error) {
      console.error('Error streaming audio:', error);
      
      if (!res.headersSent) {
        if (error instanceof ExtractionError) {
          const statusCode = error.type === 'VALIDATION' || error.type === 'SECURITY' ? 400 : 500;
          res.status(statusCode).json({
            success: false,
            error: error.message,
            type: error.type
          });
        } else {
          res.status(500).json({
            success: false,
            error: 'Failed to stream audio'
          });
        }
      }
    }
  }

  /**
   * Extract with chunked transcription (production method)
   * استخراج مع تفريغ مقسم (طريقة الإنتاج)
   * POST /api/ai-hub/streaming-extraction/extract-and-transcribe
   */
  static async extractAndTranscribe(req: Request, res: Response) {
    try {
      const {
        videoUrl,
        language = 'ar',
        outputFormat = 'mp3',
        bitrate = '128k',
        enableChunking = true,
        chunkDurationSeconds = 180,
        maxConcurrentChunks = 3
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required'
        });
      }

      // Create job for tracking
      const jobId = JobManager.createJob(videoUrl, {
        outputFormat,
        bitrate,
        sessionId: randomUUID()
      });

      JobManager.updateJob(jobId, { status: 'processing' });

      const extractor = new StreamingAudioExtractor();
      
      // Get audio stream
      const audioStream = await extractor.extractAsStream(videoUrl, {
        outputFormat,
        bitrate,
        timeout: 600000 // 10 minutes for large files
      });

      // Convert stream to buffer for transcription
      const chunks: Buffer[] = [];
      let totalSize = 0;
      const maxBufferSize = 50 * 1024 * 1024; // 50MB limit

      // Wait for stream to complete before processing
      await new Promise<void>((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => {
          totalSize += chunk.length;
          if (totalSize > maxBufferSize) {
            reject(new ExtractionError('Audio stream too large for transcription', 'VALIDATION'));
            return;
          }
          chunks.push(chunk);
          console.log(`📊 Received chunk: ${chunk.length} bytes (total: ${totalSize} bytes)`);
        });

        audioStream.on('end', () => {
          console.log(`✅ Stream completed: ${totalSize} bytes total`);
          resolve();
        });

        audioStream.on('error', (err: Error) => {
          console.error('❌ Stream error:', err);
          reject(err);
        });
      });

      // Check if we have audio data
      if (chunks.length === 0 || totalSize === 0) {
        throw new ExtractionError('No audio data received from stream', 'VALIDATION');
      }

      const audioBuffer = Buffer.concat(chunks);
      console.log(`🎵 Final audio buffer: ${audioBuffer.length} bytes`);
      
      // Import transcription service
      const { transcribeAudioFromBuffer } = await import('../../services/ai-hub/stt.service');
      
      let transcript: string;
      
      if (enableChunking && audioBuffer.length > 10 * 1024 * 1024) { // 10MB threshold
        // Use chunked processing for large files
        const { extractAudioWithChunkedProcessing } = await import('../../services/ai-hub/audio-extraction.service');
        
        const transcriptionFunction = async (buffer: Buffer): Promise<string> => {
          return await transcribeAudioFromBuffer(buffer, { language });
        };

        // This is a workaround - ideally we'd stream directly to chunked processor
        const result = await extractAudioWithChunkedProcessing(
          videoUrl,
          transcriptionFunction,
          {
            outputFormat,
            bitrate,
            enableChunking,
            chunkDurationSeconds,
            maxConcurrentChunks
          }
        );
        
        transcript = result.transcript || '';
      } else {
        // Direct transcription for smaller files
        transcript = await transcribeAudioFromBuffer(audioBuffer, { language });
      }

      // Update job with results
      JobManager.updateJob(jobId, {
        status: 'completed',
        result: {
          transcript,
          size: audioBuffer.length,
          duration: Math.round(audioBuffer.length / (128 * 1024 / 8)) // Rough estimate
        }
      });

      res.json({
        success: true,
        data: {
          jobId,
          transcript,
          audioSize: audioBuffer.length,
          language,
          processingMethod: enableChunking ? 'chunked' : 'direct'
        }
      });

    } catch (error) {
      console.error('Error in extract and transcribe:', error);
      
      if (error instanceof ExtractionError) {
        const statusCode = error.type === 'VALIDATION' || error.type === 'SECURITY' ? 400 : 500;
        res.status(statusCode).json({
          success: false,
          error: error.message,
          type: error.type
        });
      } else {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to extract and transcribe'
        });
      }
    }
  }

  /**
   * Get system stats
   * احصل على إحصائيات النظام
   * GET /api/ai-hub/streaming-extraction/stats
   */
  static async getSystemStats(req: Request, res: Response) {
    try {
      const extractor = new StreamingAudioExtractor();
      const stats = extractor.getStats();

      res.json({
        success: true,
        data: {
          ...stats,
          totalJobs: JobManager['jobs'].size,
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          nodeVersion: process.version
        }
      });
    } catch (error) {
      console.error('Error getting system stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get system stats'
      });
    }
  }

  /**
   * Process job asynchronously
   * معالجة المهمة بشكل غير متزامن
   */
  private static async processJob(jobId: string): Promise<void> {
    const job = JobManager.getJob(jobId);
    if (!job) return;

    try {
      JobManager.updateJob(jobId, { status: 'processing', progress: 0 });

      const extractor = new StreamingAudioExtractor(job.options.sessionId);
      
      // For async jobs, we could save to S3 and return URL
      // This is a simplified version
      const audioStream = await extractor.extractAsStream(job.videoUrl, job.options);
      
      // Collect stream data
      const chunks: Buffer[] = [];
      let totalSize = 0;

      audioStream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalSize += chunk.length;
        
        // Update progress (rough estimate)
        const progress = Math.min(90, (totalSize / (10 * 1024 * 1024)) * 100);
        JobManager.updateJob(jobId, { progress });
      });

      audioStream.on('end', () => {
        const audioBuffer = Buffer.concat(chunks);
        
        JobManager.updateJob(jobId, {
          status: 'completed',
          progress: 100,
          result: {
            size: audioBuffer.length,
            // In production, upload to S3 and return URL
            audioUrl: `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`
          }
        });
      });

      audioStream.on('error', (error) => {
        JobManager.updateJob(jobId, {
          status: 'failed',
          error: error.message
        });
      });

    } catch (error) {
      JobManager.updateJob(jobId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Processing failed'
      });
    }
  }
}

export { JobManager };