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

    // Limit input text to prevent context overflow (8192 token limit)
    // Approximate: 1 token ≈ 4 characters, so 4000 chars ≈ 1000 tokens
    const MAX_INPUT_CHARS = 4000;
    if (text.length > MAX_INPUT_CHARS) {
      res.status(400).json({ 
        success: false, 
        error: `النص طويل جداً. الحد الأقصى ${MAX_INPUT_CHARS} حرف. النص الحالي: ${text.length} حرف.` 
      });
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
  style?: 'news_report' | 'radio_broadcast' | 'investigative' | 'social_media' | 'formal' | 'casual';
  language?: string;
}

interface RewriteResponse {
  success: boolean;
  result?: string;
  error?: string;
}

const REWRITE_STYLE_LABELS: Record<string, string> = {
  news_report:     'أسلوب خبر صحفي',
  radio_broadcast: 'بث إذاعي',
  investigative:   'صحفي استقصائي',
  social_media:    'سوشل ميديا',
  formal:          'رسمي مؤسسي',
  casual:          'عامي/كاجوال',
};

/**
 * تعليمات تفصيلية إضافية لبعض الأساليب.
 * الأساليب غير المذكورة هنا تعتمد على الـ styleLabel فقط (السلوك الافتراضي).
 */
const REWRITE_STYLE_GUIDELINES: Record<string, string> = {
  news_report: `اكتب خبرًا صحفيًا محترفًا وفق الأصول التالية، والتزم بالحقائق الواردة في النص دون إضافة أو استنتاج أو رأي:

1) العنوان: دقيق يعكس أهم معلومة، بلا رأي أو مبالغة، قصير نسبيًا (7-14 كلمة غالبًا)، يحتوي كلمة مفتاحية، ولا يضلّل القارئ.
2) المقدمة (Lead): أهم فقرة، تجيب في أول سطرين عن ماذا حدث؟ من؟ أين؟ متى؟ ولماذا/كيف إن أمكن.
3) جسم الخبر (الهرم المقلوب): أهم المعلومات ثم التفاصيل ثم الخلفية ثم المعلومات الثانوية، بحيث يبقى الخبر مفهومًا لو حُذف آخره.
4) الدقة: لا إضافة من المحرر ولا استنتاجات ولا تفسير شخصي، ولا تغيير في معنى التصريحات، وانقل الأرقام كما وردت، وانسب كل معلومة إلى مصدرها (وفقًا للتقرير... / بحسب... / قال...).
5) اللغة: عربية سليمة، جمل قصيرة، أفعال قوية واضحة، تجنّب التكرار والإنشاء.
6) الموضوعية: افصل بين الوقائع والاتهامات والآراء (اكتب "اتهمت الجهة بـ..." بدل الجزم)، إلا إذا كانت الواقعة مثبتة من مصدر رسمي أو قضائي.
7) الخلفية: أضف عند الحاجة فقرة قصيرة تشرح السياق دون إطالة.
8) الاقتباسات: اختر أهم تصريح فقط، بلا تصريحات طويلة، واحذف التكرار وأبقِ الأكثر قيمة.
9) المصطلحات المعتمدة (النجاح الإخباري): جيش الاحتلال، قوات الاحتلال، مستوطنون، مستوطنة، الضفة الغربية المحتلة (عند الحاجة)، وتجنّب أي مفردات تخالف السياسة التحريرية.
10) النهاية: أنهِ الخبر بمعلومة مهمة أو خلفية مرتبطة، وليس بجملة إنشائية مثل "يُذكر أن..." إلا إذا أضافت قيمة.

أعد النص كخبر صحفي متكامل (عنوان + مقدمة + جسم) ملتزمًا بكل ما سبق.`,
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

    // Limit input text to prevent context overflow (8192 token limit)
    // Approximate: 1 token ≈ 4 characters, so 4000 chars ≈ 1000 tokens
    const MAX_INPUT_CHARS = 4000;
    if (text.length > MAX_INPUT_CHARS) {
      res.status(400).json({ 
        success: false, 
        error: `النص طويل جداً. الحد الأقصى ${MAX_INPUT_CHARS} حرف. النص الحالي: ${text.length} حرف.` 
      });
      return;
    }

    const styleLabel = REWRITE_STYLE_LABELS[style] ?? REWRITE_STYLE_LABELS.radio_broadcast;
    const styleGuidelines = REWRITE_STYLE_GUIDELINES[style];
    const langNote   = language === 'ar' ? 'باللغة العربية' : `in ${language}`;

    const system = 'أنت محرر نصوص محترف. مهمتك إعادة صياغة النص بالأسلوب المطلوب مع الحفاظ على المعنى الأصلي.';
    const guidelinesBlock = styleGuidelines ? `\n\nتعليمات الأسلوب:\n${styleGuidelines}` : '';
    const prompt  = `الأسلوب المطلوب: ${styleLabel}\n${langNote}${guidelinesBlock}\n\nالنص الأصلي:\n${text.trim()}\n\nيرجى إعادة صياغة النص.`;

    console.log(`\n✏️  [REWRITE] style=${style} | textLength=${text.length}`);

    const result = await generateAIResponse(`${system}\n\n${prompt}`, {
      max_tokens: style === 'news_report' ? 1500 : 800,
      temperature: style === 'news_report' ? 0.3 : 0.5,
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
