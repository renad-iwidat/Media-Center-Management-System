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

interface OutputConfig {
  type: 'executive_summary' | 'news_article' | 'detailed_report' | 'social_media' | 'video_clips' | 'policy_alerts';
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
 * Call OpenAI Chat API for text generation
 */
export async function callOpenAIChatAPI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'أنت محرر صحفي محترف في قناة إخبارية عربية. تلتزم بالدقة المطلقة في النقل وتحترم سياسة التحرير.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Call AI_MODEL first, fallback to OpenAI if it fails
 */
export async function callAIWithFallback(prompt: string): Promise<string> {
  const aiModelUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
  
  // Try AI_MODEL first
  try {
    console.log(`\n🤖 [Smart Transcription] Calling AI_MODEL: ${aiModelUrl}`);
    
    const response = await fetch(`${aiModelUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI_MODEL returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Check if the response is valid
    if (data.result && data.result.length > 100) {
      console.log(`✅ [Smart Transcription] AI_MODEL responded successfully`);
      return data.result;
    } else {
      throw new Error('AI_MODEL response too short or invalid');
    }
  } catch (error: any) {
    console.log(`⚠️ [Smart Transcription] AI_MODEL failed: ${error.message}`);
    console.log(`🔄 [Smart Transcription] Falling back to OpenAI...`);
    
    // Fallback to OpenAI
    try {
      const result = await callOpenAIChatAPI(prompt);
      console.log(`✅ [Smart Transcription] OpenAI fallback responded successfully`);
      return result;
    } catch (openaiError: any) {
      console.error(`❌ [Smart Transcription] OpenAI fallback also failed: ${openaiError.message}`);
      throw new Error(`Both AI_MODEL and OpenAI failed: ${error.message} / ${openaiError.message}`);
    }
  }
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

المهمة: اكتب ملخصاً تنفيذياً من 4-6 أسطر فقط يبرز أهم ما ورد في المادة.

المعايير الإلزامية:
- الدقة المطلقة في النقل: التزم تماماً بالكلمات والمصطلحات والمعلومات الواردة في المادة الأصلية
- ممنوع الإضافة أو الحذف أو التعديل في المعنى
- يُسمح فقط بكلمات ربط بسيطة لتحسين الصياغة دون إخلال بالمعنى
- انسب التصريحات لقائليها بدقة

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب الملخص التنفيذي (4-6 أسطر فقط):`,

    news_article: `
أنت محرر صحفي محترف في قناة إخبارية عربية رائدة.

المهمة: اكتب خبراً صحفياً مكتملاً وفق بنية الهرم المقلوب.

الهيكل المطلوب:
1. العنوان الرئيسي: جملة قوية تلخص الخبر
2. عناوين بديلة مقترحة: 3-4 عناوين بديلة
3. نص الخبر: يبدأ بالأهم ثم التفاصيل

المعايير الإلزامية:
- الدقة المطلقة في النقل: التزم تماماً بالكلمات والمصطلحات والمعلومات الواردة في المادة الأصلية
- ممنوع الإضافة أو الحذف أو التعديل في المعنى
- انسب التصريحات لقائليها بدقة بصيغة: قال فلان: "..."
- استخدم الأرقام والإحصائيات الواردة بدقة

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب الخبر الصحفي:`,

    detailed_report: `
أنت محرر صحفي محترف في قناة إخبارية عربية رائدة.

المهمة: اكتب تقريراً صحفياً معمّقاً باحترافية صحفية عالية.

الهيكل المطلوب:
1. العنوان: عنوان جذاب يعكس عمق التقرير
2. المقدمة: فقرة تمهيدية تضع السياق
3. الأقسام: قسّم التقرير إلى أقسام بعناوين فرعية
4. الخاتمة: خلاصة أو نظرة مستقبلية

المعايير الإلزامية:
- الدقة المطلقة في النقل
- التحليل المعمّق مع الحفاظ على الموضوعية
- انسب التصريحات لقائليها بدقة
- استخدم الأرقام والإحصائيات الواردة بدقة
- أضف سياقاً توضيحياً عند الحاجة

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب التقرير الصحفي:`,

    social_media: `
أنت متخصص في التواصل الاجتماعي في قناة إخبارية عربية رائدة.

المهمة: اكتب ${count} منشورات لوسائل التواصل الاجتماعي.

الشكل المطلوب لكل منشور:
المنشور [الرقم]
[نص المنشور مع التصريح منسوباً لقائله]

المعايير الإلزامية:
- كل منشور يتضمن تصريحاً منسوباً لقائله بصيغة: "فلان لـ"القناة": «...»"
- الدقة المطلقة في نقل التصريحات
- منشورات قصيرة ومؤثرة
- تنوع في المحتوى (تصريحات، أرقام، معلومات)
- يمكن استخدام الإيموجي عند المناسب

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

اكتب ${count} منشورات:`,

    video_clips: `
أنت متخصص في محتوى الفيديو في قناة إخبارية عربية رائدة.

المهمة: حدد أفضل ${count} مقاطع فيديو من المادة.

الشكل المطلوب لكل مقطع:
المقطع [الرقم] · [التايم كود البداية] — [التايم كود النهاية]
العنوان: [عنوان جذاب للنشر]
النص المرافق: [وصف موجز لمحتوى المقطع]

المعايير الإلزامية:
- التايم كود بصيغة: MM:SS — MM:SS (مثال: 01:04 — 02:30)
- اختر اللحظات الأكثر أهمية وتأثيراً
- العنوان يجب أن يكون جذاباً ودقيقاً
- النص المرافق يوضح سياق المقطع
- تنوع في المقاطع (تصريحات، أرقام، لحظات مهمة)

${editorialPolicy ? `سياسة التحرير المعتمدة:\n${editorialPolicy}\n` : ''}
${customInfo ? `معلومات إضافية:\n${customInfo}\n` : ''}

النص المفرّغ:
${transcript}

حدد أفضل ${count} مقاطع:`,

    policy_alerts: `
أنت متخصص في مراجعة السياسات التحريرية في قناة إخبارية عربية رائدة.

المهمة: راجع المادة وحدد أي ملاحظات تستوجب المراجعة قبل النشر.

الشكل المطلوب:
ملاحظات تستوجب المراجعة قبل النشر:
[رقم]. [وصف الملاحظة مع ذكر الدقيقة أو الموقع في النص]

أنواع الملاحظات المطلوبة:
- أرقام أو إحصائيات تحتاج تحققاً مستقلاً
- تصريحات حساسة سياسياً أو دبلوماسياً
- ادعاءات لم تصدر عن مصادر موثقة
- توصيفات حادة قد تُحمّل القناة موقفاً
- معلومات تحتاج مراجعة قانونية
- أي محتوى قد يخالف معايير التحرير

${customInfo ? `معايير المراجعة:\n${customInfo}\n` : ''}

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
