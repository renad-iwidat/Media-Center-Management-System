/**
 * Unclassified Processor Service
 * خدمة معالجة الأخبار بدون تصنيف
 */

import { RawDataService } from '../database/database.service';
import { aiClassifierService } from './ai-classifier.service';

/**
 * واجهة لخبر بدون تصنيف
 */
export interface UnclassifiedArticle {
  id: number;
  source_id: number;
  source_type_id: number;
  url: string;
  title: string;
  content: string;
  image_url: string | null;
  tags: string[] | null;
}

/**
 * واجهة لنتيجة المعالجة
 */
export interface ProcessingResult {
  totalUnclassified: number;
  processedCount: number;
  failedCount: number;
  details: Array<{
    id: number;
    title: string;
    category: string;
    categoryId: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * فئة Unclassified Processor Service
 */
class UnclassifiedProcessorService {
  /**
   * الحصول على الأخبار بدون تصنيف
   */
  async getUnclassifiedArticles(): Promise<UnclassifiedArticle[]> {
    try {
      const result = await RawDataService.getAll();
      
      // تصفية الأخبار التي لا تملك تصنيف (category_id = null)
      const unclassified = result
        .filter((item: any) => item.category_id === null)
        .map((item: any) => ({
          id: item.id,
          source_id: item.source_id,
          source_type_id: item.source_type_id,
          url: item.url,
          title: item.title,
          content: item.content,
          image_url: item.image_url,
          tags: item.tags,
        }));

      return unclassified;
    } catch (error) {
      console.error('❌ خطأ في جلب الأخبار بدون تصنيف:', error);
      return [];
    }
  }

  /**
   * معالجة الأخبار بدون تصنيف
   */
  async processUnclassifiedArticles(): Promise<ProcessingResult> {
    const unclassified = await this.getUnclassifiedArticles();
    const details: ProcessingResult['details'] = [];
    let processedCount = 0;
    let failedCount = 0;

    console.log(`📰 بدء معالجة ${unclassified.length} خبر بدون تصنيف...`);

    for (const article of unclassified) {
      try {
        // تصنيف الخبر
        const classification = await aiClassifierService.classifyArticle(
          article.title,
          article.content
        );

        // تحديث الخبر في قاعدة البيانات
        await RawDataService.updateCategory(article.id, classification.categoryId);

        details.push({
          id: article.id,
          title: article.title,
          category: classification.category,
          categoryId: classification.categoryId,
          success: true,
        });

        processedCount++;
        console.log(`✅ تم تصنيف: ${article.title} -> ${classification.category}`);
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
        
        details.push({
          id: article.id,
          title: article.title,
          category: 'محلي',
          categoryId: 1,
          success: false,
          error: errorMessage,
        });

        console.error(`❌ فشل تصنيف: ${article.title} - ${errorMessage}`);
      }
    }

    return {
      totalUnclassified: unclassified.length,
      processedCount,
      failedCount,
      details,
    };
  }
}

// تصدير instance واحد من الخدمة
export const unclassifiedProcessorService = new UnclassifiedProcessorService();
