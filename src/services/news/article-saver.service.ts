/**
 * Article Saver Service
 * حفظ الأخبار الجديدة في الداتابيس
 * 
 * المسؤولية: حفظ الأخبار بستيتوس 'fetched'
 * التصنيف والتنظيف والتوجيه = مسؤولية FlowRouterService
 * 
 * يدعم المقالات القادمة من NewsDesk API (مصنفة مسبقاً بالـ AI)
 *
 * الأسلوب: Pipeline متوازي — كل خبر يُفحص + يُعاد صياغته + يُحفظ مباشرة
 * بدون انتظار بقية الأخبار (streaming approach)
 */

import { RawDataService, GeoScopeService } from '../database/database.service';
import { MediaUnitArticleService } from '../database/media-unit-article.service';
import { ArticleToSave } from './news-pipeline.service';
import { mapApiCategoryToLocalId } from './ai-classifier.service';
import { articleRewriterService } from './article-rewriter.service';

export interface ArticleWithSource extends ArticleToSave {}

export interface SaveResult {
  totalArticles: number;
  savedCount: number;
  failedCount: number;
  rewrittenCount: number;
  skippedCount: number;
}

/** تحويل pubDate string إلى Date أو null */
function parsePubDate(pubDate: string): Date | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * عدد الأخبار اللي تتعالج بالتوازي
 * كل خبر = فحص تكرار + إعادة صياغة (AI) + حفظ DB
 * 5 بالتوازي = توازن بين السرعة وقدرة سيرفر الموديل
 */
const CONCURRENT_WORKERS = 5;

class ArticleSaverService {
  /**
   * حفظ مجموعة من الأخبار في الداتابيس — Pipeline متوازي
   *
   * كل خبر يمر بالمراحل التالية بشكل مستقل:
   * 1. فحص التكرار
   * 2. إعادة الصياغة (AI) — إذا مفعّلة
   * 3. حفظ في DB
   *
   * 10 أخبار تتعالج بالتوازي — كل خبر يخلص وينحفظ فوراً
   */
  async saveArticles(articles: ArticleToSave[]): Promise<SaveResult> {
    if (articles.length === 0) {
      return { totalArticles: 0, savedCount: 0, failedCount: 0, rewrittenCount: 0, skippedCount: 0 };
    }

    console.log(`\n💾 بدء حفظ ${articles.length} خبر (pipeline متوازي — ${CONCURRENT_WORKERS} بالتوازي)...`);
    const startTime = Date.now();

    const rewriterEnabled = await articleRewriterService.isEnabled();
    if (rewriterEnabled) {
      console.log(`   ✍️  إعادة الصياغة مفعّلة — كل خبر يُعاد صياغته ويُحفظ مباشرة`);
    } else {
      console.log(`   ⏸️  إعادة الصياغة متوقفة — حفظ مباشر بدون معالجة`);
    }

    // العدادات
    let savedCount = 0;
    let failedCount = 0;
    let rewrittenCount = 0;
    let skippedCount = 0;
    let processedCount = 0;

    /**
     * معالجة خبر واحد: فحص تكرار → إعادة صياغة → حفظ
     */
    const processOneArticle = async (article: ArticleToSave): Promise<void> => {
      try {
        // ── 1. فحص التكرار ──────────────────────────────────────────
        const similar = await RawDataService.existsBySimilarity(article.title, article.description);
        if (similar) {
          skippedCount++;
          return;
        }

        // ── 2. إعادة الصياغة (إذا مفعّلة) ──────────────────────────
        if (rewriterEnabled) {
          const contentToRewrite = article.full_text || article.description;
          const rewritten = await articleRewriterService.rewriteArticle(
            article.title,
            contentToRewrite,
            article.sourceName
          );

          // تحديث النص
          if (rewritten.content !== contentToRewrite) {
            if (article.full_text) {
              article.full_text = rewritten.content;
            } else {
              article.description = rewritten.content;
            }
            rewrittenCount++;
          }
        }

        // ── 3. حفظ في DB ────────────────────────────────────────────
        let categoryId: number | null = null;
        if (article.ai_category_slug) {
          categoryId = await mapApiCategoryToLocalId(article.ai_category_slug);
        }
        if (!categoryId && article.source.default_category_id) {
          categoryId = article.source.default_category_id;
        }

        let geoScopeId: number | null = null;
        if (article.geo_scope_slug) {
          try {
            const geoScope = await GeoScopeService.getBySlug(article.geo_scope_slug);
            if (geoScope) geoScopeId = geoScope.id;
          } catch { /* تجاهل */ }
        }

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

        // ── 4. إنشاء النسخ (projections) للوحدات الإعلامية ──────────
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
          console.warn(`   ⚠️ فشل إنشاء نسخ الوحدات للخبر ${created.id}:`, fanErr instanceof Error ? fanErr.message : fanErr);
        }

        savedCount++;
      } catch (error: any) {
        failedCount++;
        console.error(`   ❌ خطأ: ${error?.message || error}`);
      } finally {
        processedCount++;
        // Progress log كل 20 خبر
        if (processedCount % 20 === 0) {
          console.log(`   📊 ${processedCount}/${articles.length} — ✅${savedCount} | ✍️${rewrittenCount} | ⏭️${skippedCount} | ❌${failedCount}`);
        }
      }
    };

    // ══════════════════════════════════════════════════════════════════════
    // تشغيل Pipeline متوازي — 10 workers بالتوازي
    // كل worker يأخذ الخبر التالي من القائمة ويعالجه كاملاً
    // ══════════════════════════════════════════════════════════════════════
    let currentIndex = 0;

    const worker = async (): Promise<void> => {
      while (true) {
        const index = currentIndex++;
        if (index >= articles.length) break;
        await processOneArticle(articles[index]);
      }
    };

    // إطلاق الـ workers
    const workers = Array.from({ length: Math.min(CONCURRENT_WORKERS, articles.length) }, () => worker());
    await Promise.all(workers);

    // ── ملخص ─────────────────────────────────────────────────────────────
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n   ✅ النتيجة: حفظ ${savedCount} | ✍️ صياغة ${rewrittenCount} | ⏭️ تكرار ${skippedCount} | ❌ فشل ${failedCount} | ⏱️ ${totalTime}s\n`);

    return { totalArticles: articles.length, savedCount, failedCount, rewrittenCount, skippedCount };
  }
}

export const articleSaverService = new ArticleSaverService();
