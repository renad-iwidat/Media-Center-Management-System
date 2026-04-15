/**
 * Article Saver Service
 * خدمة حفظ الأخبار في قاعدة البيانات
 */

import { RawDataService } from '../database/database.service';
import { aiClassifierService } from './ai-classifier.service';

/**
 * واجهة لخبر RSS مع المصدر
 */
export interface ArticleWithSource {
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
}

/**
 * واجهة لنتيجة الحفظ
 */
export interface SaveResult {
  totalArticles: number;
  savedCount: number;
  failedCount: number;
  details: Array<{
    title: string;
    url: string;
    categoryId: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * فئة Article Saver Service
 */
class ArticleSaverService {
  /**
   * حفظ مقالة واحدة
   */
  async saveArticle(article: ArticleWithSource): Promise<boolean> {
    try {
      // تحديد التصنيف
      let categoryId = article.source.default_category_id;

      // إذا لم يكن للمصدر تصنيف افتراضي، استخدم AI
      if (!categoryId) {
        const classification = await aiClassifierService.classifyArticle(
          article.title,
          article.description
        );
        categoryId = classification.categoryId;
      }

      // حفظ في قاعدة البيانات
      await RawDataService.create({
        source_id: article.source.id,
        source_type_id: article.source.source_type_id,
        category_id: categoryId,
        url: article.link,
        title: article.title,
        content: article.description,
        image_url: '',
        tags: [],
        fetch_status: 'fetched',
      });

      return true;
    } catch (error) {
      console.error('❌ خطأ في حفظ المقالة:', error);
      return false;
    }
  }

  /**
   * حفظ مجموعة من المقالات مع التصنيف الآلي
   */
  async saveArticles(articles: ArticleWithSource[]): Promise<SaveResult> {
    const details: SaveResult['details'] = [];
    let savedCount = 0;
    let failedCount = 0;

    console.log(`📰 بدء حفظ ${articles.length} خبر...`);

    for (const article of articles) {
      try {
        // التحقق من وجود الخبر
        const exists = await RawDataService.existsByUrl(article.link);
        if (exists) {
          console.log(`⏭️  تخطي: ${article.title} (موجود بالفعل)`);
          continue;
        }

        // تحديد التصنيف
        let categoryId = article.source.default_category_id;
        let classificationMethod = 'default';

        // إذا لم يكن للمصدر تصنيف افتراضي، استخدم AI
        if (!categoryId) {
          console.log(`   🤖 تصنيف: ${article.title.substring(0, 50)}...`);
          const classification = await aiClassifierService.classifyArticle(
            article.title,
            article.description
          );
          categoryId = classification.categoryId;
          classificationMethod = `ai (${classification.category})`;
        }

        // حفظ في قاعدة البيانات
        await RawDataService.create({
          source_id: article.source.id,
          source_type_id: article.source.source_type_id,
          category_id: categoryId,
          url: article.link,
          title: article.title,
          content: article.description,
          image_url: article.image_url || '',
          tags: article.tags || [],
          fetch_status: 'fetched',
        });

        details.push({
          title: article.title,
          url: article.link,
          categoryId,
          success: true,
        });

        savedCount++;
        console.log(
          `✅ تم حفظ: ${article.title.substring(0, 50)}... (${classificationMethod})`
        );
      } catch (error) {
        failedCount++;
        const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';

        details.push({
          title: article.title,
          url: article.link,
          categoryId: 0,
          success: false,
          error: errorMessage,
        });

        console.error(`❌ فشل حفظ: ${article.title} - ${errorMessage}`);
      }
    }

    return {
      totalArticles: articles.length,
      savedCount,
      failedCount,
      details,
    };
  }
}

// تصدير instance واحد من الخدمة
export const articleSaverService = new ArticleSaverService();
