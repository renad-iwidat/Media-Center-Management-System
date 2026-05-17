/**
 * Production Streaming Extraction Routes
 * مسارات استخراج الصوت المتدفق للإنتاج
 */

import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { StreamingExtractionController } from '../../controllers/ai-hub/streaming-extraction.controller';

const router = Router();

// Rate limiting for production
const extractionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many extraction requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const streamingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit streaming requests
  message: {
    success: false,
    error: 'Too many streaming requests, please try again later'
  }
});

// Apply authentication to all routes (temporarily disabled for testing)
// router.use(authenticate);

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(JSON.stringify({
    event: 'streaming_extraction_request',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  }));
  next();
});

/**
 * POST /api/ai-hub/streaming-extraction/start
 * Start async extraction job
 * بدء مهمة استخراج غير متزامنة
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)",
 *   "outputFormat": "mp3|wav|aac (optional, default: mp3)",
 *   "bitrate": "string (optional, default: 128k)",
 *   "timeout": "number (optional, default: 300000)",
 *   "maxSize": "number (optional, default: 100MB)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "jobId": "uuid",
 *     "status": "pending",
 *     "message": "Extraction job started"
 *   }
 * }
 */
router.post('/start', extractionLimiter, StreamingExtractionController.startExtraction);

/**
 * GET /api/ai-hub/streaming-extraction/status/:jobId
 * Get job status and results
 * احصل على حالة المهمة والنتائج
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "jobId": "uuid",
 *     "status": "pending|processing|completed|failed",
 *     "progress": "number (0-100)",
 *     "result": {
 *       "audioUrl": "string",
 *       "transcript": "string",
 *       "size": "number",
 *       "duration": "number"
 *     },
 *     "error": "string (if failed)",
 *     "createdAt": "ISO date",
 *     "updatedAt": "ISO date"
 *   }
 * }
 */
router.get('/status/:jobId', StreamingExtractionController.getJobStatus);

/**
 * POST /api/ai-hub/streaming-extraction/stream
 * Stream audio directly (synchronous)
 * تدفق الصوت مباشرة (متزامن)
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)",
 *   "outputFormat": "mp3|wav|aac (optional, default: mp3)",
 *   "bitrate": "string (optional, default: 128k)",
 *   "timeout": "number (optional, default: 300000)"
 * }
 * 
 * Response: Audio stream (binary)
 * Content-Type: audio/mpeg
 * Content-Disposition: attachment; filename="extracted-audio.mp3"
 */
router.post('/stream', streamingLimiter, StreamingExtractionController.streamAudio);

/**
 * POST /api/ai-hub/streaming-extraction/extract-and-transcribe
 * Extract audio and transcribe (production method)
 * استخراج الصوت والتفريغ (طريقة الإنتاج)
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)",
 *   "language": "string (optional, default: ar)",
 *   "outputFormat": "mp3|wav|aac (optional, default: mp3)",
 *   "bitrate": "string (optional, default: 128k)",
 *   "enableChunking": "boolean (optional, default: true)",
 *   "chunkDurationSeconds": "number (optional, default: 180)",
 *   "maxConcurrentChunks": "number (optional, default: 3)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "jobId": "uuid",
 *     "transcript": "string",
 *     "audioSize": "number",
 *     "language": "string",
 *     "processingMethod": "chunked|direct"
 *   }
 * }
 */
router.post('/extract-and-transcribe', extractionLimiter, StreamingExtractionController.extractAndTranscribe);

/**
 * POST /api/ai-hub/streaming-extraction/download-first
 * Extract with download-first method (for problematic URLs)
 * استخراج بطريقة التحميل أولاً (للروابط المشكلة)
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)",
 *   "language": "string (optional, default: ar)",
 *   "outputFormat": "mp3|wav|aac (optional, default: mp3)",
 *   "bitrate": "string (optional, default: 128k)",
 *   "enableChunking": "boolean (optional, default: true)",
 *   "chunkDurationSeconds": "number (optional, default: 180)",
 *   "maxConcurrentChunks": "number (optional, default: 3)",
 *   "maxFileSize": "number (optional, default: 1GB)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "jobId": "uuid",
 *     "transcript": "string",
 *     "audioSize": "number",
 *     "videoSize": "number",
 *     "processingTime": "number",
 *     "language": "string",
 *     "processingMethod": "download-first",
 *     "chunksProcessed": "number",
 *     "enabledChunking": "boolean"
 *   }
 * }
 */
router.post('/download-first', extractionLimiter, StreamingExtractionController.extractWithDownloadFirst);

/**
 * POST /api/ai-hub/streaming-extraction/video-info
 * Get video information using download-first method
 * الحصول على معلومات الفيديو باستخدام طريقة التحميل أولاً
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "videoInfo": {
 *       "format": "object",
 *       "streams": "array",
 *       "duration": "number",
 *       "bitrate": "number",
 *       "hasAudio": "boolean",
 *       "hasVideo": "boolean",
 *       "estimatedSize": "number"
 *     },
 *     "url": "string",
 *     "timestamp": "ISO date"
 *   }
 * }
 */
router.post('/video-info', StreamingExtractionController.getVideoInfo);

/**
 * POST /api/ai-hub/streaming-extraction/diagnose
 * Diagnose S3 URL for potential issues
 * تشخيص رابط S3 للمشاكل المحتملة
 * 
 * Body:
 * {
 *   "videoUrl": "string (required)"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "diagnostic": {
 *       "accessible": "boolean",
 *       "contentType": "string",
 *       "contentLength": "number",
 *       "isValidVideo": "boolean",
 *       "issues": "array",
 *       "recommendations": "array"
 *     },
 *     "timestamp": "ISO date"
 *   }
 * }
 */
router.post('/diagnose', StreamingExtractionController.diagnoseUrl);

/**
 * GET /api/ai-hub/streaming-extraction/stats
 * Get system statistics
 * احصل على إحصائيات النظام
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "activeProcesses": "number",
 *     "sessionId": "string",
 *     "totalJobs": "number",
 *     "uptime": "number",
 *     "memory": "object",
 *     "nodeVersion": "string"
 *   }
 * }
 */
router.get('/stats', StreamingExtractionController.getSystemStats);

export default router;