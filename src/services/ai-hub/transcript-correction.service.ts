/**
 * Transcript Correction Service
 * خدمة تصحيح النصوص المفرغة
 * 
 * يصحح الأخطاء اللغوية والنحوية والإملائية في النصوص المفرغة من Whisper
 * ويحسن الوضوح والقراءة دون تغيير المعنى الأساسي
 * 
 * يستخدم موديل gpt-4.1 (1M token context) — يتحمل النص كامل بدون تقسيم
 */

import { callAIWithFallback } from './ai-call.service';

interface CorrectionOptions {
  language?: string;
  preserveMeaning?: boolean;
  fixPunctuation?: boolean;
  fixGrammar?: boolean;
  fixSpelling?: boolean;
  improveClarity?: boolean;
}

interface CorrectionResult {
  originalTranscript: string;
  correctedTranscript: string;
  corrections: {
    type: string;
    original: string;
    corrected: string;
    explanation: string;
  }[];
  metadata: {
    correctionCount: number;
    originalLength: number;
    correctedLength: number;
    processingTime: number;
  };
}

/**
 * تصحيح النص المفرغ باستخدام gpt-4.1
 * 
 * gpt-4.1 عنده 1,000,000 token context window و 32,000 max output tokens
 * يعني يتحمل نص 55,000+ حرف عربي كامل بدون أي تقسيم
 */
export async function correctTranscript(
  transcript: string,
  options: CorrectionOptions = {}
): Promise<CorrectionResult> {
  const {
    language = 'ar',
    preserveMeaning = true,
    fixPunctuation = true,
    fixGrammar = true,
    fixSpelling = true,
    improveClarity = true,
  } = options;

  const startTime = Date.now();

  console.log(`\n🔧 [Transcript Correction] Starting correction process`);
  console.log(`📝 Original transcript length: ${transcript.length} characters`);
  console.log(`🌐 Language: ${language}`);
  console.log(`🤖 Model: gpt-4.1 (1M context, 32K output)`);

  try {
    // إنشاء prompt التصحيح
    const correctionPrompt = generateCorrectionPrompt(
      transcript,
      language,
      { preserveMeaning, fixPunctuation, fixGrammar, fixSpelling, improveClarity }
    );

    console.log(`📤 [Transcript Correction] Sending full text to gpt-4.1 (${transcript.length} chars)...`);

    // إرسال النص كامل — gpt-4.1 يتحمله
    const correctedTranscript = await callAIWithFallback(correctionPrompt);

    // التحقق من صحة النتيجة
    if (!correctedTranscript || correctedTranscript.length < transcript.length * 0.3) {
      console.warn(`⚠️ [Transcript Correction] Result too short (${correctedTranscript?.length || 0} chars vs original ${transcript.length} chars) — returning original`);
      
      const processingTime = Date.now() - startTime;
      return {
        originalTranscript: transcript,
        correctedTranscript: transcript,
        corrections: [],
        metadata: {
          correctionCount: 0,
          originalLength: transcript.length,
          correctedLength: transcript.length,
          processingTime,
        },
      };
    }

    console.log(`✅ [Transcript Correction] Correction completed`);
    console.log(`📝 Corrected transcript length: ${correctedTranscript.length} characters`);
    console.log(`📊 Change: ${transcript.length} → ${correctedTranscript.length} chars (${((correctedTranscript.length / transcript.length) * 100).toFixed(1)}%)`);

    // استخراج التصحيحات
    const corrections = extractCorrections(transcript, correctedTranscript);
    const processingTime = Date.now() - startTime;

    console.log(`⏱️  Processing time: ${(processingTime / 1000).toFixed(1)}s`);

    return {
      originalTranscript: transcript,
      correctedTranscript,
      corrections,
      metadata: {
        correctionCount: corrections.length,
        originalLength: transcript.length,
        correctedLength: correctedTranscript.length,
        processingTime,
      },
    };
  } catch (error: any) {
    console.error(`❌ [Transcript Correction] Error:`, error.message);
    // في حالة الفشل — نرجع النص الأصلي بدل ما نوقف العملية
    console.warn(`⚠️ [Transcript Correction] Returning original transcript due to error`);
    const processingTime = Date.now() - startTime;
    return {
      originalTranscript: transcript,
      correctedTranscript: transcript,
      corrections: [],
      metadata: {
        correctionCount: 0,
        originalLength: transcript.length,
        correctedLength: transcript.length,
        processingTime,
      },
    };
  }
}

/**
 * Generate correction prompt for AI
 * إنشاء prompt التصحيح للـ AI
 */
function generateCorrectionPrompt(
  transcript: string,
  language: string,
  options: {
    preserveMeaning: boolean;
    fixPunctuation: boolean;
    fixGrammar: boolean;
    fixSpelling: boolean;
    improveClarity: boolean;
  }
): string {
  const {
    fixPunctuation,
    fixGrammar,
    fixSpelling,
    improveClarity,
  } = options;

  if (language === 'ar') {
    return `أنت متخصص في تصحيح النصوص العربية المفرغة من الكلام.

المهمة: صحح النص المفرغ التالي من أخطاء التفريغ الآلي.

المعايير الإلزامية:
1. الحفاظ على المعنى الأساسي: لا تغير المعنى أو المضمون
2. الدقة اللغوية: صحح الأخطاء النحوية والإملائية
3. الوضوح: حسّن الصياغة لتكون أكثر وضوحاً وسهولة في القراءة
4. الترقيم: أضف علامات الترقيم المناسبة (نقاط، فواصل، علامات استفهام)
5. الاتساق: تأكد من اتساق الأسلوب والمصطلحات

${fixPunctuation ? '✓ تصحيح علامات الترقيم' : ''}
${fixGrammar ? '✓ تصحيح الأخطاء النحوية' : ''}
${fixSpelling ? '✓ تصحيح الأخطاء الإملائية' : ''}
${improveClarity ? '✓ تحسين الوضوح والقراءة' : ''}

ممنوع:
- إضافة معلومات جديدة لم تكن في النص الأصلي
- حذف أي معلومات من النص الأصلي
- تغيير المعنى أو السياق
- إعادة صياغة كاملة (فقط تصحيح وتحسين)
- الرد بأي شيء غير النص المصحح (لا تعليقات، لا شرح، لا مقدمات)

النص المفرغ الذي يحتاج تصحيح:
"""
${transcript}
"""

اكتب النص المصحح فقط:`;
  } else {
    return `You are an expert in correcting transcribed text from speech-to-text systems.

Task: Correct the following transcribed text from automatic transcription errors.

Mandatory Criteria:
1. Preserve Meaning: Do not change the meaning or content
2. Linguistic Accuracy: Fix grammatical and spelling errors
3. Clarity: Improve phrasing for better readability
4. Punctuation: Add appropriate punctuation marks
5. Consistency: Ensure consistent style and terminology

${fixPunctuation ? '✓ Fix punctuation marks' : ''}
${fixGrammar ? '✓ Fix grammatical errors' : ''}
${fixSpelling ? '✓ Fix spelling errors' : ''}
${improveClarity ? '✓ Improve clarity and readability' : ''}

Forbidden:
- Adding new information not in the original text
- Deleting any information from the original text
- Changing the meaning or context
- Complete rephrasing (only correction and improvement)
- Responding with anything other than the corrected text (no comments, no explanations)

Transcribed text that needs correction:
"""
${transcript}
"""

Write only the corrected text:`;
  }
}

/**
 * Extract corrections by comparing original and corrected text
 * استخراج التصحيحات بمقارنة النص الأصلي والمصحح
 */
function extractCorrections(
  original: string,
  corrected: string
): Array<{
  type: string;
  original: string;
  corrected: string;
  explanation: string;
}> {
  const corrections: Array<{
    type: string;
    original: string;
    corrected: string;
    explanation: string;
  }> = [];

  const originalWords = original.split(/\s+/);
  const correctedWords = corrected.split(/\s+/);

  let originalIndex = 0;
  let correctedIndex = 0;

  while (originalIndex < originalWords.length && correctedIndex < correctedWords.length) {
    const origWord = originalWords[originalIndex];
    const corrWord = correctedWords[correctedIndex];

    if (origWord !== corrWord) {
      if (
        origWord.toLowerCase().replace(/[^\w]/g, '') ===
        corrWord.toLowerCase().replace(/[^\w]/g, '')
      ) {
        corrections.push({
          type: 'punctuation',
          original: origWord,
          corrected: corrWord,
          explanation: 'تصحيح علامات الترقيم',
        });
      } else if (
        origWord.toLowerCase().substring(0, 3) ===
        corrWord.toLowerCase().substring(0, 3)
      ) {
        corrections.push({
          type: 'spelling',
          original: origWord,
          corrected: corrWord,
          explanation: 'تصحيح إملائي',
        });
      } else {
        corrections.push({
          type: 'grammar',
          original: origWord,
          corrected: corrWord,
          explanation: 'تصحيح نحوي أو لغوي',
        });
      }

      correctedIndex++;
    }

    originalIndex++;
  }

  return corrections.slice(0, 20);
}

/**
 * Batch correct multiple transcripts
 */
export async function correctTranscriptsBatch(
  transcripts: string[],
  options: CorrectionOptions = {}
): Promise<CorrectionResult[]> {
  console.log(`\n🔧 [Transcript Correction] Starting batch correction for ${transcripts.length} transcripts`);

  const results: CorrectionResult[] = [];

  for (let i = 0; i < transcripts.length; i++) {
    try {
      console.log(`📝 Correcting transcript ${i + 1}/${transcripts.length}...`);
      const result = await correctTranscript(transcripts[i], options);
      results.push(result);
    } catch (error: any) {
      console.error(`❌ Failed to correct transcript ${i + 1}:`, error.message);
    }
  }

  console.log(`✅ Batch correction completed: ${results.length}/${transcripts.length} successful`);
  return results;
}

/**
 * Get statistics from batch correction results
 */
export function getCorrectionStats(results: CorrectionResult[]): {
  totalTranscripts: number;
  totalCorrections: number;
  averageProcessingTime: number;
  averageCorrectionCount: number;
  totalOriginalLength: number;
  totalCorrectedLength: number;
} {
  const totalTranscripts = results.length;
  const totalCorrections = results.reduce((sum, r) => sum + r.metadata.correctionCount, 0);
  const averageProcessingTime = totalTranscripts > 0
    ? results.reduce((sum, r) => sum + r.metadata.processingTime, 0) / totalTranscripts
    : 0;
  const averageCorrectionCount = totalTranscripts > 0
    ? totalCorrections / totalTranscripts
    : 0;
  const totalOriginalLength = results.reduce((sum, r) => sum + r.metadata.originalLength, 0);
  const totalCorrectedLength = results.reduce((sum, r) => sum + r.metadata.correctedLength, 0);

  return {
    totalTranscripts,
    totalCorrections,
    averageProcessingTime,
    averageCorrectionCount,
    totalOriginalLength,
    totalCorrectedLength,
  };
}

/**
 * Validate correction quality
 */
export function validateCorrectionQuality(result: CorrectionResult): {
  isValid: boolean;
  score: number;
  issues: string[];
} {
  const issues: string[] = [];
  let score = 100;

  const lengthDiff = Math.abs(result.metadata.correctedLength - result.metadata.originalLength);
  const lengthDiffPercent = (lengthDiff / result.metadata.originalLength) * 100;

  if (lengthDiffPercent > 30) {
    issues.push(`النص المصحح مختلف جداً عن الأصلي (${lengthDiffPercent.toFixed(1)}%)`);
    score -= 20;
  }

  if (result.correctedTranscript.length < 10) {
    issues.push('النص المصحح فارغ أو قصير جداً');
    score -= 50;
  }

  if (result.metadata.correctionCount > result.metadata.originalLength / 10) {
    issues.push('عدد التصحيحات كبير جداً');
    score -= 10;
  }

  return {
    isValid: score >= 70,
    score: Math.max(0, score),
    issues,
  };
}
