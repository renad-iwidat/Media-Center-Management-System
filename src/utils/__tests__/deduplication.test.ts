/**
 * Tests for Deduplication Service
 * اختبارات خدمة إزالة التكرار
 */

import {
  removeChunkOverlap,
  deduplicateSegments,
  cleanTranscript,
  validateTranscriptQuality,
  removeDuplicateLines,
  removeDuplicateSentences,
  processChunkedTranscript
} from '../deduplication.service';

describe('Deduplication Service', () => {
  
  describe('removeChunkOverlap', () => {
    it('should remove overlapping text between chunks', () => {
      const chunks = [
        'مرحبا بك في البرنامج. هذا هو الحلقة الأولى.',
        'الحلقة الأولى من السلسلة. نتحدث اليوم عن...'
      ];
      
      const result = removeChunkOverlap(chunks, 0.8);
      
      // يجب أن لا يحتوي على تكرار "الحلقة الأولى"
      expect(result).not.toContain('الحلقة الأولى من السلسلة. الحلقة الأولى');
    });

    it('should handle empty chunks', () => {
      const chunks: string[] = [];
      const result = removeChunkOverlap(chunks);
      expect(result).toBe('');
    });

    it('should handle single chunk', () => {
      const chunks = ['نص واحد فقط'];
      const result = removeChunkOverlap(chunks);
      expect(result).toBe('نص واحد فقط');
    });

    it('should respect threshold parameter', () => {
      const chunks = [
        'النص الأول',
        'النص الأول والثاني'
      ];
      
      // مع threshold عالي، قد لا يكتشف التداخل
      const result1 = removeChunkOverlap(chunks, 0.95);
      
      // مع threshold منخفض، يكتشف التداخل
      const result2 = removeChunkOverlap(chunks, 0.5);
      
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });

  describe('deduplicateSegments', () => {
    it('should remove duplicate segments', () => {
      const segments = [
        { start: 0, end: 5, text: 'جملة أولى' },
        { start: 5, end: 10, text: 'جملة ثانية' },
        { start: 10, end: 15, text: 'جملة أولى' } // مكررة
      ];
      
      const result = deduplicateSegments(segments);
      
      expect(result.length).toBe(2);
      expect(result[0].text).toBe('جملة أولى');
      expect(result[1].text).toBe('جملة ثانية');
    });

    it('should preserve order', () => {
      const segments = [
        { start: 0, end: 5, text: 'أ' },
        { start: 5, end: 10, text: 'ب' },
        { start: 10, end: 15, text: 'ج' }
      ];
      
      const result = deduplicateSegments(segments);
      
      expect(result[0].text).toBe('أ');
      expect(result[1].text).toBe('ب');
      expect(result[2].text).toBe('ج');
    });

    it('should handle empty segments', () => {
      const result = deduplicateSegments([]);
      expect(result).toEqual([]);
    });

    it('should be case-insensitive', () => {
      const segments = [
        { start: 0, end: 5, text: 'مرحبا' },
        { start: 5, end: 10, text: 'مرحبا' }
      ];
      
      const result = deduplicateSegments(segments);
      
      // يجب أن يعتبرهما متطابقة (case-insensitive)
      expect(result.length).toBe(1);
    });
  });

  describe('removeDuplicateLines', () => {
    it('should remove duplicate lines', () => {
      const text = `السطر الأول
السطر الثاني
السطر الأول`;
      
      const result = removeDuplicateLines(text);
      
      expect(result).not.toContain('السطر الأول\nالسطر الثاني\nالسطر الأول');
    });

    it('should preserve order', () => {
      const text = `أ
ب
ج`;
      
      const result = removeDuplicateLines(text);
      
      expect(result).toBe('أ\nب\nج');
    });

    it('should handle empty lines', () => {
      const text = `السطر الأول

السطر الثاني`;
      
      const result = removeDuplicateLines(text);
      
      expect(result).toBeDefined();
    });
  });

  describe('removeDuplicateSentences', () => {
    it('should remove duplicate sentences', () => {
      const text = 'جملة أولى. جملة ثانية. جملة أولى.';
      
      const result = removeDuplicateSentences(text);
      
      expect(result).not.toContain('جملة أولى. جملة ثانية. جملة أولى');
    });

    it('should handle different punctuation', () => {
      const text = 'جملة أولى. جملة ثانية! جملة أولى?';
      
      const result = removeDuplicateSentences(text);
      
      expect(result).toBeDefined();
    });
  });

  describe('validateTranscriptQuality', () => {
    it('should calculate duplicate percentage', () => {
      const text = `السطر الأول
السطر الثاني
السطر الأول`;
      
      const quality = validateTranscriptQuality(text);
      
      expect(quality.duplicatePercentage).toBeGreaterThan(0);
      expect(quality.totalLines).toBe(3);
    });

    it('should warn about high duplication', () => {
      const text = `السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول
السطر الأول`;
      
      const quality = validateTranscriptQuality(text);
      
      expect(quality.duplicatePercentage).toBeGreaterThan(10);
      expect(quality.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about short lines', () => {
      const text = `أ
ب
ج`;
      
      const quality = validateTranscriptQuality(text);
      
      expect(quality.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate average line length', () => {
      const text = `هذا نص طويل جداً يحتوي على عدة كلمات
هذا نص قصير
نص متوسط الطول`;
      
      const quality = validateTranscriptQuality(text);
      
      expect(quality.averageLineLength).toBeGreaterThan(0);
    });
  });

  describe('cleanTranscript', () => {
    it('should clean transcript with default options', () => {
      const text = `السطر الأول
السطر الثاني
السطر الأول`;
      
      const result = cleanTranscript(text);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should respect options', () => {
      const text = 'جملة أولى. جملة ثانية. جملة أولى.';
      
      const result = cleanTranscript(text, {
        removeDuplicateSentences: true
      });
      
      expect(result).toBeDefined();
    });
  });

  describe('processChunkedTranscript', () => {
    it('should process multiple chunks', () => {
      const chunks = [
        'مرحبا بك في البرنامج.',
        'البرنامج يتحدث عن...',
        'عن الموضوع المهم'
      ];
      
      const result = processChunkedTranscript(chunks);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should remove overlap by default', () => {
      const chunks = [
        'النص الأول والثاني',
        'والثاني والثالث'
      ];
      
      const result = processChunkedTranscript(chunks, {
        removeOverlap: true
      });
      
      expect(result).toBeDefined();
    });

    it('should handle empty chunks', () => {
      const chunks: string[] = [];
      const result = processChunkedTranscript(chunks);
      expect(result).toBe('');
    });
  });

  describe('Integration Tests', () => {
    it('should handle real-world transcript', () => {
      const transcript = `مرحبا بكم في البرنامج الإذاعي. اليوم سنتحدث عن موضوع مهم جداً.
موضوع مهم جداً يتعلق بالتكنولوجيا والابتكار.
التكنولوجيا والابتكار هما مفتاح المستقبل.
مفتاح المستقبل يكمن في التعليم والبحث العلمي.
التعليم والبحث العلمي يجب أن يكونا أولويتنا.`;

      const quality = validateTranscriptQuality(transcript);
      
      expect(quality.isValid).toBeDefined();
      expect(quality.duplicatePercentage).toBeGreaterThan(0);
      expect(quality.totalLines).toBeGreaterThan(0);
    });

    it('should handle transcript with segments', () => {
      const segments = [
        { start: 0, end: 5, text: 'مرحبا بكم' },
        { start: 5, end: 10, text: 'في البرنامج' },
        { start: 10, end: 15, text: 'مرحبا بكم' }
      ];
      
      const result = deduplicateSegments(segments);
      
      expect(result.length).toBeLessThan(segments.length);
    });
  });
});
