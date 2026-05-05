/**
 * Speech-to-Text (STT) Controller
 * Handles audio transcription requests
 */

import { Request, Response } from 'express';
import { transcribeAudioWithOpenAI, OPENAI_SUPPORTED_LANGUAGES, transcribeAudioWithTimestamps, createSRTSubtitles, formatTimestamp } from '../../services/ai-hub/openai-stt.service';

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

      // Download audio from URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      const result = await transcribeAudioWithOpenAI(audioBuffer, { language, includeTimestamps: false });
      const transcript = typeof result === 'string' ? result : result.text;

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

      // Download audio from S3 URL
      const response = await fetch(s3Url);
      if (!response.ok) {
        throw new Error(`Failed to download audio from S3: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      const result = await transcribeAudioWithOpenAI(audioBuffer, { language, includeTimestamps: false });
      const transcript = typeof result === 'string' ? result : result.text;

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
        data: OPENAI_SUPPORTED_LANGUAGES,
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

      const result = await transcribeAudioWithOpenAI(file.buffer, { language, includeTimestamps: false });
      const transcript = typeof result === 'string' ? result : result.text;

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

      const result = await transcribeAudioWithOpenAI(audioBuffer, { language, includeTimestamps: false });
      const transcript = typeof result === 'string' ? result : result.text;

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

  /**
   * Transcribe audio with timestamps
   * POST /api/ai-hub/stt/transcribe-with-timestamps
   * 
   * Body:
   * {
   *   "audioUrl": "https://..." (required),
   *   "language": "ar" (optional, defaults to "ar"),
   *   "format": "json|srt" (optional, defaults to "json")
   * }
   * 
   * Response (JSON format):
   * {
   *   "success": true,
   *   "data": {
   *     "transcript": "النص الكامل...",
   *     "segments": [
   *       { "start": 0.0, "end": 5.2, "text": "أول جملة" },
   *       { "start": 5.2, "end": 10.5, "text": "جملة ثانية" }
   *     ],
   *     "duration": 433.17,
   *     "language": "ar"
   *   }
   * }
   * 
   * Response (SRT format):
   * {
   *   "success": true,
   *   "data": {
   *     "transcript": "النص الكامل...",
   *     "srt": "1\n00:00:00,000 --> 00:00:05,200\nأول جملة\n\n2\n00:00:05,200 --> 00:00:10,500\nجملة ثانية\n",
   *     "duration": 433.17,
   *     "language": "ar"
   *   }
   * }
   */
  static async transcribeWithTimestamps(req: Request, res: Response) {
    try {
      const { audioUrl, language = 'ar', format = 'json' } = req.body;

      if (!audioUrl) {
        return res.status(400).json({
          success: false,
          error: 'audioUrl is required',
        });
      }

      console.log(`\n📝 [STT Controller] Transcribing with timestamps: ${audioUrl}`);
      console.log(`🗣️  Language: ${language}`);
      console.log(`📋 Format: ${format}`);

      // Download audio from URL
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to download audio: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = Buffer.from(arrayBuffer);

      // Get transcription with timestamps
      const result = await transcribeAudioWithTimestamps(audioBuffer, { language });

      console.log(`✅ Transcription completed with ${result.segments.length} segments`);

      if (format === 'srt') {
        const srtContent = createSRTSubtitles(result.segments);
        res.json({
          success: true,
          data: {
            transcript: result.text,
            srt: srtContent,
            duration: result.duration,
            language,
            segmentCount: result.segments.length,
          },
        });
      } else {
        res.json({
          success: true,
          data: {
            transcript: result.text,
            segments: result.segments.map(seg => ({
              start: seg.start,
              end: seg.end,
              text: seg.text,
              startFormatted: formatTimestamp(seg.start),
              endFormatted: formatTimestamp(seg.end),
            })),
            duration: result.duration,
            language,
            segmentCount: result.segments.length,
          },
        });
      }
    } catch (error) {
      console.error('Error in STT controller (timestamps):', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to transcribe audio with timestamps',
      });
    }
  }
}
