/**
 * Tag Generator
 * توليد الكلمات المفتاحية (keywords) بالذكاء الاصطناعي وتحضيرها للإرسال
 */

import { query } from '../../../config/database';
import { callOpenAIChatAPI } from '../../ai-hub/ai-call.service';

/**
 * توليد تاجز بالـ AI من العنوان والمحتوى وحفظها بالداتابيس
 */
export async function generateAndSaveTags(
  articleId: number,
  title: string,
  content: string
): Promise<string[]> {
  try {
    const prompt = `أنت محرر SEO محترف. استخرج 5-8 كلمات مفتاحية (keywords) من الخبر التالي.
القواعد:
- كل كلمة مفتاحية يجب أن تكون كلمة واحدة فقط (بدون مسافات)
- بالعربية
- ذات صلة بالمحتوى
- مناسبة لمحركات البحث

العنوان: ${title}
المحتوى: ${content.substring(0, 500)}

أرجع الكلمات المفتاحية فقط مفصولة بفواصل، بدون ترقيم أو شرح. كل كلمة يجب أن تكون مفردة.
مثال: غزة,صحة,مستشفى,طوارئ,جرحى,فلسطين,علاج,إصابات`;

    const aiResponse = await callOpenAIChatAPI(prompt);

    const tags = aiResponse
      .split(/[,،\n]/)
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length < 50)
      .slice(0, 8);

    if (tags.length > 0) {
      await query('UPDATE raw_data SET tags = $1 WHERE id = $2', [tags, articleId]);
      console.log(`   🏷️ AI Tags generated: [${tags.join(', ')}]`);
    }

    return tags;
  } catch (err) {
    console.log(`   ⚠️ فشل توليد التاجز بالـ AI: ${err instanceof Error ? err.message : 'unknown'}`);
    return [];
  }
}

/**
 * تحضير الـ tags كـ string مفصول بفواصل جاهز للإرسال لـ API الخارجي
 * يتعامل مع كل الحالات: مصفوفة، نص، أو لا يوجد تاجز
 */
export async function prepareTagsString(
  tags: any,
  articleId: number,
  title: string,
  content: string
): Promise<string> {
  // حالة: مصفوفة من التاجز
  if (Array.isArray(tags) && tags.length > 0) {
    return tags
      .map((t: any) => String(t).trim().split(/\s+/)[0])
      .filter((t: string) => t.length > 1 && t.length < 30)
      .slice(0, 8)
      .join(',');
  }

  // حالة: نص (string)
  if (typeof tags === 'string' && tags.trim()) {
    let cleaned = tags.trim();
    if (cleaned.startsWith('[') || cleaned.startsWith('{')) {
      cleaned = cleaned.replace(/[\[\]{}"']/g, '');
    }
    const result = cleaned
      .split(/[,،]/)
      .map(t => t.trim().split(/\s+/)[0])
      .filter(t => t.length > 1)
      .slice(0, 8)
      .join(',');
    if (result) return result;
  }

  // حالة: لا توجد تاجز → توليد بالـ AI
  console.log(`   🤖 لا توجد تاجز — جاري التوليد بالـ AI...`);
  const aiTags = await generateAndSaveTags(articleId, title, content);
  if (aiTags.length > 0) {
    return aiTags.slice(0, 8).join(',');
  }

  // fallback: استخراج كلمات من العنوان
  return title
    .replace(/\*/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 5)
    .join(',');
}
