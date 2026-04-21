/**
 * Unclassified Processor Service
 * خدمة معالجة الأخبار بدون تصنيف — AI batches parallel
 */

import { RawDataService } from '../database/database.service';
import { aiClassifierService } from './ai-classifier.service';
import { SystemSettingsService } from '../database/system-settings.service';

/** حجم الـ batch للـ AI */
const AI_BATCH_SIZE = 5;

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
    categoryId: number | null;
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
   * معالجة الأخبار بدون تصنيف — batches parallel
   */
  async processUnclassifiedArticles(): Promise<ProcessingResult> {
    const classifierEnabled = await SystemSettingsService.getBoolean('classifier_enabled', true);
    if (!classifierEnabled) {
      console.log('⏸️  التصنيف الآلي متوقف (classifier_enabled = false)');
      return { totalUnclassified: 0, processedCount: 0, failedCount: 0, details: [] };
    }

    const unclassified = await this.getUnclassifiedArticles();
    if (unclassified.length === 0) {
      console.log('✅ لا توجد أخبار بدون تصنيف');
      return { totalUnclassified: 0, processedCount: 0, failedCount: 0, details: [] };
    }

    console.log(`🤖 تصنيف ${unclassified.length} خبر بـ batches من ${AI_BATCH_SIZE}...`);
    const details: ProcessingResult['details'] = [];
    let processedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < unclassified.length; i += AI_BATCH_SIZE) {
      const batch = unclassified.slice(i, i + AI_BATCH_SIZE);
      const batchNum = Math.floor(i / AI_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(unclassified.length / AI_BATCH_SIZE);
      console.log(`   🤖 batch ${batchNum}/${totalBatches} (${batch.length} خبر سوا)...`);

      // تصنيف الـ batch كله سوا
      const classifyResults = await Promise.allSettled(
        batch.map((a) => aiClassifierService.classifyArticle(a.title, a.content))
      );

      // تحديث الداتابيس — batch parallel
      const updateResults = await Promise.allSettled(
        batch.map((article, j) => {
          const r = classifyResults[j];
          // إذا فشل التصنيف → categoryId = null (مش 1)
          const categoryId = r.status === 'fulfilled' ? r.value.categoryId : null;
          return RawDataService.updateCategory(article.id, categoryId).then(() => ({
            article,
            classification: r.status === 'fulfilled' ? r.value : null,
          }));
        })
      );

      for (let j = 0; j < batch.length; j++) {
        const classifyR = classifyResults[j];
        const updateR = updateResults[j];

        if (updateR.status === 'fulfilled') {
          const category = classifyR.status === 'fulfilled' ? classifyR.value.category : 'غير مصنف (خطأ)';
          const categoryId = classifyR.status === 'fulfilled' ? classifyR.value.categoryId : null;
          details.push({ id: batch[j].id, title: batch[j].title, category, categoryId, success: true });
          processedCount++;
          console.log(`   ✅ ${batch[j].title.substring(0, 50)} → ${category}`);
        } else {
          details.push({ id: batch[j].id, title: batch[j].title, category: 'غير مصنف (خطأ)', categoryId: null, success: false, error: String(updateR.reason) });
          failedCount++;
        }
      }
    }

    console.log(`✅ تصنيف خلص: ${processedCount} نجح | ${failedCount} فشل\n`);
    return { totalUnclassified: unclassified.length, processedCount, failedCount, details };
  }
}

// تصدير instance واحد من الخدمة
export const unclassifiedProcessorService = new UnclassifiedProcessorService();
