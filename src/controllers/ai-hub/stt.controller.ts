/**
 * Speech-to-Text (STT) Controller
 * Handles audio transcription requests
 */

import { Request, Response } from 'express';
import { transcribeAudioFromUrl, transcribeAudioFromFile, transcribeAudioFromBuffer, SUPPORTED_LANGUAGES } from '../../services/ai-hub/stt.service';

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

  /**
   * Transcribe audio from uploaded file (multipart/form-data)
   * POST /api/ai-hub/stt/transcribe-upload
   * 
   * Form Data:
   * - file: audio file (mp3, wav, etc.)
   * - language: language code (optional, defaults to "ar")
   */
  static async transcribeFromUpload(req: Request, res: Response) {
    try {
      const file = (req as any).file;
      
      if (!file) {
        return res.status(400).json({
          success: false,
          error: 'No audio file provided',
        });
      }

      const language = (req.body.language as string) || 'ar';

      console.log(`\n📝 [STT Controller] Transcribing uploaded file: ${file.originalname}`);
      console.log(`📊 File size: ${file.size} bytes`);
      console.log(`🗣️  Language: ${language}`);

      const transcript = await transcribeAudioFromBuffer(file.buffer, { language });

      res.json({
        success: true,
        data: {
          transcript,
          language,
          fileName: file.originalname,
          fileSize: file.size,
        },
      });
    } catch (error) {
      console.error('Error in STT controller (upload):', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  }

  /**
   * Transcribe audio from base64 encoded data
   * POST /api/ai-hub/stt/transcribe-base64
   * 
   * Body:
   * {
   *   "audioBase64": "base64 encoded audio data",
   *   "language": "ar" (optional, defaults to "ar")
   * }
   */
  static async transcribeFromBase64(req: Request, res: Response) {
    try {
      const { audioBase64, language = 'ar' } = req.body;

      if (!audioBase64) {
        return res.status(400).json({
          success: false,
          error: 'audioBase64 is required',
        });
      }

      console.log(`\n📝 [STT Controller] Transcribing from base64`);
      console.log(`📊 Base64 length: ${audioBase64.length} characters`);
      console.log(`🗣️  Language: ${language}`);

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audioBase64, 'base64');
      console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

      const transcript = await transcribeAudioFromBuffer(audioBuffer, { language });

      res.json({
        success: true,
        data: {
          transcript,
          language,
          audioSize: audioBuffer.length,
        },
      });
    } catch (error) {
      console.error('Error in STT controller (base64):', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio',
      });
    }
  }
}
