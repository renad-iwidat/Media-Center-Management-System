/**
 * RSS Runner
 * 
 * فايل تشغيل خدمة سحب RSS
 * يسحب من RSS ويحفظ النتائج في JSON
 */

import { rssFetcherService } from '../services/rss-fetcher.service';
import { dataStorageService } from '../services/data-storage.service';

/**
 * تشغيل خدمة سحب RSS
 */
async function runRSSFetcher(): Promise<void> {
  try {
    console.log('📰 جاري سحب الأخبار من RSS...\n');

    // سحب من المصادر الرئيسية
    console.log('🔄 سحب المصادر الرئيسية...');
    const mainResults = await rssFetcherService.fetchFirstArticleFromAllSources();

    // سحب من المصادر المتنوعة
    console.log('🔄 سحب المصادر المتنوعة...');
    const diverseResults = await rssFetcherService.fetchFirstArticleFromDiverseSources();

    // حفظ جميع النتائج في JSON
    const filepath = dataStorageService.saveAllResults(
      mainResults,
      diverseResults,
      `rss-results-${new Date().toISOString().split('T')[0]}.json`
    );

    console.log(`\n✅ تم حفظ النتائج في: ${filepath}\n`);

    // طباعة الأخطاء فقط
    console.log('❌ الأخطاء والمشاكل:\n');
    console.log('='.repeat(80));

    const allResults = [...mainResults, ...diverseResults];
    const errors = allResults.filter((r) => r.error);

    if (errors.length === 0) {
      console.log('✅ لا توجد أخطاء - جميع المصادر تم سحبها بنجاح!');
    } else {
      errors.forEach((result) => {
        console.log(`\n📌 المصدر: ${result.source.name}`);
        console.log(`🔗 الرابط: ${result.source.url}`);
        console.log(`❌ الخطأ: ${result.error}`);
        console.log('-'.repeat(80));
      });
    }

    // إحصائيات
    console.log('\n' + '='.repeat(80));
    console.log('📊 الإحصائيات:');
    console.log(`📈 إجمالي المصادر: ${allResults.length}`);
    console.log(`✅ نجح: ${allResults.filter((r) => !r.error).length}`);
    console.log(`❌ فشل: ${errors.length}`);
    console.log('='.repeat(80) + '\n');
  } catch (error) {
    console.error('❌ حدث خطأ أثناء تشغيل خدمة RSS:', error);
    process.exit(1);
  }
}

// تشغيل الخدمة إذا تم استدعاء الفايل مباشرة
if (require.main === module) {
  runRSSFetcher();
}

export { runRSSFetcher };
