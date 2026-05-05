/**
 * Audio Extraction Controller
 * Handles audio extraction from video files
 * يتعامل مع استخراج الصوت من ملفات الفيديو
 */

import { Request, Response } from 'express';
import {
  extractAudioFromFile,
  extractAudioFromVideoUrl,
  extractAudioAndSave,
  getVideoInfo,
  SUPPORTED_VIDEO_FORMATS,
  SUPPORTED_AUDIO_FORMATS,
} from '../../services/ai-hub/audio-extraction.service';

export class AudioExtractionController {
  /**
   * Extract audio from video file
   * استخرج الصوت من ملف فيديو
   * POST /api/ai-hub/audio-extraction/extract-from-file
   * 
   * Body:
   * {
   *   "videoFilePath": "/path/to/video.mp4",
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k")
   * }
   */
  static async extractFromFile(req: Request, res: Response) {
    try {
      const { videoFilePath, outputFormat = 'mp3', bitrate = '128k' } = req.body;

      if (!videoFilePath) {
        return res.status(400).json({
          success: false,
          error: 'videoFilePath is required',
        });
      }

      console.log(`\n🎬 [Audio Extraction Controller] Extracting from file: ${videoFilePath}`);

      const audioBuffer = await extractAudioFromFile(videoFilePath, {
        outputFormat,
        bitrate,
      });

      // Convert buffer to base64 for JSON response
      const audioBase64 = audioBuffer.toString('base64');

      res.json({
        success: true,
        data: {
          audioBase64,
          audioSize: audioBuffer.length,
          format: outputFormat,
          bitrate,
        },
      });
    } catch (error) {
      console.error('Error in audio extraction controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract audio',
      });
    }
  }

  /**
   * Extract audio from video URL
   * استخرج الصوت من رابط فيديو
   * POST /api/ai-hub/audio-extraction/extract-from-url
   * 
   * Body:
   * {
   *   "videoUrl": "https://example.com/video.mp4",
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k")
   * }
   */
  static async extractFromUrl(req: Request, res: Response) {
    try {
      const { videoUrl, outputFormat = 'mp3', bitrate = '128k' } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required',
        });
      }

      console.log(`\n🎬 [Audio Extraction Controller] Extracting from URL: ${videoUrl}`);

      const audioBuffer = await extractAudioFromVideoUrl(videoUrl, {
        outputFormat,
        bitrate,
      });

      // Convert buffer to base64 for JSON response
      const audioBase64 = audioBuffer.toString('base64');

      res.json({
        success: true,
        data: {
          audioBase64,
          audioSize: audioBuffer.length,
          format: outputFormat,
          bitrate,
          videoUrl,
        },
      });
    } catch (error) {
      console.error('Error in audio extraction controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract audio',
      });
    }
  }

  /**
   * Extract audio from S3 video file with integrated transcription
   * استخرج الصوت من ملف فيديو في S3 مع تفريغ متكامل
   * POST /api/ai-hub/audio-extraction/extract-and-transcribe
   * 
   * Body:
   * {
   *   "fileId": 123,
   *   "s3Url": "https://s3.example.com/video.mp4",
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k"),
   *   "language": "ar" (optional, default: "ar"),
   *   "enableChunking": true (optional, default: true),
   *   "chunkDurationSeconds": 180 (optional, default: 180),
   *   "maxConcurrentChunks": 3 (optional, default: 3),
   *   "includeTimestamps": true (optional, default: true)
   * }
   */
  static async extractAndTranscribe(req: Request, res: Response) {
    try {
      const { 
        fileId, 
        s3Url, 
        outputFormat = 'mp3', 
        bitrate = '128k',
        language = 'ar',
        enableChunking = true,
        chunkDurationSeconds = 180,
        maxConcurrentChunks = 3,
        includeTimestamps = true
      } = req.body;

      if (!s3Url) {
        return res.status(400).json({
          success: false,
          error: 's3Url is required',
        });
      }

      console.log(`\n🎬 [Audio Extraction Controller] Extract + Transcribe from S3: ${s3Url}`);
      console.log(`🔄 Chunking: ${enableChunking} | Duration: ${chunkDurationSeconds}s | Concurrent: ${maxConcurrentChunks}`);
      console.log(`⏱️  Include Timestamps: ${includeTimestamps}`);

      // Import transcription service
      const { transcribeAudioWithOpenAI, formatTimestamp } = await import('../../services/ai-hub/openai-stt.service');
      const { extractAudioWithChunkedProcessing } = await import('../../services/ai-hub/audio-extraction.service');

      let allSegments: any[] = [];

      // Create transcription function
      const transcriptionFunction = async (audioBuffer: Buffer): Promise<string> => {
        const result = await transcribeAudioWithOpenAI(audioBuffer, { language, includeTimestamps });
        
        if (typeof result === 'string') {
          return result;
        } else {
          // Collect segments if timestamps are included
          if (result.segments && includeTimestamps) {
            allSegments.push(...result.segments);
          }
          return result.text;
        }
      };

      // Extract audio with integrated chunked processing
      const result = await extractAudioWithChunkedProcessing(
        s3Url,
        transcriptionFunction,
        {
          outputFormat,
          bitrate,
          enableChunking,
          chunkDurationSeconds,
          maxConcurrentChunks,
          timeout: 600000 // 10 minutes for large files
        }
      );

      // Convert buffer to base64 for JSON response
      const audioBase64 = result.audioBuffer.toString('base64');

      const responseData: any = {
        fileId,
        audioBase64,
        audioSize: result.audioBuffer.length,
        format: outputFormat,
        bitrate,
        s3Url,
        transcript: result.transcript,
        language,
        processingMethod: result.chunks ? 'chunked' : 'single',
        chunksProcessed: result.chunks?.length || 0,
      };

      // Include segments with timestamps if available
      if (includeTimestamps && allSegments.length > 0) {
        responseData.segments = allSegments.map(seg => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          startFormatted: formatTimestamp(seg.start),
          endFormatted: formatTimestamp(seg.end),
        }));
        responseData.segmentCount = allSegments.length;
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (error) {
      console.error('Error in extract and transcribe controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract audio and transcribe',
      });
    }
  }

  /**
   * Get video information
   * احصل على معلومات الفيديو
   * POST /api/ai-hub/audio-extraction/video-info
   * 
   * Body:
   * {
   *   "videoFilePath": "/path/to/video.mp4"
   * }
   */
  static async getVideoInfo(req: Request, res: Response) {
    try {
      const { videoFilePath } = req.body;

      if (!videoFilePath) {
        return res.status(400).json({
          success: false,
          error: 'videoFilePath is required',
        });
      }

      console.log(`\n📊 [Audio Extraction Controller] Getting video info: ${videoFilePath}`);

      const info = await getVideoInfo(videoFilePath);

      res.json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error('Error getting video info:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get video info',
      });
    }
  }

  /**
   * Get supported formats
   * احصل على الصيغ المدعومة
   * GET /api/ai-hub/audio-extraction/formats
   */
  static async getSupportedFormats(_req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: {
          videoFormats: SUPPORTED_VIDEO_FORMATS,
          audioFormats: SUPPORTED_AUDIO_FORMATS,
        },
      });
    } catch (error) {
      console.error('Error fetching supported formats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch supported formats',
      });
    }
  }

  /**
   * Extract audio from S3 video file (legacy method - audio only)
   * استخرج الصوت من ملف فيديو في S3 (طريقة قديمة - صوت فقط)
   * POST /api/ai-hub/audio-extraction/extract-from-s3
   */
  static async extractFromS3(req: Request, res: Response) {
    try {
      const { fileId, s3Url, outputFormat = 'mp3', bitrate = '128k' } = req.body;

      if (!s3Url) {
        return res.status(400).json({
          success: false,
          error: 's3Url is required',
        });
      }

      console.log(`\n🎬 [Audio Extraction Controller] Extracting from S3 (audio only): ${s3Url}`);

      const audioBuffer = await extractAudioFromVideoUrl(s3Url, {
        outputFormat,
        bitrate,
      });

      // Convert buffer to base64 for JSON response
      const audioBase64 = audioBuffer.toString('base64');

      res.json({
        success: true,
        data: {
          fileId,
          audioBase64,
          audioSize: audioBuffer.length,
          format: outputFormat,
          bitrate,
          s3Url,
        },
      });
    } catch (error) {
      console.error('Error in audio extraction controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to extract audio',
      });
    }
  }
}
