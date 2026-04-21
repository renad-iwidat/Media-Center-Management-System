/**
 * RSS Pipeline Service
 * خدمة سحب الأخبار — parallel fetch لكل المصادر سوا
 */

import { SourceService, RawDataService } from '../database/database.service';
import { rssFetcherService, RSSSource } from './rss-fetcher.service';
import { SystemSettingsService } from '../database/system-settings.service';

export interface ArticleToSave {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  image_url?: string;
  tags?: string[];
  source: {
    id: number;
    source_type_id: number;
    default_category_id: number | null;
  };
  sourceName: string;
}

/** تحويل pubDate string إلى Date أو null */
function parsePubDate(pubDate: string): Date | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? null : d;
}

export interface PipelineResult {
  totalSources: number;
  newArticles: ArticleToSave[];   // الأخبار الجديدة جاهزة للتصنيف والحفظ
  skippedCount: number;
  duration: number;
  details: {
    source: string;
    fetched: number;
    newCount: number;
    skippedCount: number;
  }[];
}

/** حجم الـ batch لفحص الروابط الموجودة */
const URL_CHECK_BATCH = 10;

class RSSPipelineService {
  /**
   * سحب الأخبار من جميع المصادر بشكل parallel
   * ويرجع الأخبار الجديدة فقط — بدون تصنيف أو حفظ (هاد دور الـ scheduler)
   */
  async runPipeline(articlesPerSource: number = 20): Promise<PipelineResult> {
    const startTime = Date.now();

    // التحقق من إعداد الـ scheduler
    const schedulerEnabled = await SystemSettingsService.getBoolean('scheduler_enabled', true);
    if (!schedulerEnabled) {
      console.log('⏸️  السحب متوقف (scheduler_enabled = false)');
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [] };
    }

    const perSource = await SystemSettingsService.getNumber('articles_per_source', articlesPerSource);
    console.log(`\n📡 جلب المصادر النشطة...`);
    const sources = await SourceService.getActive();
    console.log(`✅ ${sources.length} مصدر — سحب ${perSource} خبر من كل مصدر (parallel)\n`);

    // ── المرحلة 1: سحب كل المصادر سوا ────────────────────────────────────
    const fetchResults = await Promise.allSettled(
      sources.map(async (source) => {
        const rssSource: RSSSource = {
          id: source.id,
          name: source.name,
          url: source.url,
          source_type_id: source.source_type_id,
          default_category_id: source.default_category_id,
        };
        const results = await rssFetcherService.fetchArticlesFromSource(rssSource, perSource);
        
        // تحديث آخر وقت سحب للمصدر
        if (results.some(r => r.article && !r.error)) {
          await SourceService.updateLastFetched(source.id);
        }
        
        return { source, results };
      })
    );

    // ── المرحلة 2: تجميع الأخبار الناجحة ─────────────────────────────────
    const allCandidates: ArticleToSave[] = [];
    const details: PipelineResult['details'] = [];

    for (const settled of fetchResults) {
      if (settled.status === 'rejected') continue;
      const { source, results } = settled.value;

      const successful = results
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
          sourceName: source.name,
        }));

      allCandidates.push(...successful);
      console.log(`   📥 ${source.name}: ${successful.length} خبر`);
    }

    // ── المرحلة 3: فلترة الموجودين — batch parallel ───────────────────────
    console.log(`\n🔍 فحص ${allCandidates.length} خبر (موجود مسبقاً؟) — batches من ${URL_CHECK_BATCH}...`);

    const newArticles: ArticleToSave[] = [];
    let skippedCount = 0;

    // نقسم الـ candidates على batches ونفحصهم سوا
    for (let i = 0; i < allCandidates.length; i += URL_CHECK_BATCH) {
      const batch = allCandidates.slice(i, i + URL_CHECK_BATCH);
      const existsResults = await Promise.all(
        batch.map((a) => RawDataService.existsByUrl(a.link))
      );
      for (let j = 0; j < batch.length; j++) {
        if (existsResults[j]) {
          skippedCount++;
        } else {
          newArticles.push(batch[j]);
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ ${newArticles.length} خبر جديد | ⏭️  ${skippedCount} موجود مسبقاً | ⏱️  ${(duration / 1000).toFixed(1)}s\n`);

    // تجميع الـ details لكل مصدر
    for (const settled of fetchResults) {
      if (settled.status === 'rejected') continue;
      const { source, results } = settled.value;
      const fetched = results.filter((r) => r.article && !r.error).length;
      const sourceNew = newArticles.filter((a) => a.source.id === source.id).length;
      details.push({
        source: source.name,
        fetched,
        newCount: sourceNew,
        skippedCount: fetched - sourceNew,
      });
    }

    return {
      totalSources: sources.length,
      newArticles,
      skippedCount,
      duration,
      details,
    };
  }
}

export const rssPipelineService = new RSSPipelineService();
