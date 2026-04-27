/**
 * Text Tools Controller
 * /summarize — تلخيص النصوص
 * /rewrite   — إعادة صياغة النصوص
 */

import { Request, Response } from 'express';
import { generateAIResponse } from '../../services/ai-hub/ai-model.service';

// ─── Summarize ────────────────────────────────────────────────

interface SummarizeRequest {
  text: string;
  style?: 'bullet_points' | 'short_paragraph' | 'headlines';
  language?: string;
}

interface SummarizeResponse {
  success: boolean;
  result?: string;
  error?: string;
}

const SUMMARIZE_STYLE_LABELS: Record<string, string> = {
  bullet_points:    'نقاط (Bullet Points)',
  short_paragraph:  'فقرة قصيرة مركزة',
  headlines:        'موجز العناوين',
};

/**
 * POST /api/ai-hub/chat/summarize
 */
export async function summarizeText(
  req: Request<{}, {}, SummarizeRequest>,
  res: Response<SummarizeResponse>
): Promise<void> {
  try {
    const { text, style = 'bullet_points', language = 'ar' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ success: false, error: 'text مطلوب ولا يمكن أن يكون فارغاً' });
      return;
    }

    const styleLabel = SUMMARIZE_STYLE_LABELS[style] ?? SUMMARIZE_STYLE_LABELS.bullet_points;
    const langNote  = language === 'ar' ? 'باللغة العربية' : `in ${language}`;

    const system = 'أنت مساعد متخصص في تلخيص المحتوى الإعلامي العربي بدقة واحترافية.';
    const prompt  = `نوع التلخيص: ${styleLabel}\n${langNote}\n\nالنص الأصلي:\n${text.trim()}\n\nيرجى تقديم ملخص دقيق.`;

    console.log(`\n📝 [SUMMARIZE] style=${style} | textLength=${text.length}`);

    const result = await generateAIResponse(`${system}\n\n${prompt}`, {
      max_tokens: 800,
      temperature: 0.3,
    });

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('❌ Summarize Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ─── Rewrite ──────────────────────────────────────────────────

interface RewriteRequest {
  text: string;
  style?: 'radio_broadcast' | 'investigative' | 'social_media' | 'formal' | 'casual';
  language?: string;
}

interface RewriteResponse {
  success: boolean;
  result?: string;
  error?: string;
}

const REWRITE_STYLE_LABELS: Record<string, string> = {
  radio_broadcast: 'بث إذاعي',
  investigative:   'صحفي استقصائي',
  social_media:    'سوشل ميديا',
  formal:          'رسمي مؤسسي',
  casual:          'عامي/كاجوال',
};

/**
 * POST /api/ai-hub/chat/rewrite
 */
export async function rewriteText(
  req: Request<{}, {}, RewriteRequest>,
  res: Response<RewriteResponse>
): Promise<void> {
  try {
    const { text, style = 'radio_broadcast', language = 'ar' } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      res.status(400).json({ success: false, error: 'text مطلوب ولا يمكن أن يكون فارغاً' });
      return;
    }

    const styleLabel = REWRITE_STYLE_LABELS[style] ?? REWRITE_STYLE_LABELS.radio_broadcast;
    const langNote   = language === 'ar' ? 'باللغة العربية' : `in ${language}`;

    const system = 'أنت محرر نصوص محترف. مهمتك إعادة صياغة النص بالأسلوب المطلوب مع الحفاظ على المعنى الأصلي.';
    const prompt  = `الأسلوب المطلوب: ${styleLabel}\n${langNote}\n\nالنص الأصلي:\n${text.trim()}\n\nيرجى إعادة صياغة النص.`;

    console.log(`\n✏️  [REWRITE] style=${style} | textLength=${text.length}`);

    const result = await generateAIResponse(`${system}\n\n${prompt}`, {
      max_tokens: 1200,
      temperature: 0.5,
    });

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('❌ Rewrite Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
