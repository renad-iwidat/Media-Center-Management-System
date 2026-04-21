/**
 * Classify Articles Utility
 * سكريبت لتصنيف الأخبار بدون تصنيف
 */

import { unclassifiedProcessorService } from '../../services/news/unclassified-processor.service';

async function main() {
  try {
    console.log('🚀 بدء تصنيف الأخبار بدون تصنيف...\n');
    
    const result = await unclassifiedProcessorService.processUnclassifiedArticles();

    console.log('\n📊 ملخص المعالجة:');
    console.log(`   إجمالي الأخبار بدون تصنيف: ${result.totalUnclassified}`);
    console.log(`   ✅ تم تصنيفها: ${result.processedCount}`);
    console.log(`   ❌ فشل التصنيف: ${result.failedCount}`);

    console.log('\n📋 التفاصيل:');
    result.details.forEach((detail) => {
      const status = detail.success ? '✅' : '❌';
      console.log(`   ${status} [${detail.id}] ${detail.title}`);
      console.log(`      التصنيف: ${detail.category} (ID: ${detail.categoryId})`);
      if (detail.error) {
        console.log(`      الخطأ: ${detail.error}`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في المعالجة:', error);
    process.exit(1);
  }
}

main();
