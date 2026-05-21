/**
 * Fetch and Save Utility
 * سكريبت لسحب وحفظ الأخبار من NewsDesk API
 */

import { newsPipelineService } from '../../services/news/news-pipeline.service';
import { articleSaverService } from '../../services/news/article-saver.service';

async function main() {
  try {
    const articlesPerSource = parseInt(process.env.ARTICLES_PER_SOURCE || '20', 10);
    
    console.log('🎯 إعدادات التشغيل:');
    console.log(`   عدد الأخبار لكل صفحة: ${articlesPerSource}`);
    console.log(`   المصدر: NewsDesk API (${process.env.NEWSDESK_API_URL || 'https://newsdesk-api.liminal.ps'})\n`);

    const result = await newsPipelineService.runPipeline(articlesPerSource);

    if (result.newArticles.length > 0) {
      console.log('\n💾 حفظ الأخبار الجديدة...');
      const saveResult = await articleSaverService.saveArticles(result.newArticles);
      console.log(`\n📋 النتيجة النهائية:`);
      console.log(`   المصادر: ${result.totalSources}`);
      console.log(`   المسحوبة: ${result.newArticles.length + result.skippedCount}`);
      console.log(`   الجديدة: ${result.newArticles.length}`);
      console.log(`   المحفوظة: ${saveResult.savedCount}`);
      console.log(`   المتخطاة: ${result.skippedCount}`);
      console.log(`   الفاشلة: ${saveResult.failedCount}`);
    } else {
      console.log('\n✅ لا توجد أخبار جديدة للحفظ');
    }

    console.log('\n📋 تفاصيل المصادر:');
    result.details.forEach((detail) => {
      console.log(`   ${detail.source}`);
      console.log(`      المسحوبة: ${detail.fetched}`);
      console.log(`      الجديدة: ${detail.newCount}`);
      console.log(`      المتخطاة: ${detail.skippedCount}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ في التنفيذ:', error);
    process.exit(1);
  }
}

main();
