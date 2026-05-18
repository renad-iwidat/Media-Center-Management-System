/**
 * News Pipeline Service
 * خدمة سحب الأخبار من NewsDesk API الخارجي
 * 
 * بديل عن RSS Pipeline القديم — الآن يسحب من API مركزي بدلاً من RSS feeds مباشرة
 * كل خبر يتربط بمصدره بجدول sources (يُنشأ تلقائياً إذا ما كان موجود)
 */

import { RawDataService, SourceService } from '../database/database.service';
import { newsDeskApiService, NewsDeskRawArticle } from './newsdesk-api.service';
import { SystemSettingsService } from '../database/system-settings.service';

export interface ArticleToSave {
  title: string;
  description: string;       // الملخص
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
  sourceBaseUrl?: string;
  // حقول إضافية من الـ API
  summary?: string;          // الملخص
  full_text?: string;        // النص الكامل (يتخزن بـ content)
  language?: string;
  authors?: string;
  ai_category_slug?: string;
  geo_scope_slug?: string;
  ai_confidence?: number;
  source_slug?: string;
  newsdesk_article_id?: number;
}

export interface PipelineResult {
  totalSources: number;
  newArticles: ArticleToSave[];
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
const URL_CHECK_BATCH = 20;

/**
 * تحويل مقالة خام من NewsDesk API إلى الصيغة المحلية
 * (source.id يبقى 0 مؤقتاً — يتم ربطه لاحقاً بمرحلة الحفظ)
 */
function mapRawArticleToLocal(article: NewsDeskRawArticle): ArticleToSave {
  // تحويل raw_keywords string إلى array (هي الـ tags عندنا)
  const tags: string[] = [];
  if (article.raw_keywords) {
    tags.push(...article.raw_keywords.split(',').map(k => k.trim()).filter(Boolean));
  }

  // استخراج اللغة من raw_meta إذا موجودة
  const language = article.raw_meta?.articleLanguage || article.raw_meta?.configuredLanguage || 'ar';

  // استخراج slug المصدر من source_url (مثلاً: https://asharq.com → asharq)
  let sourceSlug = '';
  let sourceName = 'NewsDesk';
  if (article.source_url) {
    try {
      const urlObj = new URL(article.source_url);
      const hostname = urlObj.hostname.replace('www.', '');
      sourceSlug = hostname.split('.')[0]; // asharq.com → asharq
      sourceName = hostname; // asharq.com
    } catch { /* تجاهل URLs غير صالحة */ }
  }

  return {
    title: article.raw_title,
    description: article.raw_summary || article.raw_text?.substring(0, 500) || '',
    link: article.raw_url,
    pubDate: article.raw_published_at || article.fetched_at,
    image_url: article.raw_top_image_url || undefined,
    tags,
    source: {
      id: 0, // مؤقت — يتم ربطه بمرحلة الحفظ عبر findOrCreateBySlug
      source_type_id: 2, // API
      default_category_id: null,
    },
    sourceName,
    sourceBaseUrl: article.source_url || '',
    // حقول إضافية
    summary: article.raw_summary || '',
    full_text: article.raw_text || '',
    language,
    authors: article.raw_authors || undefined,
    ai_category_slug: undefined, // المقالات الخام ما عندها تصنيف — بيتصنف لاحقاً
    geo_scope_slug: undefined,
    ai_confidence: undefined,
    source_slug: sourceSlug,
    newsdesk_article_id: article.id,
  };
}

class NewsPipelineService {
  /**
   * Cache للمصادر — لتجنب queries مكررة لنفس المصدر
   */
  private sourceCache = new Map<string, number>();

  /**
   * ربط المقالة بمصدرها في جدول sources
   * إذا المصدر ما كان موجود — ينشئه تلقائياً
   */
  async resolveSourceId(article: ArticleToSave): Promise<number> {
    const slug = article.source_slug || '';
    const name = article.sourceName || 'Unknown';
    const baseUrl = article.sourceBaseUrl || '';

    if (!slug && !name) return 0;

    // فحص الـ cache أولاً
    const cacheKey = slug || name;
    if (this.sourceCache.has(cacheKey)) {
      return this.sourceCache.get(cacheKey)!;
    }

    // البحث أو الإنشاء
    const source = await SourceService.findOrCreateBySlug(
      slug || name.toLowerCase().replace(/\s+/g, '-'),
      name,
      baseUrl
    );

    // تحديث آخر وقت سحب
    await SourceService.updateLastFetched(source.id);

    // حفظ بالـ cache
    this.sourceCache.set(cacheKey, source.id);
    return source.id;
  }

  /**
   * سحب الأخبار من NewsDesk API
   * يجلب المقالات الجديدة ويفلتر الموجود مسبقاً
   */
  async runPipeline(articlesPerSource: number = 20): Promise<PipelineResult> {
    const startTime = Date.now();

    // مسح الـ cache بكل دورة جديدة
    this.sourceCache.clear();

    // التحقق من إعداد الـ scheduler
    const schedulerEnabled = await SystemSettingsService.getBoolean('scheduler_enabled', true);
    if (!schedulerEnabled) {
      console.log('⏸️  السحب متوقف (scheduler_enabled = false)');
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [] };
    }

    const pageSize = await SystemSettingsService.getNumber('articles_per_source', articlesPerSource);

    // ── فحص حالة الـ API أولاً ────────────────────────────────────────────
    console.log(`\n📡 الاتصال بـ NewsDesk API...`);
    try {
      const health = await newsDeskApiService.healthCheck();
      console.log(`✅ API متصل — ${health.active_sources} مصدر نشط | Scheduler: ${health.scheduler_status}`);
    } catch (error) {
      console.error(`❌ فشل الاتصال بـ NewsDesk API:`, error instanceof Error ? error.message : error);
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [] };
    }

    // ── المرحلة 1: جلب المقالات الخام من الـ API ────────────────────────────
    console.log(`\n📰 جلب المقالات الخام (page_size: ${pageSize})...`);

    // نجلب آخر المقالات — نستخدم date_from لآخر 24 ساعة لتجنب التكرار
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const dateFrom = yesterday.toISOString().split('T')[0];

    let allApiArticles: NewsDeskRawArticle[] = [];
    let totalPages = 1;
    let currentPage = 1;

    try {
      // جلب الصفحة الأولى من /articles/raw
      const firstResponse = await newsDeskApiService.getRawArticles({
        date_from: dateFrom,
        page: 1,
        page_size: Math.min(pageSize, 100),
      });

      allApiArticles = firstResponse.items;
      totalPages = firstResponse.pages;
      console.log(`   📥 صفحة 1/${totalPages}: ${firstResponse.items.length} مقالة خام (إجمالي: ${firstResponse.total})`);

      // جلب باقي الصفحات إذا لزم الأمر (حد أقصى 5 صفحات)
      const maxPages = Math.min(totalPages, 5);
      for (currentPage = 2; currentPage <= maxPages; currentPage++) {
        const response = await newsDeskApiService.getRawArticles({
          date_from: dateFrom,
          page: currentPage,
          page_size: Math.min(pageSize, 100),
        });
        allApiArticles.push(...response.items);
        console.log(`   📥 صفحة ${currentPage}/${totalPages}: ${response.items.length} مقالة خام`);
      }
    } catch (error) {
      console.error(`❌ خطأ في جلب المقالات الخام:`, error instanceof Error ? error.message : error);
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [] };
    }

    console.log(`\n✅ تم جلب ${allApiArticles.length} مقالة خام من الـ API`);

    // ── المرحلة 2: تحويل المقالات الخام للصيغة المحلية ──────────────────────────
    const allCandidates = allApiArticles.map(mapRawArticleToLocal);

    // ── المرحلة 3: فلترة الموجودين — batch parallel ───────────────────────
    console.log(`\n🔍 فحص ${allCandidates.length} مقالة (موجود مسبقاً؟) — batches من ${URL_CHECK_BATCH}...`);

    const newArticles: ArticleToSave[] = [];
    let skippedCount = 0;

    for (let i = 0; i < allCandidates.length; i += URL_CHECK_BATCH) {
      const batch = allCandidates.slice(i, i + URL_CHECK_BATCH);
      const existsResults = await Promise.all(
        batch.map(async (a) => {
          // أولاً: فحص بـ newsdesk_article_id (أسرع وأدق)
          if (a.newsdesk_article_id) {
            const existsById = await RawDataService.existsByNewsDeskId(a.newsdesk_article_id);
            if (existsById) return true;
          }
          // ثانياً: فحص بالـ URL
          return RawDataService.existsByUrl(a.link);
        })
      );
      for (let j = 0; j < batch.length; j++) {
        if (existsResults[j]) {
          skippedCount++;
        } else {
          newArticles.push(batch[j]);
        }
      }
    }

    // ── المرحلة 4: ربط المصادر ───────────────────────────────────────────
    console.log(`\n🔗 ربط ${newArticles.length} مقالة بمصادرها...`);
    for (const article of newArticles) {
      try {
        const sourceId = await this.resolveSourceId(article);
        article.source.id = sourceId;
      } catch (error) {
        console.warn(`   ⚠️ فشل ربط مصدر "${article.sourceName}":`, error instanceof Error ? error.message : error);
      }
    }
    console.log(`   ✅ تم ربط المصادر (${this.sourceCache.size} مصدر فريد)`);

    const duration = Date.now() - startTime;
    console.log(`\n✅ ${newArticles.length} مقالة جديدة | ⏭️  ${skippedCount} موجود مسبقاً | ⏱️  ${(duration / 1000).toFixed(1)}s\n`);

    // تجميع الـ details حسب المصدر
    const sourceMap = new Map<string, { fetched: number; newCount: number; skippedCount: number }>();
    for (const article of allCandidates) {
      const name = article.sourceName;
      if (!sourceMap.has(name)) {
        sourceMap.set(name, { fetched: 0, newCount: 0, skippedCount: 0 });
      }
      sourceMap.get(name)!.fetched++;
    }
    for (const article of newArticles) {
      const name = article.sourceName;
      if (sourceMap.has(name)) {
        sourceMap.get(name)!.newCount++;
      }
    }
    for (const [, stats] of sourceMap) {
      stats.skippedCount = stats.fetched - stats.newCount;
    }

    const details = Array.from(sourceMap.entries()).map(([source, stats]) => ({
      source,
      fetched: stats.fetched,
      newCount: stats.newCount,
      skippedCount: stats.skippedCount,
    }));

    return {
      totalSources: sourceMap.size,
      newArticles,
      skippedCount,
      duration,
      details,
    };
  }
}

export const newsPipelineService = new NewsPipelineService();
