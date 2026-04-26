/**
 * Audio Extraction Routes
 * مسارات استخراج الصوت من الفيديو
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AudioExtractionController } from '../../controllers/ai-hub/audio-extraction.controller';

const router = Router();

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] Audio Extraction Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/audio-extraction/extract-from-file
 * استخرج الصوت من ملف فيديو محلي
 * 
 * Request body:
 * {
 *   "videoFilePath": "string (required) - Path to video file",
 *   "outputFormat": "string (optional, default: 'mp3') - Output audio format",
 *   "bitrate": "string (optional, default: '128k') - Audio bitrate"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "audioBase64": "string - Base64 encoded audio",
 *     "audioSize": "number - Size in bytes",
 *     "format": "string - Output format",
 *     "bitrate": "string - Bitrate used"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/extract-from-file', AudioExtractionController.extractFromFile);

/**
 * POST /api/ai-hub/audio-extraction/extract-from-url
 * استخرج الصوت من رابط فيديو
 * 
 * Request body:
 * {
 *   "videoUrl": "string (required) - URL to video file",
 *   "outputFormat": "string (optional, default: 'mp3') - Output audio format",
 *   "bitrate": "string (optional, default: '128k') - Audio bitrate"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "audioBase64": "string - Base64 encoded audio",
 *     "audioSize": "number - Size in bytes",
 *     "format": "string - Output format",
 *     "bitrate": "string - Bitrate used",
 *     "videoUrl": "string - The video URL"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/extract-from-url', AudioExtractionController.extractFromUrl);

/**
 * POST /api/ai-hub/audio-extraction/extract-from-s3
 * استخرج الصوت من ملف فيديو في S3
 * 
 * Request body:
 * {
 *   "fileId": "number (optional) - ID of the uploaded file",
 *   "s3Url": "string (required) - S3 URL to video file",
 *   "outputFormat": "string (optional, default: 'mp3') - Output audio format",
 *   "bitrate": "string (optional, default: '128k') - Audio bitrate"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "fileId": "number - The file ID",
 *     "audioBase64": "string - Base64 encoded audio",
 *     "audioSize": "number - Size in bytes",
 *     "format": "string - Output format",
 *     "bitrate": "string - Bitrate used",
 *     "s3Url": "string - The S3 URL"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/extract-from-s3', AudioExtractionController.extractFromS3);

/**
 * POST /api/ai-hub/audio-extraction/video-info
 * احصل على معلومات الفيديو
 * 
 * Request body:
 * {
 *   "videoFilePath": "string (required) - Path to video file"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "format": "object - Format information",
 *     "streams": "array - Stream information",
 *     "duration": "number - Duration in seconds",
 *     "bitrate": "number - Bitrate",
 *     "hasAudio": "boolean - Has audio stream",
 *     "hasVideo": "boolean - Has video stream"
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post('/video-info', AudioExtractionController.getVideoInfo);

/**
 * GET /api/ai-hub/audio-extraction/formats
 * احصل على الصيغ المدعومة
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "videoFormats": ["mp4", "avi", "mov", ...],
 *     "audioFormats": ["mp3", "wav", "aac", ...]
 *   }
 * }
 */
router.get('/formats', AudioExtractionController.getSupportedFormats);

export default router;
