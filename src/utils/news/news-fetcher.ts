/**
 * News Fetcher
 * 
 * سكريبت لسحب الأخبار من NewsDesk API وحفظها بالداتابيس
 */

import { RawDataService, SourceService } from '../../services/database/database.service';
import { newsDeskApiService } from '../../services/news/newsdesk-api.service';

/**
 * تشغيل سحب الأخبار من NewsDesk API
 */
async function runNewsFetcher(): Promise<void> {
  try {
    const apiUrl = process.env.NEWSDESK_API_URL || 'https://newsdesk-api.liminal.ps';
    console.log(`📰 جاري سحب الأخبار من NewsDesk API...`);
    console.log(`   URL: ${apiUrl}\n`);

    // فحص حالة الـ API
    console.log('🔍 فحص حالة الـ API...');
    const health = await newsDeskApiService.healthCheck();
    console.log(`✅ API متصل — ${health.active_sources} مصدر نشط\n`);

    // ── مزامنة المصادر من الـ API ────────────────────────────────────────
    console.log('🔗 مزامنة المصادر...');
    const apiSources = await newsDeskApiService.getSources(true);
    const sourceCache = new Map<string, number>();

    for (const apiSource of apiSources) {
      const source = await SourceService.findOrCreateBySlug(
        apiSource.slug,
        apiSource.name,
        apiSource.base_url
      );
      sourceCache.set(apiSource.slug, source.id);
    }
    console.log(`✅ تمت مزامنة ${sourceCache.size} مصدر\n`);

    // ── جلب المقالات ─────────────────────────────────────────────────────
    const pageSize = parseInt(process.env.ARTICLES_PER_SOURCE || '20', 10);
    console.log(`🔄 جاري جلب آخر ${pageSize} مقالة...`);
    
    const response = await newsDeskApiService.getArticles({
      page: 1,
      page_size: pageSize,
    });

    console.log(`✅ تم جلب ${response.items.length} مقالة (إجمالي: ${response.total})\n`);

    // ── حفظ المقالات ─────────────────────────────────────────────────────
    console.log('💾 جاري حفظ المقالات...');
    let savedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const article of response.items) {
      try {
        // فحص التكرار
        if (article.id) {
          const existsById = await RawDataService.existsByNewsDeskId(article.id);
          if (existsById) { skippedCount++; continue; }
        }
        const exists = await RawDataService.existsByUrl(article.url);
        if (exists) { skippedCount++; continue; }

        // ربط المصدر
        let sourceId: number | null = null;
        const sourceSlug = article.source?.slug || '';
        if (sourceSlug && sourceCache.has(sourceSlug)) {
          sourceId = sourceCache.get(sourceSlug)!;
          await SourceService.updateLastFetched(sourceId);
        } else if (sourceSlug || article.source?.name) {
          const source = await SourceService.findOrCreateBySlug(
            sourceSlug || article.source!.name.toLowerCase().replace(/\s+/g, '-'),
            article.source?.name || 'Unknown',
            article.source?.base_url || ''
          );
          sourceId = source.id;
          sourceCache.set(sourceSlug || source.slug, source.id);
          await SourceService.updateLastFetched(source.id);
        }

        // حفظ المقالة
        await RawDataService.create({
          source_id: sourceId as any,
          source_type_id: 2, // API
          category_id: null,
          url: article.url,
          title: article.title,
          content: article.text || article.summary || '',
          image_url: article.top_image_url || '',
          tags: article.keywords ? article.keywords.split(',').map(k => k.trim()) : [],
          fetch_status: 'fetched',
          pub_date: article.published_at ? new Date(article.published_at) : null,
          summary: article.summary || '',
          authors: article.authors || '',
          language: article.language || 'ar',
          source_slug: sourceSlug,
          category_slug: article.category?.slug || '',
          geo_scope_slug: article.geo_scope?.slug || '',
          ai_confidence: article.ai_confidence || undefined,
          newsdesk_article_id: article.id,
        });

        savedCount++;
        console.log(`✅ ${article.title.substring(0, 50)}...`);
      } catch (error) {
        console.log(`❌ خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
        errorCount++;
      }
    }

    // الإحصائيات
    console.log('\n' + '='.repeat(60));
    console.log('📊 النتيجة:');
    console.log(`   📥 مقالات من الـ API: ${response.items.length}`);
    console.log(`   💾 تم الحفظ: ${savedCount}`);
    console.log(`   ⏭️  مكرر: ${skippedCount}`);
    console.log(`   🔗 مصادر: ${sourceCache.size}`);
    console.log(`   ❌ أخطاء: ${errorCount}`);
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runNewsFetcher();
}

export { runNewsFetcher };
