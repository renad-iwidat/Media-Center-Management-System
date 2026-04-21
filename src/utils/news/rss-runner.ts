/**
 * RSS Runner
 * 
 * فايل تشغيل خدمة سحب RSS
 * يسحب من RSS ويحفظ النتائج في JSON
 */

import { rssFetcherService, dataStorageService } from '../services/news';
import { RawDataService, SourceService } from '../services/database/database.service';

/**
 * تشغيل خدمة سحب RSS
 */
async function runRSSFetcher(): Promise<void> {
  try {
    console.log('📰 جاري سحب الأخبار من RSS...\n');

    // الحصول على المصادر النشطة من الداتابيس
    const activeSources = await SourceService.getActive();
    console.log(`✅ تم تحميل ${activeSources.length} مصدر نشط من الداتابيس\n`);

    if (activeSources.length === 0) {
      console.log('⚠️  لا توجد مصادر نشطة في الداتابيس');
      return;
    }

    // سحب الأخبار من جميع المصادر النشطة
    console.log('🔄 جاري سحب الأخبار من المصادر...');
    const results = await rssFetcherService.fetchFromSources(activeSources as any);

    // حفظ النتائج في JSON للمرجعية
    const filepath = dataStorageService.saveAllResults(
      results,
      [],
      `rss-results-${new Date().toISOString().split('T')[0]}.json`
    );
    console.log(`✅ تم حفظ النتائج في: ${filepath}\n`);

    // حفظ البيانات الناجحة في الداتابيس
    console.log('💾 جاري حفظ البيانات في الداتابيس...');
    let savedCount = 0;
    let errorCount = 0;

    for (const result of results) {
      if (result.error || !result.article) {
        console.log(`❌ ${result.source.name}: ${result.error}`);
        errorCount++;
        continue;
      }

      try {
        const categoryId = result.source.default_category_id || 1;

        // حفظ البيانات الخام في الداتابيس
        await RawDataService.create({
          source_id: result.source.id,
          source_type_id: result.source.source_type_id,
          category_id: categoryId,
          url: result.article.link,
          title: result.article.title,
          content: result.article.description,
          image_url: '',
          tags: [],
          fetch_status: 'fetched'
        });

        savedCount++;
        console.log(`✅ تم حفظ: ${result.article.title.substring(0, 50)}...`);
      } catch (error) {
        console.log(`❌ خطأ في حفظ ${result.source.name}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        errorCount++;
      }
    }

    // الإحصائيات النهائية
    console.log('\n' + '='.repeat(80));
    console.log('📊 الإحصائيات النهائية:');
    console.log(`📈 إجمالي المصادر: ${results.length}`);
    console.log(`✅ تم السحب بنجاح: ${results.filter(r => !r.error).length}`);
    console.log(`💾 تم الحفظ في الداتابيس: ${savedCount}`);
    console.log(`❌ أخطاء: ${errorCount}`);
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
