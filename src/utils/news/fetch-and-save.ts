/**
 * Fetch and Save Utility
 * سكريبت لسحب وحفظ الأخبار
 */

import { rssPipelineService } from '../../services/news/rss-pipeline.service';

async function main() {
  try {
    const articlesPerSource = parseInt(process.env.ARTICLES_PER_SOURCE || '20', 10);
    
    console.log('🎯 إعدادات التشغيل:');
    console.log(`   عدد الأخبار من كل مصدر: ${articlesPerSource}\n`);

    const result = await rssPipelineService.runPipeline(articlesPerSource);

    console.log('📋 تفاصيل المصادر:');
    result.details.forEach((detail) => {
      console.log(`   ${detail.source}`);
      console.log(`      المسحوبة: ${detail.articlesCount}`);
      console.log(`      المحفوظة: ${detail.savedCount}`);
      console.log(`      الفاشلة: ${detail.failedCount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في التنفيذ:', error);
    process.exit(1);
  }
}

main();
