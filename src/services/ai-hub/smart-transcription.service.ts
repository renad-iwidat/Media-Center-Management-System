/**
 * Smart Transcription Service
 * Handles intelligent transcription and editorial output generation
 * 
 * Flow:
 * 1. Transcription: Uses OpenAI STT
 * 2. Output Generation: Uses AI_MODEL first, falls back to OpenAI if it fails
 */

import { transcribeAudioBufferParallel } from './parallel-stt.service';
import { extractAudioFromVideoUrl } from './audio-extraction.service';
import { correctTranscript } from './transcript-correction.service';
import { callAIWithFallback, callOpenAIChatAPI } from './ai-call.service';

// Re-export for backward compatibility
export { callAIWithFallback, callOpenAIChatAPI };

interface OutputConfig {
  type: 'executive_summary' | 'detailed_report' | 'news_article' | 'video_clips' | 'social_media' | 'policy_alerts';
  enabled: boolean;
  count?: number;
}

interface SmartTranscriptionOptions {
  fileUrl?: string;
  transcript?: string;
  fileType?: 'audio' | 'video';
  language?: string;
  outputs: OutputConfig[];
  editorialPolicy?: string;
  customInfo?: string;
}

interface GeneratedOutput {
  type: string;
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Generate smart transcription outputs
 */
export async function generateSmartTranscriptionOutputs(
  options: SmartTranscriptionOptions
): Promise<{
  transcript: string;
  originalTranscript?: string;
  outputs: GeneratedOutput[];
  metadata: Record<string, any>;
}> {
  const {
    fileUrl,
    transcript: providedTranscript,
    fileType = 'audio',
    language = 'ar',
    outputs,
    editorialPolicy = '',
    customInfo = '',
  } = options;

  let transcript = providedTranscript;

  // Step 1: Extract audio and transcribe using Parallel STT (handles large files)
  if (!transcript && fileUrl) {
    console.log(`\n🎬 [Smart Transcription] Processing ${fileType} file...`);
    
    if (fileType === 'video') {
      try {
        console.log(`📹 [Smart Transcription] Extracting audio from video...`);
        const audioBuffer = await extractAudioFromVideoUrl(fileUrl);
        console.log(`✅ [Smart Transcription] Audio extracted successfully (${audioBuffer.length} bytes)`);
        
        // Transcribe using Parallel STT (handles chunking for large files)
        console.log(`🎤 [Smart Transcription] Transcribing with Parallel STT...`);
        transcript = await transcribeAudioBufferParallel(audioBuffer, {
          language,
          chunkDurationSeconds: 300, // 5 minutes per chunk
          maxConcurrentRequests: 3,
        });
      } catch (error: any) {
        console.error(`⚠️ [Smart Transcription] Video processing failed: ${error.message}`);
        throw new Error(`Failed to process video: ${error.message}`);
      }
    } else {
      // For audio files, download and transcribe
      try {
        console.log(`🎤 [Smart Transcription] Downloading and transcribing audio...`);
        const response = await fetch(fileUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);
        
        // Use Parallel STT for large audio files
        transcript = await transcribeAudioBufferParallel(audioBuffer, {
          language,
          chunkDurationSeconds: 300, // 5 minutes per chunk
          maxConcurrentRequests: 3,
        });
      } catch (error: any) {
        console.error(`⚠️ [Smart Transcription] Audio processing failed: ${error.message}`);
        throw new Error(`Failed to process audio: ${error.message}`);
      }
    }

    console.log(`✅ [Smart Transcription] Transcription complete (${transcript.length} characters)`);
  }

  if (!transcript) {
    throw new Error('No transcript available for output generation');
  }

  // Step 1.5: Correct transcript using AI_MODEL (linguistic correction layer)
  console.log(`\n🔧 [Smart Transcription] Applying linguistic correction layer...`);
  
  let correctedTranscript = transcript;
  try {
    const correctionResult = await correctTranscript(transcript, {
      language,
      preserveMeaning: true,
      fixPunctuation: true,
      fixGrammar: true,
      fixSpelling: true,
      improveClarity: true,
    });

    correctedTranscript = correctionResult.correctedTranscript;
    
    console.log(`✅ [Smart Transcription] Linguistic correction completed`);
    console.log(`📊 Corrections applied: ${correctionResult.metadata.correctionCount}`);
    console.log(`📝 Original: ${correctionResult.metadata.originalLength} chars → Corrected: ${correctionResult.metadata.correctedLength} chars`);
  } catch (error: any) {
    console.warn(`⚠️ [Smart Transcription] Linguistic correction failed, using original transcript: ${error.message}`);
    // Continue with original transcript if correction fails
  }

  // Step 2: Generate requested outputs using AI_MODEL (with OpenAI fallback)
  console.log(`\n🔄 [Smart Transcription] Generating ${outputs.length} output types...`);
  
  const generatedOutputs: GeneratedOutput[] = [];

  for (const output of outputs) {
    try {
      console.log(`\n📋 [Smart Transcription] Generating: ${output.type}`);
      
      const content = await generateOutput(
        output.type,
        correctedTranscript,
        output.count || 10,
        editorialPolicy,
        customInfo
      );

      generatedOutputs.push({
        type: output.type,
        content,
        metadata: {
          generatedAt: new Date().toISOString(),
          count: output.count,
        },
      });

      console.log(`✅ [Smart Transcription] Generated: ${output.type}`);
    } catch (error: any) {
      console.error(`❌ [Smart Transcription] Failed to generate ${output.type}:`, error.message);
      
      // Add error placeholder
      generatedOutputs.push({
        type: output.type,
        content: `⚠️ فشل توليد هذا المخرج: ${error.message}`,
        metadata: {
          generatedAt: new Date().toISOString(),
          error: true,
        },
      });
    }
  }

  return {
    transcript: correctedTranscript,
    originalTranscript: transcript,
    outputs: generatedOutputs,
    metadata: {
      generatedAt: new Date().toISOString(),
      language,
      editorialPolicy: !!editorialPolicy,
      customInfo: !!customInfo,
      outputsGenerated: generatedOutputs.filter(o => !o.metadata?.error).length,
      outputsFailed: generatedOutputs.filter(o => o.metadata?.error).length,
      transcriptCorrected: transcript !== correctedTranscript,
    },
  };
}

/**
 * Generate a specific output type with professional prompts
 */
async function generateOutput(
  type: string,
  transcript: string,
  count: number,
  editorialPolicy: string,
  customInfo: string
): Promise<string> {
  
  const prompts: Record<string, string> = {
    executive_summary: `
أنت محرر صحفي محترف في قناة إخبارية عربية رائدة.

المهمة: اكتب ملخصاً تنفيذياً قصيراً ومهنياً من 4 إلى 6 أسطر.

يجب أن يوضح الملخص التنفيذي:
- أصل القصة (من أين جاءت المعلومة أو الخبر)
- الأطراف الرئيسية المعنية
- أهم تطور في المادة
- العقدة الأساسية
- أبرز تصريح أو موقف
- ما الذي ما زال غير محسوم

المعايير الإلزامية:
- الدقة المطلقة في النقل: التزم تماماً بالكلمات والمصطلحات والمعلومات الواردة في المادة الأصلية
- ممنوع الإضافة أو الحذف أو التعديل في المعنى
- يُسمح فقط بكلمات ربط بسيطة لتحسين الصياغة دون إخلال بالمعنى
- انسب التصريحات لقائليها بدقة مع ذكر صفاتهم

الشكل المطلوب:
ابدأ بعنوان "ملخص تنفيذي" ثم اكتب الملخص مباشرة.

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب الملخص التنفيذي:`,

    news_article: `
أنت محرر صحفي محترف في قناة إخبارية عربية رائدة.

المهمة: اكتب خبراً صحفياً مختصراً ومباشراً بأسلوب الهرم المقلوب.

الهيكل المطلوب:
1. العنوان: جملة خبرية قوية تلخص أهم معلومة
2. الفقرة الأولى: أهم معلومة في الخبر (من، ماذا، أين، متى)
3. الفقرات التالية: التفاصيل والتصريحات المنسوبة
4. الفقرة الأخيرة: الخلفية أو السياق

المعايير الإلزامية:
- يبدأ الخبر بأهم معلومة، ثم ينتقل إلى التفاصيل، ثم الخلفية
- الدقة المطلقة في النقل: التزم تماماً بالكلمات والمصطلحات والمعلومات الواردة في المادة الأصلية
- ممنوع الإضافة أو الحذف أو التعديل في المعنى
- انسب التصريحات لقائليها بدقة بصيغة: قال فلان (صفته): "..."
- استخدم الأرقام والإحصائيات الواردة بدقة
- أي معلومة يجب أن تكون منسوبة إلى مصدر واضح (حسب تقرير لـ...، وفق وكالة...، قال...، إلخ)

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب الخبر الصحفي:`,

    detailed_report: `
أنت محرر صحفي محترف في قناة إخبارية عربية رائدة.

المهمة: اكتب تقريراً صحفياً جاهزاً للنشر مع الحفاظ على مضمون المادة.

الهيكل المطلوب:
1. العنوان الرئيسي: عنوان صحفي احترافي جذاب يعكس جوهر التقرير
2. فقرة تمهيدية: تضع السياق العام وتشد القارئ
3. أقسام التقرير: كل قسم بعنوان صحفي احترافي (ليس "القسم الأول" أو "المقدمة" أو "الخاتمة")
4. الفقرة الأخيرة: تكون جزءاً طبيعياً من التقرير دون كتابة كلمة "الخاتمة"

ممنوع استخدام العناوين التالية:
- المقدمة
- القسم الأول / الثاني / الثالث...
- الخاتمة

بدلاً منها استخدم عناوين صحفية احترافية مثل:
- تسريبات عن اتفاق يقترب من التوقيع
- اليورانيوم المخصب في قلب الأزمة
- خيارات مطروحة بين النقل وخفض التخصيب
- طهران بين التنازل والتكتيك التفاوضي
- أسئلة معلقة حول مستقبل الاتفاق

المعايير الإلزامية:
- الدقة المطلقة في النقل
- التحليل المعمّق مع الحفاظ على الموضوعية
- انسب التصريحات لقائليها بدقة مع ذكر صفاتهم
- استخدم الأرقام والإحصائيات الواردة بدقة
- أي معلومة يجب أن تكون منسوبة إلى مصدر واضح
- الفقرة الأخيرة تكون جزءاً طبيعياً من التقرير بدون عنوان "الخاتمة"

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب التقرير الصحفي:`,

    social_media: `
أنت متخصص في التواصل الاجتماعي في قناة إخبارية عربية رائدة.

المهمة: اكتب ${count} منشورات لوسائل التواصل الاجتماعي.

القاعدة الأساسية:
كل منشور يجب أن يبدأ باسم القائل أو المصدر أو الجهة التي صدرت عنها المعلومة.

أشكال الإسناد المطلوبة:
- حسب تقرير لصحيفة [اسم الصحيفة]:
- حسب تقرير لموقع [اسم الموقع]:
- وفق وكالة [اسم الوكالة]:
- قال [الاسم الكامل]، [الصفة]:
- صرّح [الاسم]، [الصفة]:
- يرى [الاسم]، [الصفة]:
- ذكر مراسل القناة:
- أوضح المحلل السياسي [الاسم]:
- بحسب بيان صادر عن [الجهة]:
- وفق تقديرات منسوبة إلى [الجهة]:

الشكل المطلوب لكل منشور:
المنشور [الرقم]
[مصدر الإسناد]:
[نص المنشور]

أنواع المنشورات:
1. منشور مبني على تصريح: يبدأ باسم الشخص وصفته، ثم الاقتباس بين علامتي تنصيص
2. منشور مبني على تقرير صحفي: يبدأ باسم الصحيفة أو الموقع
3. منشور مبني على وكالة أنباء: يبدأ باسم الوكالة
4. منشور مبني على تحليل: يبدأ باسم المحلل أو الباحث

المعايير الإلزامية:
- كل منشور يجب أن يكون منسوباً إلى مصدر واضح (ممنوع منشور بدون إسناد)
- الدقة المطلقة في نقل التصريحات
- منشورات قصيرة ومؤثرة
- تنوع في المحتوى (تصريحات، أرقام، معلومات)

ممنوع:
- كتابة منشور بدون ذكر المصدر في البداية
- نسب معلومة لجهة لم تُذكر في المادة الأصلية

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب ${count} منشورات منسوبة لمصادرها:`,

    video_clips: `
أنت متخصص في محتوى الفيديو في قناة إخبارية عربية رائدة.

المهمة: حدد أفضل ${count} مقاطع مقترحة للنشر من المادة.

الشكل المطلوب لكل مقطع (التزم بهذا الشكل بالضبط):

المقطع [الرقم]

التوقيت:
[MM:SS] – [MM:SS]

العنوان:
[عنوان صحفي جذاب للمقطع]

النص الكامل:
"[النص الحرفي الكامل الوارد في التفريغ داخل هذا التوقيت]"

المعايير الإلزامية:
- التوقيت بصيغة: MM:SS – MM:SS (مثال: 00:00 – 01:15)
- النص الكامل يجب أن يكون منقولاً حرفياً كما ورد في التفريغ داخل التوقيت المحدد
- ممنوع تلخيص النص أو اختصاره - يجب نقله كاملاً كما هو
- اختر اللحظات الأكثر أهمية وتأثيراً
- العنوان يجب أن يكون صحفياً وجذاباً ودقيقاً
- تنوع في المقاطع (تصريحات، أرقام، لحظات مهمة)

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

حدد أفضل ${count} مقاطع مقترحة للنشر:`,

    policy_alerts: `
أنت متخصص في مراجعة السياسات التحريرية في قناة إخبارية عربية رائدة.

المهمة: راجع المادة وارصد أي عبارة تخالف أو قد تخالف سياسة التحرير.

القاعدة الأساسية:
- لا تضع صياغات بديلة
- لا تضع اقتراحات تحريرية
- فقط ارصد العبارة وحدد المخالفة

الشكل المطلوب (جدول):
لكل تنبيه اكتب:
رقم: [الرقم]
العبارة كما وردت: "[العبارة بالنص الحرفي]"
وردت على لسان: [ضيف / الراوي / غير واضح]
نوع المخالفة: [نوع المخالفة]
سبب التنبيه: [شرح مختصر لسبب التنبيه]
مستوى الحساسية: [متوسط / عالٍ / عالٍ جداً]

---

أنواع المخالفات التي يجب رصدها:

1. تخوين واتهامات:
خائن، عميل، باع القضية، متآمر، مأجور، أدوات الاحتلال، العملاء، الخونة

2. هجوم على الرئيس:
الرئيس خائن، عباس باع القضية، الرئيس لا يمثل الشعب، الرئيس متواطئ، القيادة باعت الشعب

3. هجوم على السلطة الفلسطينية:
السلطة باعت القضية، السلطة عميلة، السلطة تتآمر، السلطة تقمع الشعب، الأجهزة الأمنية تخدم الاحتلال

4. هجوم على فصائل أو شخصيات فلسطينية:
أي اتهام غير موثق، أي شتيمة أو وصف جارح، أي تعميم قد يثير حساسية داخلية فلسطينية

5. مصطلحات سياسية حساسة:
مصطلحات تحمل شحنة سياسية عالية وتحتاج مراجعة تحريرية قبل النشر

6. عبارات تحريضية أو تخوينية:
أي كلام يتضمن تخويناً مباشراً، أي وصف يحض على الكراهية أو العنف، أي اتهام بالعمالة أو التآمر دون مصدر واضح

7. اتهامات سياسية أو أمنية غير مسندة:
أي اتهام لدولة أو حزب أو جهة أو مسؤول بالضلوع في عمل أمني أو عسكري دون مصدر واضح، أي كلام عن تنسيق أو تمويل أو دعم أو تآمر إذا لم يكن منسوباً بوضوح

8. معلومات غير منسوبة:
أي معلومة لا يظهر في التفريغ مصدر واضح لها أو الجهة التي قالتها

قواعد التعامل مع العبارات:
- إذا وردت العبارة على لسان ضيف: ارصدها مع تحديد أنها وردت على لسان ضيف
- إذا وردت العبارة على لسان الراوي (المقدم/المذيع): ارصدها مع تحديد أنها وردت على لسان الراوي (مستوى حساسية أعلى لأن النص يتبنى العبارة تحريرياً)
- إذا لم يتضح من قالها: اكتب "غير واضح"

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب تنبيهات سياسة التحرير:`,
  };

  const prompt = prompts[type];

  if (!prompt) {
    throw new Error(`Unknown output type: ${type}`);
  }

  // Call AI with fallback
  const result = await callAIWithFallback(prompt);

  return result;
}
