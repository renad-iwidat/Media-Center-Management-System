/**
 * Smart Transcription Routes
 * مسارات التفريغ الذكي وتوليد المخرجات التحريرية
 */

import { Router, Request, Response, NextFunction } from 'express';
import { SmartTranscriptionController } from '../../controllers/ai-hub/smart-transcription.controller';
import { createAILogger } from '../../middleware/ai-usage-logger.middleware';

const router = Router();

// Logging middleware
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`\n📍 [${new Date().toISOString()}] Smart Transcription Route Hit`);
  console.log(`🔗 Method: ${req.method}`);
  console.log(`📍 Path: ${req.path}`);
  console.log(`🌐 IP: ${req.ip}`);
  next();
});

/**
 * POST /api/ai-hub/smart-transcription/process
 * Process audio/video file and generate editorial outputs
 * 
 * Request body:
 * {
 *   "fileUrl": "string (required) - URL of audio or video file",
 *   "fileType": "audio|video (optional, default: 'audio')",
 *   "language": "string (optional, default: 'ar')",
 *   "outputs": [
 *     {
 *       "type": "executive_summary|news_article|detailed_report|social_media|video_clips|policy_alerts",
 *       "enabled": boolean,
 *       "count": number (optional, for social_media and video_clips)
 *     }
 *   ],
 *   "editorialPolicy": "string (optional)",
 *   "customInfo": "string (optional)"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "transcript": "string - The full transcript",
 *     "outputs": [
 *       {
 *         "type": "string",
 *         "content": "string",
 *         "metadata": { ... }
 *       }
 *     ],
 *     "metadata": { ... }
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post(
  '/process',
  createAILogger('smart-transcription', 'process'),
  SmartTranscriptionController.processAndGenerate
);

/**
 * POST /api/ai-hub/smart-transcription/generate-outputs
 * Generate specific outputs from existing transcript
 * 
 * Request body:
 * {
 *   "transcript": "string (required) - The transcript text",
 *   "outputs": [
 *     {
 *       "type": "executive_summary|news_article|detailed_report|social_media|video_clips|policy_alerts",
 *       "enabled": boolean,
 *       "count": number (optional)
 *     }
 *   ],
 *   "editorialPolicy": "string (optional)",
 *   "customInfo": "string (optional)"
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "transcript": "string",
 *     "outputs": [ ... ],
 *     "metadata": { ... }
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post(
  '/generate-outputs',
  createAILogger('smart-transcription', 'generate-outputs'),
  SmartTranscriptionController.generateOutputs
);

/**
 * POST /api/ai-hub/smart-transcription/export
 * Export unified file with all outputs
 * 
 * Request body:
 * {
 *   "outputs": [
 *     {
 *       "type": "string",
 *       "content": "string"
 *     }
 *   ],
 *   "editorialPolicy": "string (optional)",
 *   "customInfo": "string (optional)"
 * }
 * 
 * Response: Text file download
 */
router.post(
  '/export',
  createAILogger('smart-transcription', 'export'),
  SmartTranscriptionController.exportUnified
);

/**
 * POST /api/ai-hub/smart-transcription/correct
 * Correct transcript using linguistic correction layer
 * 
 * Request body:
 * {
 *   "transcript": "string (required) - The transcript to correct",
 *   "language": "string (optional, default: 'ar')",
 *   "preserveMeaning": boolean (optional, default: true),
 *   "fixPunctuation": boolean (optional, default: true),
 *   "fixGrammar": boolean (optional, default: true),
 *   "fixSpelling": boolean (optional, default: true),
 *   "improveClarity": boolean (optional, default: true)
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "originalTranscript": "string",
 *     "correctedTranscript": "string",
 *     "corrections": [
 *       {
 *         "type": "string",
 *         "original": "string",
 *         "corrected": "string",
 *         "explanation": "string"
 *       }
 *     ],
 *     "metadata": { ... },
 *     "validation": { ... }
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post(
  '/correct',
  createAILogger('smart-transcription', 'correct'),
  SmartTranscriptionController.correctTranscriptEndpoint
);

/**
 * POST /api/ai-hub/smart-transcription/correct-batch
 * Correct multiple transcripts in batch
 * 
 * Request body:
 * {
 *   "transcripts": ["string", "string", ...] (required),
 *   "language": "string (optional, default: 'ar')",
 *   "preserveMeaning": boolean (optional, default: true),
 *   "fixPunctuation": boolean (optional, default: true),
 *   "fixGrammar": boolean (optional, default: true),
 *   "fixSpelling": boolean (optional, default: true),
 *   "improveClarity": boolean (optional, default: true)
 * }
 * 
 * Response:
 * {
 *   "success": boolean,
 *   "data": {
 *     "results": [ ... ],
 *     "stats": {
 *       "totalTranscripts": number,
 *       "totalCorrections": number,
 *       "averageCorrectionsPerTranscript": number,
 *       "averageProcessingTime": number,
 *       "totalCharactersProcessed": number
 *     }
 *   },
 *   "error": "string (if failed)"
 * }
 */
router.post(
  '/correct-batch',
  createAILogger('smart-transcription', 'correct-batch'),
  SmartTranscriptionController.correctTranscriptsBatchEndpoint
);

export default router;
