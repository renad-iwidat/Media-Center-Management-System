import { query } from '../../config/database';

/**
 * FlowRouterService
 * توجيه الأخبار للمسار الصحيح (أوتوماتيكي أو تحريري)
 */

interface RawDataItem {
  id: number;
  source_id: number;
  source_type_id: number;
  category_id: number;
  url: string;
  title: string;
  content: string;
  image_url: string;
  tags: string[];
  fetch_status: string;
}

interface Category {
  id: number;
  name: string;
  flow: 'automated' | 'editorial';
  is_active: boolean;
}

interface MediaUnit {
  id: number;
  name: string;
  is_active: boolean;
}

interface FlowRoutingResult {
  success: boolean;
  message: string;
  processedCount: number;
  automatedCount: number;
  editorialCount: number;
  errors: string[];
}

export class FlowRouterService {
  /**
   * الحد الأدنى لطول المحتوى عشان يدخل الفلو (بالأحرف)
   * الأخبار الأقصر من هيك تبقى بحالة fetched وتظهر بتاب "أخبار ناقصة"
   */
  private readonly MIN_CONTENT_LENGTH = 150;

  /**
   * معالجة جميع الأخبار الجديدة وتوجيهها للمسار الصحيح
   */
  async processNewArticles(): Promise<FlowRoutingResult> {
    const result: FlowRoutingResult = {
      success: true,
      message: '',
      processedCount: 0,
      automatedCount: 0,
      editorialCount: 0,
      errors: [],
    };

    try {
      // 1. جلب جميع الأخبار الجديدة (fetch_status = 'fetched')
      const rawArticles = await this.getNewArticles();
      console.log(`📰 وجدنا ${rawArticles.length} خبر جديد`);

      if (rawArticles.length === 0) {
        result.message = 'لا توجد أخبار جديدة للمعالجة';
        return result;
      }

      // 2. جلب جميع الفئات النشطة
      const categories = await this.getActiveCategories();
      const categoryMap = new Map(categories.map(c => [c.id, c]));

      // 3. جلب جميع وحدات الإعلام النشطة
      const mediaUnits = await this.getActiveMediaUnits();

      // 4. معالجة كل خبر
      let skippedIncomplete = 0;
      for (const article of rawArticles) {
        try {
          // فلتر: الأخبار الناقصة ما تدخل الفلو
          const contentLength = (article.content || '').length;
          if (contentLength < this.MIN_CONTENT_LENGTH) {
            skippedIncomplete++;
            console.log(`⏭️ تخطي الخبر ${article.id} — محتوى ناقص (${contentLength} حرف)`);
            continue;
          }

          const category = categoryMap.get(article.category_id);

          if (!category) {
            result.errors.push(`الخبر ${article.id}: فئة غير موجودة`);
            continue;
          }

          // تحديد المسار بناءً على flow
          if (category.flow === 'automated') {
            // مسار أوتوماتيكي
            await this.routeToAutomated(article, mediaUnits);
            result.automatedCount++;
          } else if (category.flow === 'editorial') {
            // مسار تحريري
            await this.routeToEditorial(article, mediaUnits);
            result.editorialCount++;
          }

          // تحديث حالة الخبر إلى 'processed'
          await this.updateArticleStatus(article.id, 'processed');
          result.processedCount++;

          console.log(`✅ تم معالجة الخبر: ${article.title}`);
        } catch (error) {
          result.errors.push(`خطأ في معالجة الخبر ${article.id}: ${error}`);
          console.error(`❌ خطأ في الخبر ${article.id}:`, error);
        }
      }

      if (skippedIncomplete > 0) {
        console.log(`⏭️ تم تخطي ${skippedIncomplete} خبر ناقص — يظهرون بتاب "أخبار ناقصة"`);
      }

      result.message = `تمت معالجة ${result.processedCount} خبر بنجاح` +
        (skippedIncomplete > 0 ? ` | تم تخطي ${skippedIncomplete} خبر ناقص` : '');
      return result;
    } catch (error) {
      result.success = false;
      result.message = `خطأ في معالجة الأخبار: ${error}`;
      console.error('❌ خطأ في FlowRouterService:', error);
      return result;
    }
  }

  /**
   * جلب الأخبار الجديدة (fetch_status = 'fetched')
   */
  private async getNewArticles(): Promise<RawDataItem[]> {
    const result = await query(
      `SELECT * FROM raw_data 
       WHERE fetch_status = 'fetched' 
       ORDER BY fetched_at ASC`
    );
    return result.rows;
  }

  /**
   * جلب الفئات النشطة
   */
  private async getActiveCategories(): Promise<Category[]> {
    const result = await query(
      `SELECT id, name, flow, is_active FROM categories 
       WHERE is_active = true`
    );
    return result.rows;
  }

  /**
   * جلب وحدات الإعلام النشطة
   */
  private async getActiveMediaUnits(): Promise<MediaUnit[]> {
    const result = await query(
      `SELECT id, name, is_active FROM media_units 
       WHERE is_active = true`
    );
    return result.rows;
  }

  /**
   * content_type_id للأخبار — ثابت = 1
   */
  private readonly NEWS_CONTENT_TYPE_ID = 1;

  /**
   * توجيه الخبر للمسار الأوتوماتيكي
   * ينشر مباشرة في published_items
   */
  private async routeToAutomated(
    article: RawDataItem,
    mediaUnits: MediaUnit[]
  ): Promise<void> {
    console.log(`🚀 توجيه الخبر "${article.title}" للمسار الأوتوماتيكي`);

    const contentTypeId = this.NEWS_CONTENT_TYPE_ID;

    // نشر الخبر لكل وحدة إعلام نشطة
    for (const unit of mediaUnits) {
      try {
        await query(
          `INSERT INTO published_items 
           (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
           VALUES ($1, $2, NULL, $3, $4, $5, $6, true, NOW())`,
          [
            unit.id,
            article.id,
            contentTypeId,
            article.title,
            article.content,
            article.tags,
          ]
        );
        console.log(`  ✅ نُشر في وحدة: ${unit.name}`);
      } catch (error) {
        console.error(`  ❌ خطأ في نشر الخبر في ${unit.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * توجيه الخبر لمسار التحرير
   * يُرسل إلى editorial_queue بانتظار المحرر
   */
  private async routeToEditorial(
    article: RawDataItem,
    mediaUnits: MediaUnit[]
  ): Promise<void> {
    console.log(`📝 توجيه الخبر "${article.title}" لمسار التحرير`);

    // إرسال الخبر لكل وحدة إعلام نشطة
    for (const unit of mediaUnits) {
      try {
        await query(
          `INSERT INTO editorial_queue 
           (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
           VALUES ($1, $2, NULL, 'pending', NOW(), NOW())`,
          [unit.id, article.id]
        );
        console.log(`  ✅ أُضيف إلى طابور التحرير: ${unit.name}`);
      } catch (error) {
        console.error(`  ❌ خطأ في إضافة الخبر لطابور ${unit.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * تحديث حالة الخبر
   */
  private async updateArticleStatus(
    articleId: number,
    status: string
  ): Promise<void> {
    await query(
      `UPDATE raw_data 
       SET fetch_status = $1 
       WHERE id = $2`,
      [status, articleId]
    );
  }
}

export default new FlowRouterService();
