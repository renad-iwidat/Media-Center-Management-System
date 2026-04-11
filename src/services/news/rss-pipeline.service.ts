/**
 * RSS Pipeline Service
 * خدمة شاملة لسحب وحفظ الأخبار
 */

import { SourceService } from '../database/database.service';
import { rssFetcherService, RSSSource } from './rss-fetcher.service';
import { articleSaverService, ArticleWithSource } from './article-saver.service';

/**
 * واجهة لنتيجة الـ pipeline
 */
export interface PipelineResult {
  totalSources: number;
  totalArticles: number;
  savedCount: number;
  failedCount: number;
  duration: number;
  details: {
    source: string;
    articlesCount: number;
    savedCount: number;
    failedCount: number;
  }[];
}

/**
 * فئة RSS Pipeline Service
 */
class RSSPipelineService {
  /**
   * تشغيل الـ pipeline الكامل
   */
  async runPipeline(articlesPerSource: number = 20): Promise<PipelineResult> {
    const startTime = Date.now();
    const details: PipelineResult['details'] = [];
    let totalArticles = 0;
    let savedCount = 0;
    let failedCount = 0;

    try {
      console.log('🚀 بدء pipeline سحب وحفظ الأخبار...\n');

      // 1. جلب المصادر النشطة
      console.log('📡 جلب المصادر النشطة...');
      const sources = await SourceService.getActive();
      console.log(`✅ تم جلب ${sources.length} مصدر\n`);

      // 2. سحب الأخبار من كل مصدر
      for (const source of sources) {
        try {
          console.log(`📰 سحب من: ${source.name}`);

          // تحويل المصدر إلى صيغة RSSSource
          const rssSource: RSSSource = {
            id: source.id,
            name: source.name,
            url: source.url,
            source_type_id: source.source_type_id,
            default_category_id: source.default_category_id,
          };

          // سحب الأخبار
          const fetchResults = await rssFetcherService.fetchArticlesFromSource(
            rssSource,
            articlesPerSource
          );

          // تصفية الأخبار الناجحة
          const successfulArticles = fetchResults
            .filter((r) => r.article && !r.error)
            .map((r) => ({
              title: r.article!.title,
              description: r.article!.description,
              link: r.article!.link,
              pubDate: r.article!.pubDate,
              image_url: r.article!.image_url,
              tags: r.article!.tags,
              source: {
                id: source.id,
                source_type_id: source.source_type_id,
                default_category_id: source.default_category_id,
              },
            })) as ArticleWithSource[];

          console.log(`   📥 تم سحب ${successfulArticles.length} خبر`);

          // 3. حفظ الأخبار
          if (successfulArticles.length > 0) {
            const saveResult = await articleSaverService.saveArticles(
              successfulArticles
            );

            totalArticles += saveResult.totalArticles;
            savedCount += saveResult.savedCount;
            failedCount += saveResult.failedCount;

            details.push({
              source: source.name,
              articlesCount: successfulArticles.length,
              savedCount: saveResult.savedCount,
              failedCount: saveResult.failedCount,
            });

            console.log(
              `   ✅ تم حفظ ${saveResult.savedCount}/${successfulArticles.length}\n`
            );
          }
        } catch (error) {
          console.error(`❌ خطأ في معالجة ${source.name}:`, error);
          details.push({
            source: source.name,
            articlesCount: 0,
            savedCount: 0,
            failedCount: 0,
          });
        }
      }

      const duration = Date.now() - startTime;

      console.log('\n📊 ملخص النتائج:');
      console.log(`   إجمالي المصادر: ${sources.length}`);
      console.log(`   إجمالي الأخبار المسحوبة: ${totalArticles}`);
      console.log(`   ✅ تم حفظها: ${savedCount}`);
      console.log(`   ❌ فشل الحفظ: ${failedCount}`);
      console.log(`   ⏱️  الوقت المستغرق: ${(duration / 1000).toFixed(2)} ثانية\n`);

      return {
        totalSources: sources.length,
        totalArticles,
        savedCount,
        failedCount,
        duration,
        details,
      };
    } catch (error) {
      console.error('❌ خطأ في الـ pipeline:', error);
      throw error;
    }
  }
}

// تصدير instance واحد من الخدمة
export const rssPipelineService = new RSSPipelineService();
