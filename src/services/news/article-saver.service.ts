/**
 * Article Saver Service
 * حفظ الأخبار الجديدة في الداتابيس
 * 
 * المسؤولية: حفظ الأخبار بستيتوس 'fetched'
 * التصنيف والتنظيف والتوجيه = مسؤولية FlowRouterService
 * 
 * يدعم المقالات القادمة من NewsDesk API (مصنفة مسبقاً بالـ AI)
 */

import { RawDataService, CategoryService, GeoScopeService } from '../database/database.service';
import { MediaUnitArticleService } from '../database/media-unit-article.service';
import { ArticleToSave } from './news-pipeline.service';
import { mapApiCategoryToLocalId } from './ai-classifier.service';

export interface ArticleWithSource extends ArticleToSave {}

export interface SaveResult {
  totalArticles: number;
  savedCount: number;
  failedCount: number;
}

/** تحويل pubDate string إلى Date أو null */
function parsePubDate(pubDate: string): Date | null {
  if (!pubDate) return null;
  const d = new Date(pubDate);
  return isNaN(d.getTime()) ? null : d;
}

/** حجم الـ batch لحفظ الداتابيس */
const DB_SAVE_BATCH = 10;

class ArticleSaverService {
  /**
   * حفظ مجموعة من الأخبار في الداتابيس
   * - فحص التكرار بالعنوان/المحتوى
   * - حفظ بستيتوس 'fetched' مع category_id (من AI أو الافتراضي)
   * - المقالات من NewsDesk API تأتي مصنفة مسبقاً — نحاول ربط التصنيف
   */
  async saveArticles(articles: ArticleToSave[]): Promise<SaveResult> {
    if (articles.length === 0) {
      return { totalArticles: 0, savedCount: 0, failedCount: 0 };
    }

    console.log(`\n💾 بدء حفظ ${articles.length} خبر...`);
    const startTime = Date.now();

    // ── المرحلة 1: فحص التكرار بالعنوان/المحتوى (similarity) ─────────────
    const toSave: ArticleToSave[] = [];
    for (const article of articles) {
      const similar = await RawDataService.existsBySimilarity(article.title, article.description);
      if (similar) {
        console.log(`   ⏭️  تخطي (مكرر): ${article.title.substring(0, 50)}`);
      } else {
        toSave.push(article);
      }
    }

    // ── المرحلة 2: حفظ DB بـ batches parallel ────────────────────────────
    let savedCount = 0;
    let failedCount = 0;

    console.log(`   💾 حفظ ${toSave.length} خبر في DB (batches من ${DB_SAVE_BATCH})...`);

    for (let i = 0; i < toSave.length; i += DB_SAVE_BATCH) {
      const batch = toSave.slice(i, i + DB_SAVE_BATCH);

      const results = await Promise.allSettled(
        batch.map(async (article) => {
          // ربط التصنيف: أولاً من الـ API (ai_category_slug) → ثانياً default
          let categoryId: number | null = null;
          
          // أولاً: بحث بالـ slug من الـ API بجدول categories
          if (article.ai_category_slug) {
            categoryId = await mapApiCategoryToLocalId(article.ai_category_slug);
          }
          
          // ثانياً: fallback للـ default_category_id من المصدر
          if (!categoryId && article.source.default_category_id) {
            categoryId = article.source.default_category_id;
          }

          // categoryId يبقى null إذا ما لقى تطابق → FlowRouter بيصنفه بالـ AI المحلي لاحقاً
          // بس الـ category_slug محفوظ بالداتابيس للمرجعية

          // ربط النطاق الجغرافي
          let geoScopeId: number | null = null;
          if (article.geo_scope_slug) {
            try {
              const geoScope = await GeoScopeService.getBySlug(article.geo_scope_slug);
              if (geoScope) geoScopeId = geoScope.id;
            } catch { /* تجاهل */ }
          }

          const created = await RawDataService.create({
            source_id: article.source.id, // مربوط بجدول sources (تم ربطه بالـ pipeline)
            source_type_id: article.source.source_type_id,
            category_id: categoryId,
            geo_scope_id: geoScopeId,
            url: article.link,
            title: article.title,
            content: article.full_text || article.description, // النص الكامل (أو الملخص إذا ما في نص كامل)
            image_url: article.image_url || '',
            tags: article.tags || [],
            fetch_status: 'fetched',
            pub_date: parsePubDate(article.pubDate),
            // ── الحقول الجديدة ──────────────────────────────
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

          // ── إنشاء النسخ (projections) للوحدات الإعلامية ──────────────
          // الخبر الأصلي اتخزن مرة وحدة في raw_data؛ هلق منعمل نسخة لكل
          // وحدة مرتبطة بالمصدر (أو الوحدة اللي سحبت الخبر) — بدون تكرار المحتوى.
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

          return created;
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') savedCount++;
        else {
          failedCount++;
          console.log(`   ❌ خطأ حفظ: ${r.reason?.message || r.reason}`);
        }
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ تم حفظ ${savedCount} | ❌ فشل ${failedCount} | ⏱️  ${totalTime}s\n`);

    return { totalArticles: articles.length, savedCount, failedCount };
  }
}

export const articleSaverService = new ArticleSaverService();
