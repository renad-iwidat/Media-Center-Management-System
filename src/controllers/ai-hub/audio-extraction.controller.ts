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
   * Extract audio from S3 video file and return downloadable URL
   * استخرج الصوت من ملف فيديو في S3 وأرجع رابط قابل للتحميل
   * POST /api/ai-hub/audio-extraction/extract-from-s3
   * 
   * Body:
   * {
   *   "fileId": 123,
   *   "s3Url": "https://s3.example.com/video.mp4",
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k")
   * }
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

      console.log(`\n🎬 [Audio Extraction Controller] Extracting from S3: ${s3Url}`);

      const audioBuffer = await extractAudioFromVideoUrl(s3Url, {
        outputFormat,
        bitrate,
      });

      // Save audio to temporary file and create URL
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = path.join(os.tmpdir(), 'media-center-extracted-audio');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const audioFileName = `extracted-audio-${Date.now()}.${outputFormat}`;
      const audioFilePath = path.join(tempDir, audioFileName);
      fs.writeFileSync(audioFilePath, audioBuffer);
      
      // Create URL for the audio file
      const audioUrl = `http://localhost:${process.env.PORT || 4000}/temp-audio/${audioFileName}`;

      // Convert buffer to base64 for JSON response (fallback)
      const audioBase64 = audioBuffer.toString('base64');

      res.json({
        success: true,
        data: {
          fileId,
          audioUrl,
          audioBase64,
          audioSize: audioBuffer.length,
          format: outputFormat,
          bitrate,
          s3Url,
          audioFilePath,
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
}
