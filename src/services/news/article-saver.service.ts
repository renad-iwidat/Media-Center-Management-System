/**
 * Article Saver Service
 * حفظ الأخبار الجديدة في الداتابيس — بدون تصنيف AI
 * 
 * المسؤولية: فقط حفظ الأخبار بستيتوس 'fetched'
 * التصنيف والتنظيف والتوجيه = مسؤولية FlowRouterService
 */

import { RawDataService } from '../database/database.service';
import { ArticleToSave } from './rss-pipeline.service';

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
   * - حفظ بستيتوس 'fetched' مع category_id الافتراضي (أو null)
   * - بدون تصنيف AI — التصنيف يصير لاحقاً بمرحلة المعالجة
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
        batch.map((article) => {
          // نستخدم الـ default_category_id إذا موجود، وإلا null
          const categoryId = article.source.default_category_id || null;
          return RawDataService.create({
            source_id: article.source.id,
            source_type_id: article.source.source_type_id,
            category_id: categoryId,
            url: article.link,
            title: article.title,
            content: article.description,
            image_url: article.image_url || '',
            tags: article.tags || [],
            fetch_status: 'fetched',
            pub_date: parsePubDate(article.pubDate),
          });
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled') savedCount++;
        else failedCount++;
      }
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`   ✅ تم حفظ ${savedCount} | ❌ فشل ${failedCount} | ⏱️  ${totalTime}s\n`);

    return { totalArticles: articles.length, savedCount, failedCount };
  }
}

export const articleSaverService = new ArticleSaverService();
