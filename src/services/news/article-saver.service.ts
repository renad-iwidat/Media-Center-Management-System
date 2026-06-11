/**
 * Article Saver Service
 * حفظ الأخبار الجديدة في الداتابيس — بسرعة وبدون انتظار AI
 * 
 * المسؤولية: حفظ الأخبار بستيتوس 'fetched' فوراً
 * إعادة الصياغة = تصير بالخلفية (article-rewriter.service)
 * التصنيف والتوجيه = مسؤولية FlowRouterService
 */

import { RawDataService, GeoScopeService } from '../database/database.service';
import { MediaUnitArticleService } from '../database/media-unit-article.service';
import { ArticleToSave } from './news-pipeline.service';
import { mapApiCategoryToLocalId } from './ai-classifier.service';

export interface ArticleWithSource extends ArticleToSave {}

export interface SaveResult {
  totalArticles: number;
  savedCount: number;
  failedCount: number;
  skippedCount: number;
}

/** تحويل pubDate string إلى Date أو null */
function parsePubDate(pubDate: string): Date | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * عدد الأخبار اللي تتحفظ بالتوازي بالـ DB
 * (بدون AI — فقط DB operations = سريع جداً)
 */
const CONCURRENT_SAVES = 15;

class ArticleSaverService {
  /**
   * حفظ مجموعة من الأخبار في الداتابيس — بسرعة
   *
   * لا ينتظر AI — يحفظ النص الأصلي فوراً.
   * إعادة الصياغة تصير لاحقاً بالخلفية (background rewriter).
   */
  async saveArticles(articles: ArticleToSave[]): Promise<SaveResult> {
    if (articles.length === 0) {
      return { totalArticles: 0, savedCount: 0, failedCount: 0, skippedCount: 0 };
    }

    console.log(`\n💾 حفظ ${articles.length} خبر (بدون انتظار AI — حفظ مباشر)...`);
    const startTime = Date.now();

    let savedCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    let currentIndex = 0;

    const saveOne = async (): Promise<void> => {
      while (true) {
        const idx = currentIndex++;
        if (idx >= articles.length) break;

        const article = articles[idx];
        try {
          // فحص التكرار
          const similar = await RawDataService.existsBySimilarity(article.title, article.description);
          if (similar) {
            skippedCount++;
            continue;
          }

          // ربط التصنيف
          let categoryId: number | null = null;
          if (article.ai_category_slug) {
            categoryId = await mapApiCategoryToLocalId(article.ai_category_slug);
          }
          if (!categoryId && article.source.default_category_id) {
            categoryId = article.source.default_category_id;
          }

          // ربط النطاق الجغرافي
          let geoScopeId: number | null = null;
          if (article.geo_scope_slug) {
            try {
              const geoScope = await GeoScopeService.getBySlug(article.geo_scope_slug);
              if (geoScope) geoScopeId = geoScope.id;
            } catch { /* تجاهل */ }
          }

          // حفظ في DB — النص الأصلي (بدون إعادة صياغة)
          const created = await RawDataService.create({
            source_id: article.source.id,
            source_type_id: article.source.source_type_id,
            category_id: categoryId,
            geo_scope_id: geoScopeId,
            url: article.link,
            title: article.title,
            content: article.full_text || article.description,
            image_url: article.image_url || '',
            tags: article.tags || [],
            fetch_status: 'fetched',
            pub_date: parsePubDate(article.pubDate),
            summary: article.summary || article.description || '',
            authors: article.authors || '',
            language: article.language || 'ar',
            source_slug: article.source_slug || '',
            geo_scope_slug: article.geo_scope_slug || '',
            ai_confidence: article.ai_confidence || undefined,
            newsdesk_article_id: article.newsdesk_article_id || undefined,
            category_slug: article.ai_category_slug || '',
            media_unit_id: article.media_unit_id || undefined,
          });

          // إنشاء النسخ (projections) للوحدات الإعلامية
          try {
            await MediaUnitArticleService.fanOut({
              rawDataId: created.id,
              sourceId: article.source.id || null,
              newsdeskArticleId: article.newsdesk_article_id || null,
              categoryId: categoryId,
              geoScopeId: geoScopeId,
              aiConfidence: article.ai_confidence || null,
              explicitMediaUnitIds: article.media_unit_id ? [article.media_unit_id] : [],
            });
          } catch (fanErr) {
            console.warn(`   ⚠️ فشل نسخ الوحدات للخبر ${created.id}:`, fanErr instanceof Error ? fanErr.message : fanErr);
          }

          savedCount++;
        } catch (error: any) {
          failedCount++;
          if (failedCount <= 5) {
            console.error(`   ❌ خطأ حفظ: ${error?.message || error}`);
          }
        }
      }
    };

    // تشغيل workers بالتوازي — DB فقط = 15 بالتوازي بسرعة
    const workers = Array.from(
      { length: Math.min(CONCURRENT_SAVES, articles.length) },
      () => saveOne()
    );
    await Promise.all(workers);

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ حفظ ${savedCount} | ⏭️ تكرار ${skippedCount} | ❌ فشل ${failedCount} | ⏱️ ${totalTime}s\n`);

    return { totalArticles: articles.length, savedCount, failedCount, skippedCount };
  }
}

export const articleSaverService = new ArticleSaverService();
