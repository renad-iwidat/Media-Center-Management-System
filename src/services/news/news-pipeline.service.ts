/**
 * News Pipeline Service
 * خدمة سحب الأخبار من NewsDesk API الخارجي — بناءً على الوحدات الإعلامية
 * 
 * الفلو (Two-Step):
 * ─────────────────────────────────────────────────────────────────────────
 * الخطوة 1: GET /articles/by-media-unit/{slug}
 *   → قائمة المقالات التابعة للوحدة (بدون النص الكامل)
 *   → نستخدمها لمعرفة الـ IDs + فلترة المكرر
 * 
 * الخطوة 2: GET /articles/{id}
 *   → لكل مقالة جديدة (مش مكررة) نجلب التفاصيل الكاملة
 *   → يرجع: text (النص الكامل) + classifications + كل التفاصيل
 * 
 * النتيجة: بيانات كاملة 100% من الـ API — بدون نقص
 * ─────────────────────────────────────────────────────────────────────────
 */

import { RawDataService, SourceService } from '../database/database.service';
import { MediaUnitSourceService } from '../database/media-unit-source.service';
import { MediaUnitArticleService } from '../database/media-unit-article.service';
import { newsDeskApiService, NewsDeskArticle } from './newsdesk-api.service';
import { SystemSettingsService } from '../database/system-settings.service';
import { syncStateService } from './sync-state.service';

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
  // ── حقل جديد: الوحدة الإعلامية ──
  media_unit_id?: number;
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
  // ── تفاصيل per media unit ──
  mediaUnitDetails: {
    mediaUnit: string;
    slug: string;
    fetched: number;
    newCount: number;
    skippedCount: number;
  }[];
}

/** حجم الـ batch لفحص الروابط الموجودة */
const URL_CHECK_BATCH = 20;

/** حجم الـ batch لجلب التفاصيل الكاملة */
const DETAIL_FETCH_BATCH = 5;

/**
 * تحويل مقالة كاملة (من /articles/{id}) إلى الصيغة المحلية
 * هذه المقالة فيها كل التفاصيل: text + classifications + source + category + geo_scope
 * 
 * إذا text ناقص → يجلب raw_text من /articles/raw/{id}
 */
function mapFullArticleToLocal(article: NewsDeskArticle, mediaUnitId: number, rawText?: string): ArticleToSave {
  // تحويل keywords string إلى array (هي الـ tags عندنا)
  const tags: string[] = [];
  if (article.keywords) {
    tags.push(...article.keywords.split(',').map(k => k.trim()).filter(Boolean));
  }

  // استخراج معلومات المصدر
  const sourceSlug = article.source?.slug || '';
  const sourceName = article.source?.name || 'NewsDesk';
  const sourceBaseUrl = article.source?.base_url || '';

  // النص الكامل: أولوية لـ article.text ثم rawText ثم summary
  const fullText = article.text || rawText || article.summary || '';

  return {
    title: article.title,
    description: article.summary || '',
    link: article.url,
    pubDate: article.published_at || article.created_at,
    image_url: article.top_image_url || undefined,
    tags,
    source: {
      id: 0, // مؤقت — يتم ربطه بمرحلة الحفظ عبر findOrCreateBySlug
      source_type_id: 2, // API
      default_category_id: null,
    },
    sourceName,
    sourceBaseUrl,
    // ── البيانات الكاملة ──
    summary: article.summary || '',
    full_text: fullText,
    language: article.language || 'ar',
    authors: article.authors || undefined,
    ai_category_slug: article.category?.slug || undefined,
    geo_scope_slug: article.geo_scope?.slug || undefined,
    ai_confidence: article.ai_confidence || undefined,
    source_slug: sourceSlug,
    newsdesk_article_id: article.id,
    // ── الوحدة الإعلامية ──
    media_unit_id: mediaUnitId,
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
   * سحب الأخبار من NewsDesk API — بناءً على الوحدات الإعلامية
   * 
   * Two-Step Approach:
   * ─────────────────────────────────────────────────────────────
   * Step 1: /articles/by-media-unit/{slug} → قائمة IDs + metadata
   * Step 2: /articles/{id} → النص الكامل + كل التفاصيل
   * ─────────────────────────────────────────────────────────────
   */
  async runPipeline(articlesPerSource: number = 20): Promise<PipelineResult> {
    const startTime = Date.now();

    // مسح الـ cache بكل دورة جديدة
    this.sourceCache.clear();

    // التحقق من إعداد الـ scheduler
    const schedulerEnabled = await SystemSettingsService.getBoolean('scheduler_enabled', true);
    if (!schedulerEnabled) {
      console.log('⏸️  السحب متوقف (scheduler_enabled = false)');
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [], mediaUnitDetails: [] };
    }

    const pageSize = await SystemSettingsService.getNumber('articles_per_source', articlesPerSource);

    // ── فحص حالة الـ API أولاً ────────────────────────────────────────────
    console.log(`\n📡 الاتصال بـ NewsDesk API...`);
    try {
      const health = await newsDeskApiService.healthCheck();
      console.log(`✅ API متصل — ${health.active_sources} مصدر نشط | Scheduler: ${health.scheduler_status}`);
    } catch (error) {
      console.error(`❌ فشل الاتصال بـ NewsDesk API:`, error instanceof Error ? error.message : error);
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [], mediaUnitDetails: [] };
    }

    // ── المرحلة 1: جلب الوحدات الإعلامية النشطة ────────────────────────────
    const mediaUnits = await MediaUnitSourceService.getActiveUnitsWithSourceSlugs();
    
    if (mediaUnits.length === 0) {
      console.log('⚠️  لا توجد وحدات إعلامية نشطة مع مصادر مربوطة');
      return this.runGlobalPipeline(pageSize);
    }

    console.log(`\n🏢 ${mediaUnits.length} وحدة إعلامية نشطة:`);
    for (const unit of mediaUnits) {
      console.log(`   • ${unit.name} (${unit.slug}) — ${unit.source_slugs.length} مصدر`);
    }

    // ── المرحلة 2: سحب قوائم المقالات لكل وحدة (Incremental Sync) ─────────
    // بدلاً من "آخر ساعتين" الثابتة — نستخدم last_sync_time لكل وحدة
    // أول مزامنة → آخر 7 أيام | بعدها → ساعة overlap من آخر مزامنة ناجحة

    // تجميع المقالات الجديدة (بعد فلترة المكرر) مع media_unit_id
    // ملاحظة: نفس الخبر قد يظهر تحت أكثر من وحدة — نسحبه مرة وحدة فقط
    // (الـ fanOut بمرحلة الحفظ بيربطه بكل الوحدات المعنية)
    const newArticleIds: Array<{ id: number; mediaUnitId: number }> = [];
    const queuedArticleIds = new Set<number>();
    let totalSkipped = 0;
    const mediaUnitDetails: PipelineResult['mediaUnitDetails'] = [];

    for (const unit of mediaUnits) {
      // حساب date_from بناءً على آخر مزامنة ناجحة (Incremental)
      const dateFrom = await syncStateService.getDateFromForUnit(unit.id);
      console.log(`\n📰 [${unit.name}] Step 1: جلب المقالات من ${dateFrom} (incremental sync)...`);

      // بدء سجل المزامنة
      let logId: number | null = null;
      try {
        logId = await syncStateService.startLog(unit.id, 'articles');
      } catch { /* تجاهل */ }

      const unitStartTime = Date.now();
      let unitArticles: NewsDeskArticle[] = [];

      try {
        // جلب الصفحة الأولى
        const firstResponse = await newsDeskApiService.getArticlesByMediaUnit(unit.slug, {
          date_from: dateFrom,
          page: 1,
          page_size: Math.min(pageSize, 100),
        });

        unitArticles = firstResponse.items;
        const totalPages = firstResponse.pages;
        console.log(`   📥 صفحة 1/${totalPages}: ${firstResponse.items.length} مقالة (إجمالي: ${firstResponse.total})`);

        // جلب باقي الصفحات (حد أقصى 10 بدلاً من 5 — لضمان عدم تفويت أخبار)
        const maxPages = Math.min(totalPages, 10);
        for (let page = 2; page <= maxPages; page++) {
          const response = await newsDeskApiService.getArticlesByMediaUnit(unit.slug, {
            date_from: dateFrom,
            page,
            page_size: Math.min(pageSize, 100),
          });
          unitArticles.push(...response.items);
          console.log(`   📥 صفحة ${page}/${totalPages}: ${response.items.length} مقالة`);

          // إذا الصفحة فاضية — انتهت البيانات
          if (response.items.length === 0) break;
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`   ❌ خطأ في سحب قائمة أخبار [${unit.name}]:`, errMsg);
        
        // تسجيل الخطأ
        try {
          await syncStateService.recordError(unit.id, errMsg);
          if (logId) await syncStateService.completeLog(logId, 'failed', { errors: [errMsg], duration_ms: Date.now() - unitStartTime });
        } catch { /* تجاهل */ }

        mediaUnitDetails.push({
          mediaUnit: unit.name,
          slug: unit.slug,
          fetched: 0,
          newCount: 0,
          skippedCount: 0,
        });
        continue;
      }

      // ── فلترة المكرر (بالـ newsdesk_article_id أو URL) ──
      // المكرر ما منتخطاه كلياً: إذا الخبر موجود بـ raw_data بس مش مربوط بهالوحدة
      // → منعمل نسخة (projection) للوحدة بدون تكرار المحتوى
      let unitNewCount = 0;
      let unitSkipped = 0;
      let unitLinked = 0;

      for (let i = 0; i < unitArticles.length; i += URL_CHECK_BATCH) {
        const batch = unitArticles.slice(i, i + URL_CHECK_BATCH);
        const existingIds = await Promise.all(
          batch.map(async (a) => {
            // جلب id الخبر الأصلي إن وُجد (بالـ newsdesk id أولاً ثم URL)
            let rawId = await RawDataService.getIdByNewsDeskId(a.id);
            if (!rawId) rawId = await RawDataService.getIdByUrl(a.url);
            return rawId;
          })
        );
        for (let j = 0; j < batch.length; j++) {
          const rawId = existingIds[j];
          if (rawId) {
            // الخبر موجود — نتأكد إنه مربوط بهالوحدة (نسخة)
            const hasProjection = await MediaUnitArticleService.exists(rawId, unit.id);
            if (hasProjection) {
              unitSkipped++;
            } else {
              // موجود بس مش مربوط بهالوحدة → نعمل نسخة (بدون إعادة سحب المحتوى)
              await MediaUnitArticleService.createProjection({
                rawDataId: rawId,
                mediaUnitId: unit.id,
                status: 'pending',
              });
              unitLinked++;
            }
          } else {
            // خبر جديد — نسحبه مرة وحدة فقط حتى لو ظهر تحت أكثر من وحدة
            if (!queuedArticleIds.has(batch[j].id)) {
              queuedArticleIds.add(batch[j].id);
              newArticleIds.push({ id: batch[j].id, mediaUnitId: unit.id });
              unitNewCount++;
            } else {
              // ظهر تحت وحدة سابقة بنفس الدورة — رح يتربط بالـ fanOut
              unitNewCount++;
            }
          }
        }
      }

      totalSkipped += unitSkipped;
      console.log(`   ✅ [${unit.name}] ${unitNewCount} جديد | 🔗 ${unitLinked} نسخة لخبر موجود | ⏭️ ${unitSkipped} مكرر`);

      // تحديث حالة المزامنة + إكمال السجل
      try {
        // حساب آخر تاريخ مقالة
        let lastArticleDate: Date | null = null;
        if (unitArticles.length > 0) {
          const dates = unitArticles
            .map(a => a.published_at || a.created_at)
            .filter(Boolean)
            .map(d => new Date(d))
            .filter(d => !isNaN(d.getTime()));
          if (dates.length > 0) {
            lastArticleDate = new Date(Math.max(...dates.map(d => d.getTime())));
          }
        }

        await syncStateService.updateState(unit.id, unit.slug, unitNewCount, lastArticleDate);
        
        if (logId) {
          await syncStateService.completeLog(logId, 'success', {
            articles_fetched: unitArticles.length,
            articles_saved: unitNewCount,
            articles_skipped: unitSkipped,
            duration_ms: Date.now() - unitStartTime,
          });
        }
      } catch { /* تجاهل أخطاء التسجيل */ }

      mediaUnitDetails.push({
        mediaUnit: unit.name,
        slug: unit.slug,
        fetched: unitArticles.length,
        newCount: unitNewCount,
        skippedCount: unitSkipped,
      });
    }

    if (newArticleIds.length === 0) {
      const duration = Date.now() - startTime;
      console.log(`\n✅ لا توجد مقالات جديدة | ⏭️ ${totalSkipped} مكرر | ⏱️ ${(duration / 1000).toFixed(1)}s\n`);
      return { totalSources: 0, newArticles: [], skippedCount: totalSkipped, duration, details: [], mediaUnitDetails };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // المرحلة 3: جلب التفاصيل الكاملة لكل مقالة جديدة
    // GET /articles/{id} → يرجع text + classifications + كل شي
    // ══════════════════════════════════════════════════════════════════════════
    console.log(`\n📄 Step 2: جلب التفاصيل الكاملة لـ ${newArticleIds.length} مقالة من /articles/{id}...`);

    const allNewArticles: ArticleToSave[] = [];
    let fetchErrors = 0;

    for (let i = 0; i < newArticleIds.length; i += DETAIL_FETCH_BATCH) {
      const batch = newArticleIds.slice(i, i + DETAIL_FETCH_BATCH);
      
      const results = await Promise.allSettled(
        batch.map(async ({ id, mediaUnitId }) => {
          const fullArticle = await newsDeskApiService.getArticleById(id);
          // إذا النص الكامل ناقص → نجلبه من /articles/raw/{id}
          let rawText: string | undefined;
          if (!fullArticle.text) {
            try {
              const rawArticle = await newsDeskApiService.getRawArticleById(id);
              rawText = rawArticle.raw_text || undefined;
            } catch { /* تجاهل */ }
          }
          return mapFullArticleToLocal(fullArticle, mediaUnitId, rawText);
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allNewArticles.push(result.value);
        } else {
          fetchErrors++;
          console.warn(`   ⚠️ فشل جلب تفاصيل مقالة: ${result.reason?.message || result.reason}`);
        }
      }

      // Progress log كل 20 مقالة
      if ((i + DETAIL_FETCH_BATCH) % 20 === 0 || i + DETAIL_FETCH_BATCH >= newArticleIds.length) {
        const done = Math.min(i + DETAIL_FETCH_BATCH, newArticleIds.length);
        console.log(`   📄 ${done}/${newArticleIds.length} مقالة (${fetchErrors} أخطاء)`);
      }

      // Delay بسيط بين الـ batches لتجنب rate limiting
      if (i + DETAIL_FETCH_BATCH < newArticleIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    console.log(`   ✅ تم جلب ${allNewArticles.length} مقالة كاملة (${fetchErrors} فشل)`);

    // ── المرحلة 4: ربط المصادر ───────────────────────────────────────────
    console.log(`\n🔗 ربط ${allNewArticles.length} مقالة بمصادرها...`);
    for (const article of allNewArticles) {
      try {
        const sourceId = await this.resolveSourceId(article);
        article.source.id = sourceId;
      } catch (error) {
        console.warn(`   ⚠️ فشل ربط مصدر "${article.sourceName}":`, error instanceof Error ? error.message : error);
      }
    }
    console.log(`   ✅ تم ربط المصادر (${this.sourceCache.size} مصدر فريد)`);

    const duration = Date.now() - startTime;
    console.log(`\n✅ ${allNewArticles.length} مقالة جديدة (كاملة) | ⏭️ ${totalSkipped} مكرر | ⏱️ ${(duration / 1000).toFixed(1)}s\n`);

    // تجميع الـ details حسب المصدر
    const sourceMap = new Map<string, { fetched: number; newCount: number; skippedCount: number }>();
    for (const article of allNewArticles) {
      const name = article.sourceName;
      if (!sourceMap.has(name)) {
        sourceMap.set(name, { fetched: 0, newCount: 0, skippedCount: 0 });
      }
      sourceMap.get(name)!.newCount++;
      sourceMap.get(name)!.fetched++;
    }

    const details = Array.from(sourceMap.entries()).map(([source, stats]) => ({
      source,
      fetched: stats.fetched,
      newCount: stats.newCount,
      skippedCount: stats.skippedCount,
    }));

    return {
      totalSources: sourceMap.size,
      newArticles: allNewArticles,
      skippedCount: totalSkipped,
      duration,
      details,
      mediaUnitDetails,
    };
  }

  /**
   * Fallback: سحب عام بدون تحديد وحدة إعلامية
   * يُستخدم إذا ما في وحدات إعلامية مربوطة بمصادر
   * 
   * نفس الـ Two-Step:
   * 1. /articles → قائمة
   * 2. /articles/{id} → تفاصيل كاملة
   */
  private async runGlobalPipeline(pageSize: number): Promise<PipelineResult> {
    console.log('\n⚠️ Fallback: سحب عام (لا توجد وحدات مربوطة بمصادر)...');

    // سحب آخر 7 أيام (بدلاً من ساعتين) لضمان وجود أخبار
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFrom = sevenDaysAgo.toISOString().split('T')[0];

    let listArticles: NewsDeskArticle[] = [];

    try {
      const firstResponse = await newsDeskApiService.getArticles({
        date_from: dateFrom,
        page: 1,
        page_size: Math.min(pageSize, 100),
      });

      listArticles = firstResponse.items;
      const totalPages = firstResponse.pages;
      console.log(`   📥 صفحة 1/${totalPages}: ${firstResponse.items.length} مقالة (إجمالي: ${firstResponse.total})`);

      const maxPages = Math.min(totalPages, 5);
      for (let page = 2; page <= maxPages; page++) {
        const response = await newsDeskApiService.getArticles({
          date_from: dateFrom,
          page,
          page_size: Math.min(pageSize, 100),
        });
        listArticles.push(...response.items);
        console.log(`   📥 صفحة ${page}/${totalPages}: ${response.items.length} مقالة`);
      }
    } catch (error) {
      console.error(`❌ خطأ في السحب العام:`, error instanceof Error ? error.message : error);
      return { totalSources: 0, newArticles: [], skippedCount: 0, duration: 0, details: [], mediaUnitDetails: [] };
    }

    // فلترة المكرر
    const newArticleIds: Array<{ id: number; mediaUnitId: number }> = [];
    let skippedCount = 0;

    for (let i = 0; i < listArticles.length; i += URL_CHECK_BATCH) {
      const batch = listArticles.slice(i, i + URL_CHECK_BATCH);
      const existsResults = await Promise.all(
        batch.map(async (a) => {
          const existsById = await RawDataService.existsByNewsDeskId(a.id);
          if (existsById) return true;
          return RawDataService.existsByUrl(a.url);
        })
      );
      for (let j = 0; j < batch.length; j++) {
        if (existsResults[j]) {
          skippedCount++;
        } else {
          newArticleIds.push({ id: batch[j].id, mediaUnitId: 0 });
        }
      }
    }

    if (newArticleIds.length === 0) {
      return { totalSources: 0, newArticles: [], skippedCount, duration: Date.now(), details: [], mediaUnitDetails: [] };
    }

    // جلب التفاصيل الكاملة
    console.log(`\n📄 جلب التفاصيل الكاملة لـ ${newArticleIds.length} مقالة...`);
    const newArticles: ArticleToSave[] = [];

    for (let i = 0; i < newArticleIds.length; i += DETAIL_FETCH_BATCH) {
      const batch = newArticleIds.slice(i, i + DETAIL_FETCH_BATCH);
      const results = await Promise.allSettled(
        batch.map(async ({ id, mediaUnitId }) => {
          const fullArticle = await newsDeskApiService.getArticleById(id);
          let rawText: string | undefined;
          if (!fullArticle.text) {
            try {
              const rawArticle = await newsDeskApiService.getRawArticleById(id);
              rawText = rawArticle.raw_text || undefined;
            } catch { /* تجاهل */ }
          }
          return mapFullArticleToLocal(fullArticle, mediaUnitId, rawText);
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled') {
          newArticles.push(result.value);
        }
      }
      if (i + DETAIL_FETCH_BATCH < newArticleIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    // ربط المصادر + ربط الوحدة الإعلامية عبر media_unit_sources
    for (const article of newArticles) {
      try {
        const sourceId = await this.resolveSourceId(article);
        article.source.id = sourceId;
        
        // ربط الوحدة الإعلامية: إذا المقالة جاية من مصدر مربوط بوحدة → نربطها
        if (!article.media_unit_id || article.media_unit_id === 0) {
          const linkedUnits = await MediaUnitSourceService.getMediaUnitsBySourceId(sourceId);
          if (linkedUnits.length > 0) {
            article.media_unit_id = linkedUnits[0].id; // أول وحدة مرتبطة بالمصدر
          }
        }
      } catch (error) {
        console.warn(`   ⚠️ فشل ربط مصدر "${article.sourceName}":`, error instanceof Error ? error.message : error);
      }
    }

    return {
      totalSources: this.sourceCache.size,
      newArticles,
      skippedCount,
      duration: Date.now(),
      details: [],
      mediaUnitDetails: [],
    };
  }
}

export const newsPipelineService = new NewsPipelineService();
