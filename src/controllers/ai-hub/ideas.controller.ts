/**
 * Ideas Controller
 * وحدة التفكير الإبداعي — endpoint مستقل عن الشات
 * متطلبات مختلفة: max_tokens أكبر، بدون rate limit يومي مشترك
 */

import { Request, Response } from 'express';
import { generateAIResponse } from '../../services/ai-hub/ai-model.service';

type ToolType = 'IDEAS' | 'QUESTIONS' | 'TITLES';

interface IdeasRequest {
  tool: ToolType;
  program: {
    title: string;
    description?: string;
    media_unit_name?: string;
  };
  episode?: {
    title: string;
    air_date?: string;
    guests?: string[];
  };
  guest?: {
    name: string;
  };
  additional_context?: string;
}

interface IdeasResponse {
  success: boolean;
  result?: string;
  error?: string;
}

/**
 * POST /api/ai-hub/ideas/generate
 * توليد أفكار / أسئلة / عناوين بناءً على بيانات البرنامج
 */
export async function generateIdeas(
  req: Request<{}, {}, IdeasRequest>,
  res: Response<IdeasResponse>
): Promise<void> {
  try {
    const { tool, program, episode, guest, additional_context } = req.body;

    // ─── Validate ────────────────────────────────────────────
    if (!tool || !program?.title) {
      res.status(400).json({
        success: false,
        error: 'tool و program.title مطلوبان',
      });
      return;
    }

    if (tool === 'QUESTIONS' && !guest?.name) {
      res.status(400).json({
        success: false,
        error: 'يجب تحديد الضيف لتوليد أسئلة المقابلة',
      });
      return;
    }

    // ─── Build context ───────────────────────────────────────
    let programCtx = `اسم البرنامج: ${program.title}`;
    if (program.description) programCtx += `\nوصف البرنامج: ${program.description}`;
    if (program.media_unit_name) programCtx += `\nالوحدة الإعلامية: ${program.media_unit_name}`;

    if (episode) {
      programCtx += `\n\nالحلقة: ${episode.title}`;
      if (episode.air_date) {
        programCtx += `\nتاريخ البث: ${new Date(episode.air_date).toLocaleDateString('ar')}`;
      }
      if (episode.guests && episode.guests.length > 0) {
        programCtx += `\nضيوف الحلقة: ${episode.guests.join('، ')}`;
      }
    }

    const ctx = additional_context?.trim() ? `\n\nسياق إضافي: ${additional_context}` : '';

    // ─── Build prompt per tool ───────────────────────────────
    let system = '';
    let prompt = '';

    if (tool === 'IDEAS') {
      system = 'أنت مساعد إبداعي متخصص في إنتاج البرامج التلفزيونية والإذاعية. مهمتك توليد أفكار مبدعة ومتنوعة لحلقات قادمة بناءً على طبيعة البرنامج وتوجهاته.';
      prompt = `${programCtx}${ctx}\n\nاقترح 8 أفكار مبتكرة لحلقات قادمة لهذا البرنامج. لكل فكرة: عنوان جذاب + وصف موجز في سطرين.`;

    } else if (tool === 'QUESTIONS') {
      system = 'أنت معد برامج محترف ومحاور متمرس. مهمتك توليد أسئلة مقابلة عميقة وذكية تناسب الضيف والبرنامج.';
      prompt = `${programCtx}\n\nالضيف: ${guest!.name}${ctx}\n\nاقترح 10 أسئلة ذكية للمقابلة. رتبها من العامة إلى الخاصة، وتنوع بين الأسئلة المفتوحة والاستفزازية والإنسانية.`;

    } else {
      system = 'أنت كاتب عناوين إعلامية محترف. مهمتك توليد عناوين جذابة وقوية تشد الجمهور وتعكس مضمون المحتوى.';
      prompt = `${programCtx}${ctx}\n\naقترح 10 عناوين جذابة وقوية لهذا المحتوى. تنوع بين العناوين الإخبارية والتشويقية والعاطفية.`;
    }

    const fullPrompt = `${system}\n\n${prompt}`;

    console.log(`\n💡 [IDEAS] Tool: ${tool} | Program: ${program.title}`);

    const result = await generateAIResponse(fullPrompt, {
      max_tokens: 1500,
      temperature: 0.75,
    });

    res.status(200).json({ success: true, result });

  } catch (error) {
    console.error('❌ Ideas Controller Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
