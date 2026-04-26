/**
 * Video to Text Controller
 * Combines audio extraction and STT services
 * يدمج خدمات استخراج الصوت وتحويل الصوت لنص
 */

import { Request, Response } from 'express';
import { extractAudioFromVideoUrl } from '../../services/ai-hub/audio-extraction.service';
import { transcribeAudioFromBuffer } from '../../services/ai-hub/stt.service';

export class VideoToTextController {
  /**
   * Extract audio from video and convert to text
   * استخرج الصوت من الفيديو وحوله لنص
   * POST /api/ai-hub/video-to-text/process
   * 
   * Body:
   * {
   *   "videoUrl": "https://example.com/video.mp4",
   *   "language": "ar" (optional, default: "ar"),
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k")
   * }
   */
  static async processVideoToText(req: Request, res: Response) {
    try {
      const { 
        videoUrl, 
        language = 'ar', 
        outputFormat = 'mp3', 
        bitrate = '128k' 
      } = req.body;

      if (!videoUrl) {
        return res.status(400).json({
          success: false,
          error: 'videoUrl is required',
        });
      }

      console.log(`\n🎬➡️📝 [Video to Text Controller] Processing: ${videoUrl}`);
      console.log(`🗣️  Language: ${language}`);
      console.log(`🎵 Audio Format: ${outputFormat}`);
      console.log(`📊 Bitrate: ${bitrate}`);

      // Step 1: Extract audio from video
      console.log('\n📹 Step 1: Extracting audio from video...');
      const audioBuffer = await extractAudioFromVideoUrl(videoUrl, {
        outputFormat,
        bitrate,
      });
      console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`);

      // Step 2: Convert audio to text
      console.log('\n🎙️  Step 2: Converting audio to text...');
      const transcript = await transcribeAudioFromBuffer(audioBuffer, {
        language,
      });
      console.log(`✅ Transcription completed: ${transcript.length} characters`);

      res.json({
        success: true,
        data: {
          videoUrl,
          transcript,
          language,
          audioSize: audioBuffer.length,
          audioFormat: outputFormat,
          bitrate,
          transcriptLength: transcript.length,
        },
      });
    } catch (error) {
      console.error('❌ Error in video to text controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process video to text',
      });
    }
  }

  /**
   * Extract audio from S3 video and convert to text
   * استخرج الصوت من فيديو S3 وحوله لنص
   * POST /api/ai-hub/video-to-text/process-s3
   * 
   * Body:
   * {
   *   "fileId": 123,
   *   "s3Url": "https://s3.example.com/video.mp4",
   *   "language": "ar" (optional, default: "ar"),
   *   "outputFormat": "mp3" (optional, default: "mp3"),
   *   "bitrate": "128k" (optional, default: "128k")
   * }
   */
  static async processS3VideoToText(req: Request, res: Response) {
    try {
      const { 
        fileId,
        s3Url, 
        language = 'ar', 
        outputFormat = 'mp3', 
        bitrate = '128k' 
      } = req.body;

      if (!s3Url) {
        return res.status(400).json({
          success: false,
          error: 's3Url is required',
        });
      }

      console.log(`\n🎬➡️📝 [Video to Text Controller] Processing S3: ${s3Url}`);
      console.log(`📁 File ID: ${fileId}`);
      console.log(`🗣️  Language: ${language}`);
      console.log(`🎵 Audio Format: ${outputFormat}`);
      console.log(`📊 Bitrate: ${bitrate}`);

      // Step 1: Extract audio from S3 video
      console.log('\n📹 Step 1: Extracting audio from S3 video...');
      const audioBuffer = await extractAudioFromVideoUrl(s3Url, {
        outputFormat,
        bitrate,
      });
      console.log(`✅ Audio extracted: ${audioBuffer.length} bytes`);

      // Step 2: Convert audio to text
      console.log('\n🎙️  Step 2: Converting audio to text...');
      const transcript = await transcribeAudioFromBuffer(audioBuffer, {
        language,
      });
      console.log(`✅ Transcription completed: ${transcript.length} characters`);

      res.json({
        success: true,
        data: {
          fileId,
          s3Url,
          transcript,
          language,
          audioSize: audioBuffer.length,
          audioFormat: outputFormat,
          bitrate,
          transcriptLength: transcript.length,
        },
      });
    } catch (error) {
      console.error('❌ Error in S3 video to text controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process S3 video to text',
      });
    }
  }
}