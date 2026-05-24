/**
 * Outlet-Based Smart Transcription Service
 * يربط التفريغ الذكي بالجهات الإعلامية من الداتابيس
 * ويبني البرومبتات ديناميكياً حسب هوية الجهة المختارة
 */

import { query } from '../../config/database';
import { callAIWithFallback } from './ai-call.service';
import { OutletEditorialProfile } from '../../models/database/transcription-editorial.models';

interface OutletTranscriptionOptions {
  transcript: string;
  outletSlug: string;
  outputTypes?: string[];  // slugs from transcription_output_types
  customInfo?: string;
  clipCount?: number;
  socialCount?: number;
}

interface OutletGeneratedOutput {
  type: string;
  type_name_ar: string;
  content: string;
  metadata?: Record<string, any>;
}

interface OutletTranscriptionResult {
  outlet: { name: string; slug: string; identity: string };
  transcript: string;
  outputs: OutletGeneratedOutput[];
  quality_assessment: string;
  top_ideas: string;
  top_quotes: string;
  editorial_alerts: string;
  metadata: Record<string, any>;
}

/**
 * جلب الجهة الإعلامية من الداتابيس
 */
async function getOutletProfile(slug: string): Promise<OutletEditorialProfile | null> {
  const result = await query(
    'SELECT * FROM outlet_editorial_profiles WHERE slug = $1 AND is_active = true',
    [slug]
  );
  return result.rows[0] || null;
}

/**
 * جلب منصات السوشال ميديا
 */
async function getSocialPlatforms(): Promise<any[]> {
  const result = await query(
    'SELECT * FROM social_media_platforms WHERE is_active = true ORDER BY sort_order'
  );
  return result.rows;
}

/**
 * توليد المخرجات حسب الجهة المختارة
 * يتبع القالب الموحد (القسم 7 من الدليل):
 * 1. تقدير جودة التفريغ
 * 2. أبرز 5 أفكار
 * 3. أفضل 5 اقتباسات
 * 4. تقرير صحفي شامل
 * 5. خبر قصير
 * 6. التفريغ الكامل المنقح
 * 7. بوستات سوشال ميديا
 * 8. مقاطع مقترحة للتقطيع
 * 9. تنبيهات تحريرية
 */
export async function generateByOutlet(
  options: OutletTranscriptionOptions
): Promise<OutletTranscriptionResult> {
  const { transcript, outletSlug, customInfo = '', clipCount = 5, socialCount = 6 } = options;

  // 1. جلب الجهة من الداتابيس
  const outlet = await getOutletProfile(outletSlug);
  if (!outlet) {
    throw new Error(`الجهة "${outletSlug}" غير موجودة أو غير مفعّلة`);
  }

  console.log(`\n📰 [Outlet Transcription] الجهة: ${outlet.name}`);
  console.log(`🎯 [Outlet Transcription] بدء توليد الحزمة التحريرية...`);

  // 2. جلب منصات السوشال
  const socialPlatforms = await getSocialPlatforms();

  // 3. توليد المخرجات بالتوازي (مجموعات)
  const results: Record<string, string> = {};

  // المجموعة 1: تقييم + أفكار + اقتباسات
  console.log(`  📋 توليد: تقييم الجودة + الأفكار + الاقتباسات`);
  results.assessment = await generateAssessment(transcript, outlet);

  // المجموعة 2: التقرير الشامل
  console.log(`  📋 توليد: التقرير الصحفي الشامل`);
  results.report = await generateReport(transcript, outlet, customInfo);

  // المجموعة 3: الخبر القصير
  console.log(`  📋 توليد: الخبر القصير`);
  results.news = await generateShortNews(transcript, outlet, customInfo);

  // المجموعة 4: التفريغ الكامل المنقح
  console.log(`  📋 توليد: التفريغ الكامل المنقح`);
  results.fullTranscript = await generateFullTranscript(transcript, outlet);

  // المجموعة 5: بوستات السوشال
  console.log(`  📋 توليد: بوستات السوشال ميديا`);
  results.social = await generateSocialPosts(transcript, outlet, socialPlatforms);

  // المجموعة 6: المقاطع المقترحة
  console.log(`  📋 توليد: المقاطع المقترحة للتقطيع`);
  results.clips = await generateClips(transcript, outlet, clipCount);

  // المجموعة 7: التنبيهات التحريرية
  console.log(`  📋 توليد: التنبيهات التحريرية`);
  results.alerts = await generateAlerts(transcript);

  console.log(`\n✅ [Outlet Transcription] اكتملت الحزمة التحريرية لـ "${outlet.name}"`);

  return {
    outlet: { name: outlet.name, slug: outlet.slug, identity: outlet.identity },
    transcript,
    outputs: [
      { type: 'comprehensive_report', type_name_ar: 'تقرير صحفي شامل', content: results.report },
      { type: 'short_news', type_name_ar: 'خبر قصير', content: results.news },
      { type: 'full_transcript', type_name_ar: 'التفريغ الكامل المنقح', content: results.fullTranscript },
      { type: 'social_posts', type_name_ar: 'بوستات السوشال ميديا', content: results.social },
      { type: 'video_clips', type_name_ar: 'أهم المقاطع للتقطيع', content: results.clips },
    ],
    quality_assessment: results.assessment.split('---')[0] || results.assessment,
    top_ideas: results.assessment.split('---')[1] || '',
    top_quotes: results.assessment.split('---')[2] || '',
    editorial_alerts: results.alerts,
    metadata: {
      outletName: outlet.name,
      outletSlug: outlet.slug,
      generatedAt: new Date().toISOString(),
      outputsCount: 5,
    },
  };
}

/**
 * توليد تقييم الجودة + أبرز الأفكار + أفضل الاقتباسات
 */
async function generateAssessment(transcript: string, outlet: OutletEditorialProfile): Promise<string> {
  const prompt = `أنت محرر صحفي محترف. أمامك نص مفرغ من ملف صوتي.
الجهة المختارة: ${outlet.name}
هوية الجهة: ${outlet.identity}

المطلوب (بالترتيب):
1. تقدير سريع لجودة التفريغ: واضح/متوسط/بحاجة مراجعة — مع سبب مختصر.
2. أبرز 5 أفكار في النص المفرغ (نقاط مختصرة).
3. أفضل 5 اقتباسات أو مقاطع قابلة للاستخدام (مع ذكر قائلها إن أمكن).

افصل بين الأقسام الثلاثة بعلامة ---

التزم بالمعلومات الموجودة في التفريغ فقط. لا تخترع أسماء أو أرقام.
إذا وجدت معلومة غير واضحة فاكتب أنها بحاجة إلى تحقق.

النص المفرغ:
${transcript}`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد التقرير الصحفي الشامل
 */
async function generateReport(transcript: string, outlet: OutletEditorialProfile, customInfo: string): Promise<string> {
  const prompt = `أنت محرر صحفي محترف. مهمتك كتابة تقرير صحفي شامل.

الجهة: ${outlet.name}
هوية الجهة: ${outlet.identity}
زاوية المعالجة: ${outlet.angle_approach}
النبرة واللغة: ${outlet.tone_language}
تجنب: ${outlet.avoid_rules}
أسلوب التقرير لهذه الجهة: ${outlet.report_style || 'تقرير شامل متوازن'}

الهيكل المطلوب:
1. عنوان رئيسي مناسب لهوية الجهة
2. عنوان بديل أكثر مباشرة
3. مقدمة قوية من 2 إلى 3 جمل تلخص جوهر النص
4. خلفية وسياق من داخل التفريغ
5. تقسيم التقرير إلى محاور بعناوين فرعية صحفية احترافية
6. إدراج الاقتباسات الأقوى دون إطالة
7. فقرة ختامية تلخص الدلالة أو الأثر
8. تنبيه واضح إن كانت هناك معلومات تحتاج تحققًا خارجيًا

المعايير الإلزامية:
- الدقة المطلقة: التزم بالمعلومات الواردة في التفريغ فقط
- لا تخترع أسماء أو أرقام أو سياقات غير واردة
- انسب التصريحات لقائليها بدقة
- أعد ترتيب المادة حسب الأهمية لا حسب التسلسل الزمني
${customInfo ? `\nمعلومات إضافية:\n${customInfo}` : ''}

النص المفرغ:
${transcript}

اكتب التقرير الصحفي الشامل:`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد الخبر القصير
 */
async function generateShortNews(transcript: string, outlet: OutletEditorialProfile, customInfo: string): Promise<string> {
  const prompt = `أنت محرر صحفي محترف. مهمتك كتابة خبر قصير.

الجهة: ${outlet.name}
هوية الجهة: ${outlet.identity}
زاوية المعالجة: ${outlet.angle_approach}
النبرة واللغة: ${outlet.tone_language}
تجنب: ${outlet.avoid_rules}
أسلوب الخبر لهذه الجهة: ${outlet.news_style || 'خبر قصير مباشر'}

الهيكل المطلوب:
1. العنوان: مباشر وقابل للنشر
2. الافتتاحية: أقوى معلومة أو تصريح (ليس أول ما ورد زمنيًا بل الأقوى)
3. الجسم: أهم خلفية وسياق في فقرتين قصيرتين
4. اقتباس واحد عند الحاجة
5. لا يتجاوز 80 إلى 150 كلمة إلا إذا طلبت الجهة غير ذلك

المعايير الإلزامية:
- اختر الزاوية الأقوى لا أول زاوية ظهرت في الحديث
- الدقة المطلقة في النقل
- لا تخترع معلومات غير واردة في التفريغ
${customInfo ? `\nمعلومات إضافية:\n${customInfo}` : ''}

النص المفرغ:
${transcript}

اكتب الخبر القصير:`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد التفريغ الكامل المنقح
 */
async function generateFullTranscript(transcript: string, outlet: OutletEditorialProfile): Promise<string> {
  const prompt = `أنت محرر صحفي محترف. مهمتك تنقيح التفريغ الكامل للنشر.

الجهة: ${outlet.name}
أسلوب التفريغ لهذه الجهة: ${outlet.transcript_style || 'النص الكامل بعد تهذيب لغوي فقط'}

القواعد الإلزامية:
- الحفاظ على كل ما ورد في الصوت من أفكار ومعلومات ومواقف — هذا ليس تلخيصًا
- تحويل العامية إلى فصحى مفهومة عند الحاجة، مع عدم تغيير النبرة إذا كانت مهمة
- تنظيم النص بعناوين فرعية حسب الموضوعات
- حذف التكرار اللفظي فقط، لا حذف المعنى
- تمييز المتحدثين إذا كان النص حوارًا أو مقابلة
- إضافة ملاحظات تحريرية داخل أقواس عند وجود كلمة غير مسموعة أو اسم غير مؤكد
- تصحيح الأخطاء اللغوية الواضحة
- لا يجوز حذف أي نقطة حتى لو كانت أقل أهمية

ممنوع:
- اختراع أسماء أو تغيير موقف المتحدث أو حذف فكرة
- تقصير النص بشكل كبير — التفريغ الكامل يجب أن يكون أطول مخرج

النص المفرغ الأصلي:
${transcript}

أعد كتابة التفريغ الكامل المنقح:`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد بوستات السوشال ميديا — كل منصة بصياغة مختلفة
 */
async function generateSocialPosts(
  transcript: string,
  outlet: OutletEditorialProfile,
  platforms: any[]
): Promise<string> {
  const platformsText = platforms.map(p =>
    `- ${p.name_ar}: ${p.format_description} (حد أقصى ${p.max_length} كلمة تقريبًا)`
  ).join('\n');

  const prompt = `أنت متخصص في التواصل الاجتماعي. مهمتك كتابة حزمة منشورات لكل منصة.

الجهة: ${outlet.name}
هوية الجهة: ${outlet.identity}
النبرة: ${outlet.tone_language}
أسلوب السوشال لهذه الجهة: ${outlet.social_media_style || 'منشورات متنوعة لكل منصة'}
تجنب: ${outlet.avoid_rules}

المنصات المطلوبة ومواصفاتها:
${platformsText}

القواعد الإلزامية:
- كل منصة لها صياغة مختلفة تمامًا — ممنوع النسخ بين المنصات
- كل منشور يجب أن يكون منسوبًا إلى مصدر واضح من التفريغ
- الدقة المطلقة في نقل المعلومات والتصريحات
- لا تخترع معلومات غير واردة في التفريغ

الشكل المطلوب:
اكتب لكل منصة تحت عنوانها مباشرة. مثال:

## فيسبوك
[نص المنشور]

## إكس
[نص المنشور أو الثريد]

## إنستغرام
[الكابشن + شرائح الكاروسيل إن وجدت]

## تيك توك/ريلز
[نص التعليق + hook + ختام]

## لينكدإن
[المنشور المؤسسي — فقط إذا كان المحتوى مناسبًا]

## واتساب/تلغرام
[الملخص السريع]

النص المفرغ:
${transcript}

اكتب حزمة بوستات السوشال ميديا:`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد المقاطع المقترحة للتقطيع
 */
async function generateClips(transcript: string, outlet: OutletEditorialProfile, count: number): Promise<string> {
  const prompt = `أنت متخصص في محتوى الفيديو. مهمتك اقتراح أفضل ${count} مقاطع للتقطيع.

الجهة: ${outlet.name}
معايير اختيار المقاطع لهذه الجهة: ${outlet.clips_criteria || 'أفضل المقاطع من حيث القيمة الخبرية والإنسانية'}

لكل مقطع اكتب:
1. عنوان المقطع: عنوان قصير يصلح للفيديو أو الريلز
2. سبب الاختيار: تصريح قوي، قصة إنسانية، معلومة جديدة، رقم، شرح مبسط، لحظة مؤثرة
3. المدة المثالية: 15-30 ثانية للمقاطع السريعة، 45-90 ثانية للشرح، 2-3 دقائق للتحليلية
4. المنصة المناسبة: فيسبوك، إنستغرام، تيك توك، يوتيوب شورتس، إكس، أو راديو
5. نص الشاشة: جملة قصيرة تظهر على الفيديو
6. النص الكامل للمقطع: النص الحرفي كما ورد في التفريغ
7. التوقيت: إذا وجدت توقيتات بصيغة [MM:SS] في النص استخدمها، وإلا اكتب "بحاجة تحديد يدوي"

تحذيرات:
- لا تخرج الاقتباس من سياقه
- لا تستخدم مقطعًا حساسًا بلا مراجعة
- تأكد من الأسماء والأرقام
- كل مقطع يجب أن يحمل قيمة مستقلة

النص المفرغ:
${transcript}

اقترح أفضل ${count} مقاطع:`;

  return await callAIWithFallback(prompt);
}

/**
 * توليد التنبيهات التحريرية
 */
async function generateAlerts(transcript: string): Promise<string> {
  const prompt = `أنت مراجع تحريري. مهمتك رصد ما يحتاج تحققًا أو مراجعة في النص.

المطلوب:
1. معلومات ناقصة: أي معلومة مذكورة بشكل غير مكتمل
2. أسماء غير مؤكدة: أي اسم غير واضح في التفريغ
3. أرقام بحاجة تحقق: أي رقم أو إحصائية تحتاج تأكيد
4. حساسية قانونية أو أخلاقية: أي عبارة قد تحتاج مراجعة قبل النشر
5. عبارات تحريضية أو اتهامية: أي كلام يتضمن تخوينًا أو اتهامًا غير مسند

لكل تنبيه اكتب:
- العبارة كما وردت
- نوع التنبيه
- مستوى الحساسية (منخفض / متوسط / عالٍ)
- التوصية (تحقق / مراجعة / حذف محتمل)

إذا لم تجد أي تنبيهات، اكتب: "لا توجد تنبيهات تحريرية — النص جاهز للنشر."

النص المفرغ:
${transcript}

اكتب التنبيهات التحريرية:`;

  return await callAIWithFallback(prompt);
}
