/**
 * Video to Text Routes
 * مسارات تحويل الفيديو إلى نص
 */

import { Router, Request, Response, NextFunction } from 'express';
import { VideoToTextController } from '../../controllers/ai-hub/video-to-text.controller';

const router = Router();

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] Video to Text Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/video-to-text/process
 * استخرج الصوت من الفيديو وحوله لنص
 * 
 * Request body:
 * {
 *   "videoUrl": "string (required) - URL to video file",
 *   "language": "string (optional, default: 'ar') - Language for transcription",
 *   "outputFormat": "string (optional, default: 'mp3') - Audio output format",
 *   "bitrate": "string (optional, default: '128k') - Audio bitrate"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "videoUrl": "string - The video URL",
 *     "transcript": "string - The transcribed text",
 *     "language": "string - Language used",
 *     "audioSize": "number - Audio size in bytes",
 *     "audioFormat": "string - Audio format",
 *     "bitrate": "string - Bitrate used",
 *     "transcriptLength": "number - Length of transcript"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/process', VideoToTextController.processVideoToText);

/**
 * POST /api/ai-hub/video-to-text/process-s3
 * استخرج الصوت من فيديو S3 وحوله لنص
 * 
 * Request body:
 * {
 *   "fileId": "number (optional) - ID of the uploaded file",
 *   "s3Url": "string (required) - S3 URL to video file",
 *   "language": "string (optional, default: 'ar') - Language for transcription",
 *   "outputFormat": "string (optional, default: 'mp3') - Audio output format",
 *   "bitrate": "string (optional, default: '128k') - Audio bitrate"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "fileId": "number - The file ID",
 *     "s3Url": "string - The S3 URL",
 *     "transcript": "string - The transcribed text",
 *     "language": "string - Language used",
 *     "audioSize": "number - Audio size in bytes",
 *     "audioFormat": "string - Audio format",
 *     "bitrate": "string - Bitrate used",
 *     "transcriptLength": "number - Length of transcript"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/process-s3', VideoToTextController.processS3VideoToText);

export default router;