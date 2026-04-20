/**
 * RSS Pipeline Service
 * خدمة شاملة لسحب وحفظ الأخبار
 */

import { SourceService, RawDataService } from '../database/database.service';
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
  skippedCount: number;
  duration: number;
  details: {
    source: string;
    articlesCount: number;
    savedCount: number;
    failedCount: number;
    skippedCount: number;
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
    let skippedCount = 0;

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
          let successfulArticles = fetchResults
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

          // تصفية الروابط الموجودة بالفعل قبل الحفظ
          const newArticles: ArticleWithSource[] = [];
          for (const article of successfulArticles) {
            const exists = await RawDataService.existsByUrl(article.link);
            if (!exists) {
              newArticles.push(article);
            } else {
              console.log(`   ⏭️  تخطي: ${article.title} (الرابط موجود)`);
              skippedCount++;
            }
          }

          console.log(`   ✅ أخبار جديدة: ${newArticles.length}`);

          // 3. حفظ الأخبار الجديدة فقط
          if (newArticles.length > 0) {
            const saveResult = await articleSaverService.saveArticles(
              newArticles
            );

            totalArticles += saveResult.totalArticles;
            savedCount += saveResult.savedCount;
            failedCount += saveResult.failedCount;

            details.push({
              source: source.name,
              articlesCount: newArticles.length,
              savedCount: saveResult.savedCount,
              failedCount: saveResult.failedCount,
              skippedCount: 0,
            });

            console.log(
              `   ✅ تم حفظ ${saveResult.savedCount}/${newArticles.length}\n`
            );
          } else {
            details.push({
              source: source.name,
              articlesCount: 0,
              savedCount: 0,
              failedCount: 0,
              skippedCount: successfulArticles.length,
            });
          }
        } catch (error) {
          console.error(`❌ خطأ في معالجة ${source.name}:`, error);
          details.push({
            source: source.name,
            articlesCount: 0,
            savedCount: 0,
            failedCount: 0,
            skippedCount: 0,
          });
        }
      }

      const duration = Date.now() - startTime;

      console.log('\n📊 ملخص النتائج:');
      console.log(`   إجمالي المصادر: ${sources.length}`);
      console.log(`   إجمالي الأخبار المسحوبة: ${totalArticles}`);
      console.log(`   ✅ تم حفظها: ${savedCount}`);
      console.log(`   ⏭️  تم تخطيها (موجودة): ${skippedCount}`);
      console.log(`   ❌ فشل الحفظ: ${failedCount}`);
      console.log(`   ⏱️  الوقت المستغرق: ${(duration / 1000).toFixed(2)} ثانية\n`);

      return {
        totalSources: sources.length,
        totalArticles,
        savedCount,
        failedCount,
        skippedCount,
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
