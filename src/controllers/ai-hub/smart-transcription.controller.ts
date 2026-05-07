/**
 * Smart Transcription Controller
 * Handles intelligent transcription and editorial output generation
 */

import { Request, Response } from 'express';
import { generateSmartTranscriptionOutputs } from '../../services/ai-hub/smart-transcription.service';

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
        news_article: 'خبر صحفي',
        detailed_report: 'تقرير صحفي',
        social_media: 'منشورات سوشيال ميديا',
        video_clips: 'مقاطع فيديو',
        policy_alerts: 'تنبيهات سياسة التحرير',
      };

      outputs.forEach((output: any) => {
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
}
