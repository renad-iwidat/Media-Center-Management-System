/**
 * Speech-to-Text (STT) Controller
 * Handles audio transcription requests
 */

import { Request, Response } from 'express';
import { transcribeAudioFromUrl, transcribeAudioFromFile, SUPPORTED_LANGUAGES } from '../../services/ai-hub/stt.service';

export class STTController {
  /**
   * Transcribe audio from URL
   * POST /api/ai-hub/stt/transcribe-url
   * 
   * Body:
   * {
   *   "audioUrl": "https://...",
   *   "language": "ar" (optional, defaults to "ar")
   * }
   */
  static async transcribeFromUrl(req: Request, res: Response) {
    try {
      const { audioUrl, language = 'ar' } = req.body;

      if (!audioUrl) {
        return res.status(400).json({
          success: false,
          error: 'audioUrl is required',
        });
      }

      console.log(`\n📝 [STT Controller] Transcribing from URL: ${audioUrl}`);

      const transcript = await transcribeAudioFromUrl(audioUrl, { language });

      res.json({
        success: true,
        data: {
          transcript,
          language,
          audioUrl,
        },
      });
    } catch (error) {
      console.error('Error in STT controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  }

  /**
   * Transcribe audio from file ID (S3 URL)
   * POST /api/ai-hub/stt/transcribe-file
   * 
   * Body:
   * {
   *   "fileId": 123,
   *   "s3Url": "https://...",
   *   "language": "ar" (optional, defaults to "ar")
   * }
   */
  static async transcribeFromFile(req: Request, res: Response) {
    try {
      const { fileId, s3Url, language = 'ar' } = req.body;

      if (!s3Url) {
        return res.status(400).json({
          success: false,
          error: 's3Url is required',
        });
      }

      console.log(`\n📝 [STT Controller] Transcribing file ${fileId} from S3: ${s3Url}`);

      const transcript = await transcribeAudioFromUrl(s3Url, { language });

      res.json({
        success: true,
        data: {
          fileId,
          transcript,
          language,
          s3Url,
        },
      });
    } catch (error) {
      console.error('Error in STT controller:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  }

  /**
   * Get supported languages
   * GET /api/ai-hub/stt/languages
   */
  static async getSupportedLanguages(_req: Request, res: Response) {
    try {
      res.json({
        success: true,
        data: SUPPORTED_LANGUAGES,
      });
    } catch (error) {
      console.error('Error fetching supported languages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch supported languages',
      });
    }
  }
}
