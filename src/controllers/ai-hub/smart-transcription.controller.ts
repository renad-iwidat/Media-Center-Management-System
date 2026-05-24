/**
 * Smart Transcription Controller
 * Handles intelligent transcription and editorial output generation
 */

import { Request, Response } from 'express';
import { generateSmartTranscriptionOutputs } from '../../services/ai-hub/smart-transcription.service';
import { correctTranscript, correctTranscriptsBatch, validateCorrectionQuality, getCorrectionStats } from '../../services/ai-hub/transcript-correction.service';
import { generateByOutlet } from '../../services/ai-hub/outlet-transcription.service';

export class SmartTranscriptionController {
  /**
   * Process audio/video file and generate editorial outputs
   * POST /api/ai-hub/smart-transcription/process
   * 
   * Body:
   * {
   *   "fileUrl": "https://...",
   *   "fileType": "audio" | "video",
   *   "language": "ar" (optional),
   *   "outputs": [
   *     {
   *       "type": "executive_summary" | "news_article" | "detailed_report" | "social_media" | "video_clips" | "policy_alerts",
   *       "enabled": true,
   *       "count": 10 (for social_media and video_clips)
   *     }
   *   ],
   *   "editorialPolicy": "string",
   *   "customInfo": "string"
   * }
   */
  static async processAndGenerate(req: Request, res: Response) {
    try {
      const {
        fileUrl,
        fileType = 'audio',
        language = 'ar',
        outputs = [],
        editorialPolicy = '',
        customInfo = '',
      } = req.body;

      if (!fileUrl) {
        return res.status(400).json({
          success: false,
          error: 'fileUrl is required',
        });
      }

      console.log(`\n🎬 [Smart Transcription] Processing: ${fileUrl}`);
      console.log(`📋 [Smart Transcription] Outputs requested: ${outputs.map((o: any) => o.type).join(', ')}`);

      // Generate outputs
      const result = await generateSmartTranscriptionOutputs({
        fileUrl,
        fileType,
        language,
        outputs: outputs.filter((o: any) => o.enabled),
        editorialPolicy,
        customInfo,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process transcription',
      });
    }
  }

  /**
   * Generate specific outputs from existing transcript
   * POST /api/ai-hub/smart-transcription/generate-outputs
   * 
   * Body:
   * {
   *   "transcript": "string",
   *   "outputs": [
   *     {
   *       "type": "executive_summary" | "news_article" | ...,
   *       "enabled": true,
   *       "count": 10
   *     }
   *   ],
   *   "editorialPolicy": "string",
   *   "customInfo": "string"
   * }
   */
  static async generateOutputs(req: Request, res: Response) {
    try {
      const {
        transcript,
        outputs = [],
        editorialPolicy = '',
        customInfo = '',
      } = req.body;

      if (!transcript) {
        return res.status(400).json({
          success: false,
          error: 'transcript is required',
        });
      }

      console.log(`\n📝 [Smart Transcription] Generating outputs from transcript`);

      // Generate outputs from transcript
      const result = await generateSmartTranscriptionOutputs({
        transcript,
        outputs: outputs.filter((o: any) => o.enabled),
        editorialPolicy,
        customInfo,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate outputs',
      });
    }
  }

  /**
   * Export unified file
   * POST /api/ai-hub/smart-transcription/export
   * 
   * Body:
   * {
   *   "outputs": [
   *     {
   *       "type": "executive_summary",
   *       "content": "string"
   *     }
   *   ],
   *   "editorialPolicy": "string",
   *   "customInfo": "string"
   * }
   */
  static async exportUnified(req: Request, res: Response) {
    try {
      const { outputs = [], editorialPolicy = '', customInfo = '' } = req.body;

      if (!outputs || outputs.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'outputs are required',
        });
      }

      console.log(`\n📥 [Smart Transcription] Exporting unified file`);

      // Build unified content
      let content = `# التفريغ الذكي - ${new Date().toLocaleDateString('ar-SA')}\n\n`;

      if (editorialPolicy) {
        content += `## سياسة التحرير\n${editorialPolicy}\n\n`;
      }

      if (customInfo) {
        content += `## معلومات إضافية\n${customInfo}\n\n`;
      }

      const outputLabels: Record<string, string> = {
        executive_summary: 'ملخص تنفيذي',
        detailed_report: 'تقرير صحفي',
        news_article: 'خبر صحفي',
        video_clips: 'مقاطع مقترحة للنشر',
        social_media: 'منشورات سوشيال ميديا',
        policy_alerts: 'تنبيهات سياسة التحرير',
      };

      // الترتيب المطلوب للمخرجات حسب سياسة التحرير
      const requiredOrder = [
        'executive_summary',
        'detailed_report',
        'news_article',
        'video_clips',
        'social_media',
        'policy_alerts',
      ];

      // ترتيب المخرجات حسب الترتيب المطلوب
      const orderedOutputs = [...outputs].sort((a: any, b: any) => {
        const indexA = requiredOrder.indexOf(a.type);
        const indexB = requiredOrder.indexOf(b.type);
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      orderedOutputs.forEach((output: any) => {
        const label = outputLabels[output.type] || output.type;
        content += `## ${label}\n`;
        content += `${output.content}\n\n`;
      });

      // Return as file
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="smart-transcription-${Date.now()}.txt"`);
      res.send(content);
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to export file',
      });
    }
  }

  /**
   * Correct transcript using linguistic correction layer
   * POST /api/ai-hub/smart-transcription/correct
   * 
   * Body:
   * {
   *   "transcript": "string",
   *   "language": "ar" (optional),
   *   "preserveMeaning": true (optional),
   *   "fixPunctuation": true (optional),
   *   "fixGrammar": true (optional),
   *   "fixSpelling": true (optional),
   *   "improveClarity": true (optional)
   * }
   */
  static async correctTranscriptEndpoint(req: Request, res: Response) {
    try {
      const {
        transcript,
        language = 'ar',
        preserveMeaning = true,
        fixPunctuation = true,
        fixGrammar = true,
        fixSpelling = true,
        improveClarity = true,
      } = req.body;

      if (!transcript) {
        return res.status(400).json({
          success: false,
          error: 'transcript is required',
        });
      }

      console.log(`\n🔧 [Smart Transcription] Correcting transcript`);

      // Correct transcript
      const result = await correctTranscript(transcript, {
        language,
        preserveMeaning,
        fixPunctuation,
        fixGrammar,
        fixSpelling,
        improveClarity,
      });

      // Validate correction quality
      const validation = validateCorrectionQuality(result);

      res.json({
        success: true,
        data: {
          ...result,
          validation,
        },
      });
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Correction Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to correct transcript',
      });
    }
  }

  /**
   * Correct multiple transcripts in batch
   * POST /api/ai-hub/smart-transcription/correct-batch
   * 
   * Body:
   * {
   *   "transcripts": ["string", "string", ...],
   *   "language": "ar" (optional),
   *   "preserveMeaning": true (optional),
   *   "fixPunctuation": true (optional),
   *   "fixGrammar": true (optional),
   *   "fixSpelling": true (optional),
   *   "improveClarity": true (optional)
   * }
   */
  static async correctTranscriptsBatchEndpoint(req: Request, res: Response) {
    try {
      const {
        transcripts = [],
        language = 'ar',
        preserveMeaning = true,
        fixPunctuation = true,
        fixGrammar = true,
        fixSpelling = true,
        improveClarity = true,
      } = req.body;

      if (!transcripts || transcripts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'transcripts array is required',
        });
      }

      console.log(`\n🔧 [Smart Transcription] Correcting ${transcripts.length} transcripts in batch`);

      // Correct transcripts
      const results = await correctTranscriptsBatch(transcripts, {
        language,
        preserveMeaning,
        fixPunctuation,
        fixGrammar,
        fixSpelling,
        improveClarity,
      });

      // Get statistics
      const stats = getCorrectionStats(results);

      res.json({
        success: true,
        data: {
          results,
          stats,
        },
      });
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Batch Correction Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to correct transcripts',
      });
    }
  }

  /**
   * Generate editorial package by outlet
   * POST /api/ai-hub/smart-transcription/generate-by-outlet
   * 
   * Body:
   * {
   *   "transcript": "string (required)",
   *   "outletSlug": "string (required) - slug of the outlet from outlet_editorial_profiles",
   *   "customInfo": "string (optional)",
   *   "clipCount": number (optional, default 5),
   *   "socialCount": number (optional, default 6)
   * }
   */
  static async generateByOutletEndpoint(req: Request, res: Response) {
    try {
      const { transcript, transcriptWithTimestamps, outletSlug, customInfo = '', clipCount = 5, socialCount = 6 } = req.body;

      if (!transcript) {
        return res.status(400).json({ success: false, error: 'transcript مطلوب' });
      }

      if (!outletSlug) {
        return res.status(400).json({ success: false, error: 'outletSlug مطلوب — اختر جهة إعلامية' });
      }

      console.log(`\n📰 [Smart Transcription] Generate by outlet: ${outletSlug}`);
      if (transcriptWithTimestamps) {
        console.log(`⏱️  [Smart Transcription] Timestamps available for clips`);
      }

      const result = await generateByOutlet({
        transcript,
        transcriptWithTimestamps,
        outletSlug,
        customInfo,
        clipCount,
        socialCount,
      });

      res.json({ success: true, data: result });
    } catch (error: any) {
      console.error('❌ [Smart Transcription] Generate by outlet error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'فشل توليد الحزمة التحريرية',
      });
    }
  }
}
