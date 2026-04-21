import { query } from '../../config/database';
import { SystemSettingsService } from '../database/system-settings.service';
import { contentCleanerService } from './content-cleaner.service';
import { aiClassifierService } from './ai-classifier.service';

/**
 * FlowRouterService
 * معالجة الأخبار الجديدة (fetched) وتوجيهها للمسار الصحيح
 *
 * الفلو الجديد — كل الأخبار تمر عبر editorial_queue:
 * 1. تصنيف AI (لكل الأخبار بدون تصنيف)
 * 2. تنظيف النص
 * 3. فحص اكتمال المحتوى
 * 4. التوزيع على كل media_units النشطة عبر editorial_queue
 *    - ناقص → status = 'incomplete' (ينتظر المحرر)
 *    - مكتمل + automated → status = 'pending' → 'approved' تلقائياً → published_items
 *    - مكتمل + editorial → status = 'pending' (ينتظر المحرر)
 * 5. تحديث fetch_status
 */

/**
 * source_type_ids الخاصة بالإدخال اليدوي (Manual Input)
 * هذه الأخبار تروح دائماً للمحرر بغض النظر عن فئتها
 * 6 = user_input_text
 * 7 = user_input_audio
 * 8 = user_input_video
 */
const USER_INPUT_SOURCE_TYPE_IDS = new Set([6, 7, 8]);

/** حجم الـ batch للـ AI classifier */
const AI_BATCH_SIZE = 3;

interface RawDataItem {
  id: number;
  source_id: number;
  source_type_id: number;
  category_id: number | null;
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
  incompleteCount: number;
  classifiedCount: number;
  errors: string[];
}

export class FlowRouterService {
  /**
   * الحد الأدنى لطول المحتوى عشان يعتبر مكتمل (بالأحرف)
   */
  private readonly MIN_CONTENT_LENGTH = 100;

  /**
   * content_type_id للأخبار — ثابت = 1
   */
  private readonly NEWS_CONTENT_TYPE_ID = 1;

  /**
   * معالجة جميع الأخبار الجديدة (fetched)
   *
   * الترتيب:
   * 1. تصنيف AI لكل الأخبار بدون category_id
   * 2. لكل خبر:
   *    أ. تنظيف النص
   *    ب. فحص اكتمال المحتوى
   *    ج. التوزيع على كل media_units عبر editorial_queue
   *    د. إذا automated + مكتمل → auto-approve → published_items
   *    هـ. تحديث fetch_status → 'processed'
   */
  async processNewArticles(): Promise<FlowRoutingResult> {
    const result: FlowRoutingResult = {
      success: true,
      message: '',
      processedCount: 0,
      automatedCount: 0,
      editorialCount: 0,
      incompleteCount: 0,
      classifiedCount: 0,
      errors: [],
    };

    try {
      // التحقق من إعداد الفلو قبل التشغيل
      const flowEnabled = await SystemSettingsService.getBoolean('flow_enabled', true);
      if (!flowEnabled) {
        console.log('⏸️  فلو التوجيه متوقف (flow_enabled = false)');
        result.message = 'فلو التوجيه متوقف من إعدادات النظام';
        return result;
      }

      // جلب جميع الأخبار الجديدة (fetch_status = 'fetched')
      const rawArticles = await this.getNewArticles();
      console.log(`📰 وجدنا ${rawArticles.length} خبر جديد للمعالجة`);

      if (rawArticles.length === 0) {
        result.message = 'لا توجد أخبار جديدة للمعالجة';
        return result;
      }

      // ══════════════════════════════════════════════════════════════════════
      // الخطوة 1: تصنيف AI لكل الأخبار بدون category_id
      // ══════════════════════════════════════════════════════════════════════
      const classifierEnabled = await SystemSettingsService.getBoolean('classifier_enabled', true);
      const needsClassification = rawArticles.filter(a => !a.category_id);

      if (needsClassification.length > 0) {
        if (classifierEnabled) {
          console.log(`\n🤖 تصنيف ${needsClassification.length} خبر بدون تصنيف...`);
          await this.classifyArticles(needsClassification);
          result.classifiedCount = needsClassification.length;
          console.log(`   ✅ انتهى التصنيف`);
        } else {
          // المصنف متوقف → fallback محلي لكل الأخبار بدون تصنيف
          console.log(`⏸️  التصنيف متوقف — ${needsClassification.length} خبر سيأخذ تصنيف محلي (fallback)`);
          for (const article of needsClassification) {
            await this.updateArticleCategory(article.id, 1);
            article.category_id = 1;
          }
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الخطوة 2: جلب الفئات ووحدات الإعلام
      // ══════════════════════════════════════════════════════════════════════
      const categories = await this.getActiveCategories();
      const categoryMap = new Map(categories.map(c => [c.id, c]));
      const mediaUnits = await this.getActiveMediaUnits();

      // ══════════════════════════════════════════════════════════════════════
      // الخطوة 3: معالجة كل خبر
      // ══════════════════════════════════════════════════════════════════════
      console.log(`\n🔀 بدء توجيه ${rawArticles.length} خبر...`);

      // تجميع الأخبار الأوتوماتيكية للتنظيف بالتوازي
      const automatedToClean: RawDataItem[] = [];
      const automatedQueuePending: Array<{ article: RawDataItem; mediaUnits: MediaUnit[] }> = [];

      for (const article of rawArticles) {
        try {
          // ── أ. فحص اكتمال المحتوى ─────────────────────────────────────
          const contentLength = (article.content || '').length;
          const isComplete = contentLength >= this.MIN_CONTENT_LENGTH;

          // تحديث is_incomplete في raw_data
          await this.markAsIncomplete(article.id, !isComplete);

          // ── ب. تحديد نوع الفلو ────────────────────────────────────────
          const category = article.category_id ? categoryMap.get(article.category_id) : null;
          let flowType: 'automated' | 'editorial' = 'editorial'; // افتراضي

          // الإدخال اليدوي → تحرير إجباري
          if (USER_INPUT_SOURCE_TYPE_IDS.has(article.source_type_id)) {
            flowType = 'editorial';
          } else if (category) {
            flowType = category.flow;
          } else {
            // تصنيف غير موجود → تحرير (fallback)
            console.warn(`⚠️  الخبر ${article.id} — تصنيف غير موجود (id=${article.category_id}) → تحرير (fallback)`);
            result.errors.push(`الخبر ${article.id}: تصنيف غير موجود — تم توجيهه للتحرير`);
          }

          // ── ج. تنظيف النص — فقط للأوتوماتيك ───────────────────────────
          if (flowType === 'automated' && isComplete) {
            // التنظيف يتم لاحقاً بالتوازي (batch) بعد تجميع كل الأخبار الأوتوماتيكية
            automatedToClean.push(article);
          }

          // ── د. التوزيع على كل media_units عبر editorial_queue ──────────
          if (!isComplete) {
            // ⚠️ ناقص → editorial_queue بحالة 'incomplete' لكل يونت
            await this.distributeToQueue(article, mediaUnits, 'incomplete');
            result.incompleteCount++;
            console.log(`⚠️  الخبر ${article.id} — ناقص (${contentLength} حرف) → incomplete لكل اليونتات`);
          } else if (flowType === 'automated') {
            // ⚡ أوتوماتيك + مكتمل → يتم التوزيع بعد التنظيف
            automatedQueuePending.push({ article, mediaUnits });
            result.automatedCount++;
          } else {
            // 📝 تحريري + مكتمل → pending (ينتظر المحرر) — بدون تنظيف
            await this.distributeToQueue(article, mediaUnits, 'pending');
            result.editorialCount++;
            console.log(`   📝 تحرير: ${article.title.substring(0, 60)}`);
          }

          // ── هـ. تحديث fetch_status (الأوتوماتيك يتحدث لاحقاً بعد التنظيف)
          if (flowType !== 'automated' || !isComplete) {
            await this.updateArticleStatus(article.id, 'processed');
          }

          result.processedCount++;
        } catch (error) {
          result.errors.push(`خطأ في معالجة الخبر ${article.id}: ${error}`);
          console.error(`❌ خطأ في الخبر ${article.id}:`, error);
          // نحطه processed عشان ما يتكرر في الدورة القادمة
          try { await this.updateArticleStatus(article.id, 'processed'); } catch {}
        }
      }

      // ══════════════════════════════════════════════════════════════════════
      // الخطوة 4: تنظيف الأخبار الأوتوماتيكية بالتوازي ثم توزيعها
      // ══════════════════════════════════════════════════════════════════════
      if (automatedToClean.length > 0) {
        console.log(`\n🧹 تنظيف ${automatedToClean.length} خبر أوتوماتيكي بالتوازي...`);

        // تنظيف بالتوازي — كل الأخبار سوا
        const cleanResults = await Promise.allSettled(
          automatedToClean.map(article =>
            contentCleanerService.cleanContent(article.content, article.id)
          )
        );

        // تحديث المحتوى المنظف في الذاكرة والداتابيس
        for (let i = 0; i < automatedToClean.length; i++) {
          const article = automatedToClean[i];
          const cleanResult = cleanResults[i];
          if (cleanResult.status === 'fulfilled' && cleanResult.value !== article.content) {
            await query(`UPDATE raw_data SET content = $1 WHERE id = $2`, [cleanResult.value, article.id]);
            article.content = cleanResult.value;
          }
        }

        console.log(`   ✅ انتهى التنظيف`);

        // التوزيع والنشر بعد التنظيف
        for (const { article, mediaUnits: units } of automatedQueuePending) {
          try {
            const queueIds = await this.distributeToQueue(article, units, 'pending');
            await this.autoApproveAndPublish(article, queueIds);
            await this.updateArticleStatus(article.id, 'published');
            console.log(`   ⚡ أوتو: ${article.title.substring(0, 60)}`);
          } catch (error) {
            result.errors.push(`خطأ في نشر الخبر الأوتوماتيكي ${article.id}: ${error}`);
            console.error(`❌ خطأ في نشر الخبر ${article.id}:`, error);
            try { await this.updateArticleStatus(article.id, 'processed'); } catch {}
          }
        }
      }

      // ملخص
      const summary = [
        `معالجة: ${result.processedCount}`,
        result.classifiedCount > 0 ? `تصنيف: ${result.classifiedCount}` : '',
        result.automatedCount > 0 ? `أوتو: ${result.automatedCount}` : '',
        result.editorialCount > 0 ? `تحرير: ${result.editorialCount}` : '',
        result.incompleteCount > 0 ? `ناقص: ${result.incompleteCount}` : '',
        result.errors.length > 0 ? `أخطاء: ${result.errors.length}` : '',
      ].filter(Boolean).join(' | ');

      result.message = summary;
      console.log(`\n✅ انتهى الفلو — ${summary}`);
      return result;

    } catch (error) {
      result.success = false;
      result.message = `خطأ في معالجة الأخبار: ${error}`;
      console.error('❌ خطأ في FlowRouterService:', error);
      return result;
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // التوزيع على media_units
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * توزيع الخبر على كل media_units النشطة عبر editorial_queue
   * يرجع array من queue IDs اللي تم إنشاؤها
   */
  private async distributeToQueue(
    article: RawDataItem,
    mediaUnits: MediaUnit[],
    status: 'pending' | 'incomplete'
  ): Promise<Array<{ queueId: number; mediaUnitId: number }>> {
    const createdItems: Array<{ queueId: number; mediaUnitId: number }> = [];

    for (const unit of mediaUnits) {
      try {
        // التحقق من عدم وجود سجل مسبق
        const existsResult = await query(
          `SELECT id FROM editorial_queue WHERE raw_data_id = $1 AND media_unit_id = $2`,
          [article.id, unit.id]
        );
        if (existsResult.rows.length > 0) {
          createdItems.push({ queueId: existsResult.rows[0].id, mediaUnitId: unit.id });
          continue;
        }

        const insertResult = await query(
          `INSERT INTO editorial_queue 
           (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
           VALUES ($1, $2, NULL, $3, NOW(), NOW())
           RETURNING id`,
          [unit.id, article.id, status]
        );
        createdItems.push({ queueId: insertResult.rows[0].id, mediaUnitId: unit.id });
      } catch (error) {
        console.error(`  ❌ خطأ في إضافة الخبر لطابور ${unit.name}:`, error);
        throw error;
      }
    }

    return createdItems;
  }

  /**
   * Auto-approve للأخبار الأوتوماتيكية المكتملة
   * يحدّث الحالة من pending → approved وينشر في published_items
   */
  private async autoApproveAndPublish(
    article: RawDataItem,
    queueItems: Array<{ queueId: number; mediaUnitId: number }>
  ): Promise<void> {
    for (const { queueId, mediaUnitId } of queueItems) {
      try {
        // تحديث الحالة إلى approved
        await query(
          `UPDATE editorial_queue SET status = 'approved', updated_at = NOW() WHERE id = $1`,
          [queueId]
        );

        // نشر في published_items مع queue_id
        await query(
          `INSERT INTO published_items 
           (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())`,
          [mediaUnitId, article.id, queueId, this.NEWS_CONTENT_TYPE_ID, article.title, article.content, article.tags]
        );
      } catch (error) {
        console.error(`  ❌ خطأ في auto-approve للخبر ${article.id} في يونت ${mediaUnitId}:`, error);
        throw error;
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // تصنيف AI
  // ════════════════════════════════════════════════════════════════════════════

  /**
   * تصنيف مجموعة أخبار بالـ AI — batches متسلسلة مع delay
   * يحدّث category_id في الداتابيس وفي الذاكرة
   */
  private async classifyArticles(articles: RawDataItem[]): Promise<void> {
    const totalBatches = Math.ceil(articles.length / AI_BATCH_SIZE);
    
    for (let i = 0; i < articles.length; i += AI_BATCH_SIZE) {
      const batch = articles.slice(i, i + AI_BATCH_SIZE);
      const batchNum = Math.floor(i / AI_BATCH_SIZE) + 1;
      console.log(`   🤖 AI batch ${batchNum}/${totalBatches} (${batch.length} خبر سوا)...`);

      // تصنيف الـ batch كله بالتوازي
      const classifyResults = await Promise.allSettled(
        batch.map(a => aiClassifierService.classifyArticle(a.title, a.content))
      );

      // تحديث الداتابيس والذاكرة
      await Promise.allSettled(
        batch.map(async (article, j) => {
          const r = classifyResults[j];
          let categoryId: number | null;
          let categoryName: string;

          if (r.status === 'fulfilled' && r.value.confidence) {
            categoryId = r.value.categoryId;
            categoryName = r.value.category;
          } else if (r.status === 'fulfilled' && !r.value.confidence) {
            categoryId = null;
            categoryName = 'غير مصنف (fallback - خطأ اتصال)';
          } else {
            categoryId = null;
            categoryName = 'غير مصنف (fallback - rejected)';
          }

          await this.updateArticleCategory(article.id, categoryId);
          article.category_id = categoryId;

          console.log(`   ✅ ${article.title.substring(0, 50)} → ${categoryName}`);
        })
      );

      // Delay بين الـ batches
      if (batchNum < totalBatches) {
        console.log(`   ⏸️  انتظار 1 ثانية قبل الـ batch التالي...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // جلب البيانات
  // ════════════════════════════════════════════════════════════════════════════

  private async getNewArticles(): Promise<RawDataItem[]> {
    const result = await query(
      `SELECT * FROM raw_data
       WHERE fetch_status = 'fetched' 
       ORDER BY fetched_at ASC`
    );
    return result.rows;
  }

  private async getActiveCategories(): Promise<Category[]> {
    const result = await query(
      `SELECT id, name, flow, is_active FROM categories WHERE is_active = true`
    );
    return result.rows;
  }

  private async getActiveMediaUnits(): Promise<MediaUnit[]> {
    const result = await query(
      `SELECT id, name, is_active FROM media_units WHERE is_active = true`
    );
    return result.rows;
  }

  // ════════════════════════════════════════════════════════════════════════════
  // تحديث الداتابيس
  // ════════════════════════════════════════════════════════════════════════════

  private async updateArticleStatus(articleId: number, status: string): Promise<void> {
    await query(`UPDATE raw_data SET fetch_status = $1 WHERE id = $2`, [status, articleId]);
  }

  private async updateArticleCategory(articleId: number, categoryId: number | null): Promise<void> {
    await query(`UPDATE raw_data SET category_id = $1 WHERE id = $2`, [categoryId, articleId]);
  }

  /**
   * تحديث flag الأخبار الناقصة
   */
  private async markAsIncomplete(articleId: number, isIncomplete: boolean): Promise<void> {
    await query(
      `UPDATE raw_data SET is_incomplete = $1 WHERE id = $2`,
      [isIncomplete, articleId]
    );
  }
}

export default new FlowRouterService();
