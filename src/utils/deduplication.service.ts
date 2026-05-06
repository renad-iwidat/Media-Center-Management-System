/**
 * Deduplication Service
 * خدمة إزالة التكرار من النصوص والـ segments
 */

interface AudioSegment {
  id?: number;
  seek?: number;
  start: number;
  end: number;
  text: string;
  avg_logprob?: number;
  compression_ratio?: number;
  no_speech_prob?: number;
}

/**
 * Remove duplicate words from text
 * إزالة الكلمات المكررة من النص
 */
export function removeDuplicateWords(text: string): string {
  if (!text) return '';
  
  const words = text.split(/\s+/);
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const word of words) {
    const lowerWord = word.toLowerCase();
    // السماح بتكرار الكلمات القصيرة جداً (أدوات، حروف جر)
    if (word.length <= 2 || !seen.has(lowerWord)) {
      result.push(word);
      seen.add(lowerWord);
    }
  }
  
  return result.join(' ');
}

/**
 * Remove duplicate sentences from text
 * إزالة الجمل المكررة من النص
 */
export function removeDuplicateSentences(text: string): string {
  if (!text) return '';
  
  // تقسيم النص إلى جمل
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    if (!seen.has(normalized)) {
      result.push(sentence);
      seen.add(normalized);
    }
  }
  
  return result.join('. ') + (text.endsWith('.') || text.endsWith('!') || text.endsWith('?') ? '.' : '');
}

/**
 * Remove duplicate lines from text
 * إزالة الأسطر المكررة من النص
 */
export function removeDuplicateLines(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  const seen = new Set<string>();
  const result: string[] = [];
  
  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    if (normalized.length > 0 && !seen.has(normalized)) {
      result.push(line);
      seen.add(normalized);
    }
  }
  
  return result.join('\n');
}

/**
 * Detect and remove overlapping text between chunks
 * كشف وإزالة النصوص المتداخلة بين الـ chunks
 */
export function removeChunkOverlap(texts: string[], overlapThreshold: number = 0.8): string {
  if (texts.length === 0) return '';
  if (texts.length === 1) return texts[0];
  
  const result: string[] = [texts[0]];
  
  for (let i = 1; i < texts.length; i++) {
    const currentText = texts[i];
    const previousText = texts[i - 1];
    
    // البحث عن تداخل في نهاية النص السابق وبداية النص الحالي
    const overlapLength = findOverlapLength(previousText, currentText, overlapThreshold);
    
    if (overlapLength > 0) {
      // إزالة الجزء المتداخل من النص الحالي
      const cleanedText = currentText.substring(overlapLength).trim();
      if (cleanedText.length > 0) {
        result.push(cleanedText);
      }
    } else {
      result.push(currentText);
    }
  }
  
  return result.join(' ');
}

/**
 * Find overlap length between end of text1 and start of text2
 * البحث عن طول التداخل بين نهاية النص الأول وبداية النص الثاني
 */
function findOverlapLength(text1: string, text2: string, threshold: number = 0.8): number {
  if (!text1 || !text2) return 0;
  
  const maxOverlapLength = Math.min(text1.length, text2.length, 100); // حد أقصى 100 حرف
  
  for (let len = maxOverlapLength; len > 10; len--) {
    const end1 = text1.substring(text1.length - len);
    const start2 = text2.substring(0, len);
    
    const similarity = calculateSimilarity(end1, start2);
    if (similarity >= threshold) {
      return len;
    }
  }
  
  return 0;
}

/**
 * Calculate similarity between two strings (0-1)
 * حساب التشابه بين نصين (0-1)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1;
  
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1;
  
  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 * حساب مسافة Levenshtein بين نصين
 */
function getEditDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  
  return costs[s2.length];
}

/**
 * Deduplicate segments
 * إزالة الـ segments المكررة
 */
export function deduplicateSegments(segments: AudioSegment[]): AudioSegment[] {
  if (segments.length === 0) return [];
  
  const result: AudioSegment[] = [segments[0]];
  const seen = new Set<string>();
  seen.add(segments[0].text.toLowerCase().trim());
  
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const normalized = segment.text.toLowerCase().trim();
    
    // تخطي الـ segment إذا كان نصه مطابقاً تماماً للـ segment السابق
    if (!seen.has(normalized)) {
      result.push(segment);
      seen.add(normalized);
    } else {
      console.log(`⚠️ Duplicate segment detected: "${segment.text}"`);
    }
  }
  
  return result;
}

/**
 * Clean and deduplicate transcript
 * تنظيف وإزالة التكرار من الترانسكريبت
 */
export function cleanTranscript(
  transcript: string,
  options: {
    removeDuplicateWords?: boolean;
    removeDuplicateSentences?: boolean;
    removeDuplicateLines?: boolean;
  } = {}
): string {
  let result = transcript;
  
  const {
    removeDuplicateWords: removeWords = false,
    removeDuplicateSentences: removeSentences = false,
    removeDuplicateLines: removeLines = true
  } = options;
  
  if (removeLines) {
    result = removeDuplicateLines(result);
  }
  
  if (removeSentences) {
    result = removeDuplicateSentences(result);
  }
  
  if (removeWords) {
    result = removeDuplicateWords(result);
  }
  
  return result.trim();
}

/**
 * Process transcript from multiple chunks
 * معالجة الترانسكريبت من عدة chunks
 */
export function processChunkedTranscript(
  chunks: string[],
  options: {
    removeOverlap?: boolean;
    cleanDuplicates?: boolean;
    overlapThreshold?: number;
  } = {}
): string {
  const {
    removeOverlap = true,
    cleanDuplicates = true,
    overlapThreshold = 0.8
  } = options;
  
  let result: string;
  
  if (removeOverlap) {
    result = removeChunkOverlap(chunks, overlapThreshold);
  } else {
    result = chunks.join(' ');
  }
  
  if (cleanDuplicates) {
    result = cleanTranscript(result, {
      removeDuplicateLines: true
    });
  }
  
  return result;
}

/**
 * Validate transcript quality
 * التحقق من جودة الترانسكريبت
 */
export interface TranscriptQuality {
  isValid: boolean;
  duplicatePercentage: number;
  averageLineLength: number;
  totalLines: number;
  warnings: string[];
}

export function validateTranscriptQuality(transcript: string): TranscriptQuality {
  const warnings: string[] = [];
  const lines = transcript.split('\n').filter(l => l.trim().length > 0);
  
  // حساب نسبة التكرار
  const uniqueLines = new Set(lines.map(l => l.toLowerCase().trim()));
  const duplicatePercentage = ((lines.length - uniqueLines.size) / lines.length) * 100;
  
  if (duplicatePercentage > 10) {
    warnings.push(`⚠️ High duplication rate: ${duplicatePercentage.toFixed(1)}%`);
  }
  
  // حساب متوسط طول السطر
  const totalLength = lines.reduce((sum, line) => sum + line.length, 0);
  const averageLineLength = totalLength / lines.length;
  
  if (averageLineLength < 5) {
    warnings.push('⚠️ Average line length is too short');
  }
  
  if (averageLineLength > 500) {
    warnings.push('⚠️ Average line length is too long');
  }
  
  return {
    isValid: warnings.length === 0,
    duplicatePercentage,
    averageLineLength,
    totalLines: lines.length,
    warnings
  };
}
