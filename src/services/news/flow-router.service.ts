import { query } from '../../config/database';
import { SystemSettingsService } from '../database/system-settings.service';
import { MediaUnitSourceService } from '../database/media-unit-source.service';
import { MediaUnitArticleService } from '../database/media-unit-article.service';
import { aiClassifierService } from './ai-classifier.service';
import { contentCleanerService } from './content-cleaner.service';

/**
 * FlowRouterService
 * معالجة الأخبار الجديدة (fetched) وتوجيهها للمسار الصحيح
 *
 * قاعدة التوجيه (حسب التصنيف):
 * ─────────────────────────────────────────────
 * سياسي / محلي / دولي  →  editorial (قسم التحرير)
 * اقتصاد / رياضة / صحة / علوم وتكنولوجيا / فن و ثقافة / بيئة / غذاء  →  automated (نشر أوتوماتيكي)
 * ─────────────────────────────────────────────
 *
 * الفلو:
 * 1. تصنيف AI (لكل الأخبار بدون تصنيف)
 * 2. تنظيف النص
 * 3. فحص اكتمال المحتوى
 * 4. التوزيع على كل media_units عبر editorial_queue
 *    - ناقص → status = 'incomplete' (ينتظر المحرر)
 *    - مكتمل + automated → status = 'pending' → 'approved' تلقائياً → published_items
 *    - مكتمل + editorial → status = 'pending' (ينتظر المحرر)
 * 5. تحديث fetch_status
 */

/**
 * ═══════════════════════════════════════════════════════════════════
 * MAP التوجيه — التصنيف هو اللي بيحدد الفلو
 * 
 * editorial = يروح لقسم التحرير (المحرر لازم يوافق)
 * automated = ينشر أوتوماتيكي بدون تدخل المحرر
 * ═══════════════════════════════════════════════════════════════════
 */
/**
 * ═══════════════════════════════════════════════════════════════════
 * توجيه التصنيف → الفلو
 *
 * المصدر الموثوق هو عمود categories.flow بالداتابيس، والذي يُعبّأ عند
 * المزامنة من category-flow.config (المصدر الوحيد للقاعدة بالـ slug).
 *
 * الدالة التالية fallback فقط لو ما توفّر flow بالداتابيس.
 * ═══════════════════════════════════════════════════════════════════
 */

/**
 * الفلو الافتراضي (fallback) — يُستخدم فقط حين لا يتوفر categories.flow
 * بالداتابيس. القيمة الموثوقة دائماً من الداتابيس (تُعبّأ عند المزامنة
 * من category-flow.config).
 *
 * ← 'automated': أي تصنيف غير معروف لم يُمزامن بعد → ينشر تلقائياً
 * (التصنيفات التحريرية مضمونة الوجود في الداتابيس بعد أول مزامنة)
 */
const DEFAULT_FLOW: 'automated' | 'editorial' = 'automated';

export function getFlowByCategory(_categoryId: number | null): 'automated' | 'editorial' {
  return DEFAULT_FLOW;
}

/**
 * source_type_ids الخاصة بالإدخال اليدوي (Manual Input)
 * هذه الأخبار تروح دائماً للمحرر بغض النظر عن فئتها
 * 6 = user_input_text
 * 7 = user_input_audio
 * 8 = user_input_video
 */
const USER_INPUT_SOURCE_TYPE_IDS = new Set([6, 7, 8]);

/** حجم الـ batch للـ AI classifier */
const AI_BATCH_SIZE = 10;

interface RawDataItem {
  id: number;
  source_id: number;
  source_type_id: number;
  category_id: number | null;
  media_unit_id: number | null;
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
  is_active: boolean;
  flow?: string;
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
   * تم رفعه إلى 300 حرف لضمان جودة المحتوى
   */
  private readonly MIN_CONTENT_LENGTH = 300;

  /**
   * content_type_id للأخبار — ثابت = 1
   */
  private readonly NEWS_CONTENT_TYPE_ID = 1;

  /**
   * نشر الأخبار الأوتوماتيكية العالقة في editorial_queue
   * 
   * هذه الدالة تُستدعى دورياً (من الـ scheduler) لضمان عدم بقاء
   * أي خبر أوتوماتيكي مكتمل في قسم التحرير.
   * 
   * تعالج:
   * - أخبار بتصنيف automated + حالة pending + محتوى مكتمل
   * - تنشرها مباشرة بدون انتظار المحرر
   */
  async autoPublishStuckItems(): Promise<{ published: number; errors: number }> {
    let published = 0;
    let errors = 0;

    try {
      // جلب الأخبار الأوتوماتيكية العالقة (pending + مكتملة + غير منشورة)
      // التصنيف الأوتوماتيكي يُحدّد من categories.flow = 'automated' (مستقر بالـ slug)
      const stuckItems = await query(
        `SELECT eq.id as queue_id, eq.media_unit_id, eq.raw_data_id,
                rd.title, rd.content, rd.tags, rd.is_cleaned
         FROM editorial_queue eq
         JOIN raw_data rd ON eq.raw_data_id = rd.id
         JOIN categories c ON rd.category_id = c.id
         WHERE c.flow = 'automated'
           AND eq.status = 'pending'
           AND LENGTH(rd.content) >= $1
           AND NOT EXISTS (
             SELECT 1 FROM published_items pi 
             WHERE pi.raw_data_id = eq.raw_data_id AND pi.media_unit_id = eq.media_unit_id
           )
         ORDER BY eq.created_at ASC
         LIMIT 200`,
        [this.MIN_CONTENT_LENGTH]
      );

      if (stuckItems.rows.length === 0) return { published: 0, errors: 0 };

      console.log(`🔄 [Auto-Publish] وجدنا ${stuckItems.rows.length} خبر أوتوماتيكي عالق — جاري التنظيف والنشر...`);

      for (const item of stuckItems.rows) {
        try {
          // ── تنظيف إلزامي إذا لم يُنظّف بعد ──────────────────────────
          let contentToPublish = item.content;

          if (!item.is_cleaned) {
            const cleaned = await contentCleanerService.cleanContent(item.content, item.raw_data_id);
            if (!cleaned || cleaned.trim().length < 100) {
              console.warn(`  ⚠️ [Auto-Publish] فشل تنظيف الخبر ${item.raw_data_id} — تم تخطيه`);
              errors++;
              continue;
            }
            contentToPublish = cleaned;
            await query(
              `UPDATE raw_data SET content = $1, is_cleaned = true WHERE id = $2`,
              [cleaned, item.raw_data_id]
            );
          }

          // تحديث الحالة إلى approved
          await query(
            `UPDATE editorial_queue SET status = 'approved', updated_at = NOW() WHERE id = $1`,
            [item.queue_id]
          );

          // نشر في published_items
          await query(
            `INSERT INTO published_items 
             (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())`,
            [item.media_unit_id, item.raw_data_id, item.queue_id, this.NEWS_CONTENT_TYPE_ID, item.title, contentToPublish, item.tags || []]
          );

          published++;
        } catch (error) {
          errors++;
          console.error(`  ❌ [Auto-Publish] خطأ في نشر queue_id=${item.queue_id}:`, error);
        }
      }

      if (published > 0) {
        console.log(`✅ [Auto-Publish] تم نشر ${published} خبر أوتوماتيكي (أخطاء: ${errors})`);
      }
    } catch (error) {
      console.error('❌ [Auto-Publish] خطأ عام:', error);
    }

    return { published, errors };
  }

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
      const allMediaUnits = await this.getActiveMediaUnits();

      // ══════════════════════════════════════════════════════════════════════
      // الخطوة 3: معالجة كل خبر
      // ══════════════════════════════════════════════════════════════════════
      console.log(`\n🔀 بدء توجيه ${rawArticles.length} خبر...`);

      // تجميع الأخبار الأوتوماتيكية للتوزيع
      const automatedQueuePending: Array<{ article: RawDataItem; mediaUnits: MediaUnit[] }> = [];

      for (const article of rawArticles) {
        try {
          // ── تحديد الوحدات الإعلامية المستهدفة ─────────────────────────
          // إذا الخبر مربوط بوحدة إعلامية (media_unit_id) → يروح لها فقط
          // إذا لا → يروح لكل الوحدات المرتبطة بمصدره
          // إذا ما في ربط → يروح لكل الوحدات النشطة (fallback)
          let targetMediaUnits: MediaUnit[] = [];

          // ── تجميع الوحدات المستهدفة من كل المصادر الممكنة ────────────────
          // لا نكتفي بالوحدة الصريحة من السحب — بل ندمجها مع كل الوحدات
          // المرتبطة بنفس المصدر حتى يصل الخبر لكل وحدة تشترك في هذا المصدر.
          const unitIdsSeen = new Set<number>();

          // 1. الوحدة الصريحة من السحب (media_unit_id المخزن في raw_data)
          if (article.media_unit_id) {
            const unit = allMediaUnits.find(u => u.id === article.media_unit_id);
            if (unit) {
              targetMediaUnits.push(unit);
              unitIdsSeen.add(unit.id);
            }
          }

          // 2. كل الوحدات المرتبطة بمصدر الخبر (مصدر مشترك → كل الوحدات تأخذ الخبر)
          if (article.source_id) {
            const linkedUnits = await MediaUnitSourceService.getMediaUnitsBySourceId(article.source_id);
            for (const u of linkedUnits) {
              if (!unitIdsSeen.has(u.id)) {
                targetMediaUnits.push({ id: u.id, name: u.name, is_active: u.is_active });
                unitIdsSeen.add(u.id);
              }
            }
          }

          // 3. Fallback: كل الوحدات النشطة (إذا لم يُعثر على أي ربط)
          if (targetMediaUnits.length === 0) {
            targetMediaUnits = allMediaUnits;
          }
          // ── أ. فحص اكتمال المحتوى ─────────────────────────────────────
          const contentLength = (article.content || '').length;
          const hasImage = !!(article.image_url && article.image_url.trim());
          const isComplete = contentLength >= this.MIN_CONTENT_LENGTH && hasImage;

          // تحديث is_incomplete في raw_data
          await this.markAsIncomplete(article.id, !isComplete);

          // ── ب. تحديد نوع الفلو ────────────────────────────────────────
          // الفلو يتحدد من categories.flow بالداتابيس (المصدر الموثوق)
          let flowType: 'automated' | 'editorial' = 'editorial'; // افتراضي

          // الإدخال اليدوي → تحرير إجباري (دائماً)
          if (USER_INPUT_SOURCE_TYPE_IDS.has(article.source_type_id)) {
            flowType = 'editorial';
            console.log(`📝 الخبر ${article.id} — إدخال يدوي → تحرير إجباري`);
          } else if (article.category_id) {
            // تحديد الفلو: أولاً من categories.flow (الداتابيس) → ثانياً من الـ map الثابت
            const category = categoryMap.get(article.category_id);
            if (category?.flow === 'automated' || category?.flow === 'editorial') {
              flowType = category.flow;
            } else {
              flowType = getFlowByCategory(article.category_id);
            }
            const categoryName = category?.name || `ID:${article.category_id}`;
            console.log(`   ${flowType === 'automated' ? '⚡' : '📝'} الخبر ${article.id} — تصنيف: ${categoryName} → ${flowType}`);
          } else {
            // بدون تصنيف → automated (fallback) — يُنشر تلقائياً
            console.warn(`⚠️  الخبر ${article.id} — بدون تصنيف → أوتوماتيك (fallback)`);
            result.errors.push(`الخبر ${article.id}: بدون تصنيف — تم توجيهه أوتوماتيك`);
            flowType = 'automated';
          }

          // ── ج. الأوتوماتيك لا يحتاج تنظيف إضافي ─────────────────────
          // (إعادة الصياغة تمت بمرحلة الحفظ — article-saver)

          // ── د. التوزيع على media_units المستهدفة عبر editorial_queue ──────────
          if (!isComplete) {
            // ⚠️ ناقص → editorial_queue بحالة 'incomplete' لكل يونت
            await this.distributeToQueue(article, targetMediaUnits, 'incomplete');
            result.incompleteCount++;
            console.log(`⚠️  الخبر ${article.id} — ناقص (${contentLength} حرف) → incomplete لـ ${targetMediaUnits.length} وحدة`);
          } else if (flowType === 'automated') {
            // ⚡ أوتوماتيك + مكتمل → يتم التوزيع بعد التنظيف
            automatedQueuePending.push({ article, mediaUnits: targetMediaUnits });
            result.automatedCount++;
          } else {
            // 📝 تحريري + مكتمل → pending (ينتظر المحرر) — بدون تنظيف
            await this.distributeToQueue(article, targetMediaUnits, 'pending');
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
      // الخطوة 4: تنظيف + توزيع ونشر الأخبار الأوتوماتيكية
      // ⚠️ التنظيف إلزامي — لا يُنشر خبر بدون تنظيف ناجح
      // ══════════════════════════════════════════════════════════════════════
      if (automatedQueuePending.length > 0) {
        console.log(`\n⚡ تنظيف وتوزيع ${automatedQueuePending.length} خبر أوتوماتيكي...`);

        for (const { article, mediaUnits: units } of automatedQueuePending) {
          try {
            // ── تنظيف المحتوى (إلزامي) ──────────────────────────────────
            const cleanedContent = await contentCleanerService.cleanContent(article.content, article.id);
            
            // التحقق من نجاح التنظيف: يجب أن يكون المحتوى المنظف مختلفاً أو على الأقل بنفس الطول المعقول
            const cleaningSuccessful = cleanedContent && cleanedContent.trim().length >= 100;
            
            if (!cleaningSuccessful) {
              console.warn(`⚠️ الخبر ${article.id} — فشل التنظيف، لن يُنشر حتى يتم تنظيفه`);
              result.errors.push(`الخبر ${article.id}: فشل التنظيف — لم يُنشر`);
              await this.updateArticleStatus(article.id, 'processed');
              continue;
            }

            // حفظ المحتوى المنظف + تعليمه كمنظف
            await query(
              `UPDATE raw_data SET content = $1, is_cleaned = true WHERE id = $2`,
              [cleanedContent, article.id]
            );
            article.content = cleanedContent;
            console.log(`   🧹 تنظيف: ${article.title.substring(0, 50)}... (${article.content.length} → ${cleanedContent.length})`);

            // ── التوزيع والنشر ───────────────────────────────────────────
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
   * 
   * حماية مزدوجة ضد التكرار:
   * 1. فحص بـ raw_data_id + media_unit_id (نفس المقالة بالضبط)
   * 2. فحص بالعنوان + media_unit_id (نفس الخبر من مصدر مختلف)
   */
  private async distributeToQueue(
    article: RawDataItem,
    mediaUnits: MediaUnit[],
    status: 'pending' | 'incomplete'
  ): Promise<Array<{ queueId: number; mediaUnitId: number }>> {
    const createdItems: Array<{ queueId: number; mediaUnitId: number }> = [];

    for (const unit of mediaUnits) {
      try {
        // التحقق 1: نفس raw_data_id + media_unit_id
        const existsResult = await query(
          `SELECT id FROM editorial_queue WHERE raw_data_id = $1 AND media_unit_id = $2`,
          [article.id, unit.id]
        );
        if (existsResult.rows.length > 0) {
          createdItems.push({ queueId: existsResult.rows[0].id, mediaUnitId: unit.id });
          continue;
        }

        // التحقق 2: نفس العنوان بنفس الوحدة (يمنع التكرار من مصادر مختلفة)
        if (article.title && article.title.trim()) {
          const titleExists = await query(
            `SELECT eq.id FROM editorial_queue eq
             JOIN raw_data rd ON eq.raw_data_id = rd.id
             WHERE eq.media_unit_id = $1 
               AND LOWER(TRIM(rd.title)) = LOWER(TRIM($2))
               AND eq.status NOT IN ('rejected')
             LIMIT 1`,
            [unit.id, article.title]
          );
          if (titleExists.rows.length > 0) {
            createdItems.push({ queueId: titleExists.rows[0].id, mediaUnitId: unit.id });
            continue;
          }
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
   * 
   * التحقق من التكرار: لا ننشر نفس raw_data_id مع نفس media_unit_id مرتين
   */
  private async autoApproveAndPublish(
    article: RawDataItem,
    queueItems: Array<{ queueId: number; mediaUnitId: number }>
  ): Promise<void> {
    for (const { queueId, mediaUnitId } of queueItems) {
      try {
        // ─── التحقق من التكرار ───────────────────────────────────
        // تحقق من وجود نفس raw_data_id مع نفس media_unit_id في published_items
        const existsResult = await query(
          `SELECT id FROM published_items 
           WHERE raw_data_id = $1 AND media_unit_id = $2`,
          [article.id, mediaUnitId]
        );

        if (existsResult.rows.length > 0) {
          console.log(`  ⚠️ الخبر ${article.id} موجود مسبقاً في published_items للوحدة ${mediaUnitId} — تم تجاهل النشر المكرر`);
          continue;
        }

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

        // مزامنة حالة النسخة → published
        try {
          const proj = await MediaUnitArticleService.getResolved(article.id, mediaUnitId);
          if (proj?.id) await MediaUnitArticleService.updateStatus(proj.id, 'published');
        } catch { /* تجاهل */ }
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
        await new Promise(resolve => setTimeout(resolve, 300));
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
