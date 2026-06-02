/**
 * Scheduler Service
 * خدمة جدولة سحب ومعالجة الأخبار
 *
 * المراحل:
 * 1. سحب + حفظ (fetch & store) → ستيتوس 'fetched'
 * 2. معالجة (تصنيف + فحص اكتمال + تنظيف + توجيه) → ستيتوس 'processed' أو 'published'
 */

import { newsPipelineService } from './news-pipeline.service';
import { articleSaverService } from './article-saver.service';
import FlowRouterService from './flow-router.service';
import { SystemSettingsService } from '../database/system-settings.service';
import { autoPublishService } from './auto-publish.service';

/**
 * واجهة لحالة الـ scheduler
 */
export interface SchedulerStatus {
  isRunning: boolean;
  lastRun?: Date;
  nextRun?: Date;
  totalRuns: number;
  errors: number;
}

/**
 * فئة Scheduler Service
 */
class SchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private currentIntervalMinutes: number = 5;
  private isJobRunning: boolean = false; // 🔒 منع التشغيل المتوازي
  private status: SchedulerStatus = {
    isRunning: false,
    totalRuns: 0,
    errors: 0,
  };

  /**
   * بدء الـ scheduler
   * يقرأ الـ interval من الداتابيس — لو ما لقاه يستخدم القيمة الممررة
   */
  async start(fallbackIntervalMinutes: number = 15): Promise<void> {
    if (this.status.isRunning) {
      console.log('⚠️  الـ scheduler يعمل بالفعل');
      return;
    }

    // قراءة الـ interval من الداتابيس
    const intervalMinutes = await SystemSettingsService.getNumber(
      'scheduler_interval_minutes',
      fallbackIntervalMinutes
    );
    this.currentIntervalMinutes = intervalMinutes;

    console.log(`🚀 بدء الـ scheduler - كل ${intervalMinutes} دقيقة (من الداتابيس)`);
    this.status.isRunning = true;

    // تشغيل أول مرة بـ background (بدون await)
    this.runJob().catch((err) => {
      console.error('❌ خطأ في أول دورة:', err);
    });

    // جدولة الدورات التالية — كل دورة تقرأ الـ interval من جديد
    this.scheduleNext();

    console.log(`✅ الـ scheduler بدأ العمل\n`);
  }

  /**
   * جدولة الدورة التالية بعد قراءة الـ interval من الداتابيس
   */
  private scheduleNext(): void {
    if (!this.status.isRunning) return;

    // قراءة الـ interval من الداتابيس قبل كل دورة
    SystemSettingsService.getNumber('scheduler_interval_minutes', this.currentIntervalMinutes)
      .then((intervalMinutes) => {
        if (intervalMinutes !== this.currentIntervalMinutes) {
          console.log(`🔄 تغيّر الـ interval: ${this.currentIntervalMinutes} → ${intervalMinutes} دقيقة`);
          this.currentIntervalMinutes = intervalMinutes;
        }

        const intervalMs = intervalMinutes * 60 * 1000;
        this.status.nextRun = new Date(Date.now() + intervalMs);

        this.intervalId = setTimeout(async () => {
          await this.runJob();
          this.scheduleNext(); // جدولة الدورة التالية بعد الانتهاء
        }, intervalMs);
      })
      .catch((err) => {
        console.error('❌ خطأ في قراءة الـ interval:', err);
        // fallback: استخدم الـ interval الحالي
        const intervalMs = this.currentIntervalMinutes * 60 * 1000;
        this.intervalId = setTimeout(async () => {
          await this.runJob();
          this.scheduleNext();
        }, intervalMs);
      });
  }

  /**
   * إيقاف الـ scheduler
   */
  stop(): void {
    if (!this.status.isRunning) {
      console.log('⚠️  الـ scheduler لا يعمل');
      return;
    }

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }

    this.status.isRunning = false;
    console.log('⏹️  تم إيقاف الـ scheduler');
  }

  /**
   * إعادة تشغيل الـ scheduler (لتطبيق التغييرات فوراً)
   */
  async restart(): Promise<void> {
    console.log('🔄 إعادة تشغيل الـ scheduler...');
    this.stop();
    await this.start();
    console.log('✅ تم إعادة تشغيل الـ scheduler بنجاح');
  }

  /**
   * تشغيل المهمة الكاملة: سحب + حفظ → معالجة + توجيه
   */
  private async runJob(): Promise<void> {
    // 🔒 منع التشغيل المتوازي — لو دورة سابقة لسا شغالة، تخطي
    if (this.isJobRunning) {
      console.log('⚠️  دورة سابقة لا تزال تعمل — تخطي هذه الدورة لتجنب التعارض');
      return;
    }

    this.isJobRunning = true;

    try {
      const now = new Date();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`⏰ تشغيل المهمة في: ${now.toLocaleString('ar-SA')}`);
      console.log(`${'='.repeat(80)}\n`);

      // ══════════════════════════════════════════════════════════════════════
      // المرحلة 1: سحب + حفظ (Fetch & Store)
      // الأخبار تتخزن بستيتوس 'fetched' بدون تصنيف أو تنظيف
      // ══════════════════════════════════════════════════════════════════════
      const schedulerEnabled = await SystemSettingsService.getBoolean('scheduler_enabled', true);
      if (!schedulerEnabled) {
        console.log('⏸️  السحب التلقائي متوقف (scheduler_enabled = false) — تخطي هذه الدورة');
        this.status.lastRun = now;
        return;
      }

      const articlesPerSource = await SystemSettingsService.getNumber('articles_per_source', 20);
      console.log(`📰 حجم الصفحة: ${articlesPerSource} مقالة (من الداتابيس)`);

      // ══════════════════════════════════════════════════════════════════════
      // المرحلة 0: مزامنة الوحدات الإعلامية والمصادر والتصنيفات من الـ API
      // ══════════════════════════════════════════════════════════════════════
      console.log('\n🔄 المرحلة 0: مزامنة الوحدات والمصادر والتصنيفات...');
      try {
        await this.syncFromExternalApi();
      } catch (syncError) {
        console.error('⚠️  فشلت المزامنة (تتابع عملية السحب):', syncError instanceof Error ? syncError.message : syncError);
      }

      console.log('\n📡 المرحلة 1: سحب الأخبار وحفظها...');
      const pipelineResult = await newsPipelineService.runPipeline(articlesPerSource);
      console.log(`   ✅ ${pipelineResult.newArticles.length} خبر جديد`);

      if (pipelineResult.newArticles.length > 0) {
        console.log('\n💾 حفظ الأخبار الجديدة...');
        const saveResult = await articleSaverService.saveArticles(pipelineResult.newArticles);
        console.log(`   ✅ تم حفظ ${saveResult.savedCount} خبر بستيتوس fetched`);
      } else {
        console.log('\n✅ لا توجد أخبار جديدة للحفظ');
      }

      // ══════════════════════════════════════════════════════════════════════
      // المرحلة 2: معالجة (Process)
      // تصنيف AI + فحص اكتمال + تنظيف + توجيه
      // الأخبار تتحول من 'fetched' إلى 'processed' أو 'published'
      // ══════════════════════════════════════════════════════════════════════
      const flowEnabled = await SystemSettingsService.getBoolean('flow_enabled', true);
      if (flowEnabled) {
        console.log('\n🔀 المرحلة 2: معالجة وتوجيه الأخبار...');
        const flowResult = await FlowRouterService.processNewArticles();
        console.log(`   ✅ تمت معالجة ${flowResult.processedCount} خبر`);
        console.log(`      🤖 تصنيف: ${flowResult.classifiedCount} | ⚡ أوتو: ${flowResult.automatedCount} | 📝 تحرير: ${flowResult.editorialCount} | ⚠️ ناقص: ${flowResult.incompleteCount}`);

        // ══════════════════════════════════════════════════════════════════════
        // المرحلة 3: نشر الأخبار الأوتوماتيكية العالقة
        // أي خبر أوتوماتيكي مكتمل بقي في editorial_queue بحالة pending
        // يتم نشره تلقائياً — لا يجب أن يبقى بقسم التحرير
        // ══════════════════════════════════════════════════════════════════════
        console.log('\n⚡ المرحلة 3: نشر الأخبار الأوتوماتيكية العالقة...');
        const autoPublishResult = await FlowRouterService.autoPublishStuckItems();
        if (autoPublishResult.published > 0) {
          console.log(`   ✅ تم نشر ${autoPublishResult.published} خبر أوتوماتيكي عالق`);
        } else {
          console.log(`   ✅ لا يوجد أخبار أوتوماتيكية عالقة`);
        }

        // ══════════════════════════════════════════════════════════════════════
        // المرحلة 4: النشر التلقائي على الموقع الخارجي (hgaza.nn.ps)
        // ينشر الأخبار المعتمدة (published) على الموقع الخارجي
        // ══════════════════════════════════════════════════════════════════════
        console.log('\n🌐 المرحلة 4: النشر التلقائي على الموقع الخارجي...');
        const externalPublishResult = await autoPublishService.publishAll();
        if (externalPublishResult.success > 0 || externalPublishResult.failed > 0) {
          console.log(`   📊 النتيجة: ✅ ${externalPublishResult.success} | ❌ ${externalPublishResult.failed} | ⏭️ ${externalPublishResult.skipped}`);
        }
        // إعادة محاولة الفاشل (إذا في)
        const retryResult = await autoPublishService.retryFailed();
        if (retryResult.total > 0) {
          console.log(`   🔄 إعادة محاولة: ✅ ${retryResult.success} | ❌ ${retryResult.failed}`);
        }
      } else {
        console.log('\n⏸️  المرحلة 2: المعالجة متوقفة (flow_enabled = false) — تخطي');
      }

      // ── ملخص ──────────────────────────────────────────────────────────────
      this.status.lastRun = now;
      this.status.totalRuns++;

      console.log(`\n✅ انتهت الدورة بنجاح`);
      console.log(`   الوقت المستغرق: ${((Date.now() - now.getTime()) / 1000).toFixed(2)} ثانية`);
      console.log(`   إجمالي الدورات: ${this.status.totalRuns}`);
      if (this.status.nextRun) {
        console.log(`   الدورة التالية: ${this.status.nextRun.toLocaleString('ar-SA')}\n`);
      }
    } catch (error) {
      this.status.errors++;
      console.error(`\n❌ خطأ في المهمة:`, error);
      console.log(`   إجمالي الأخطاء: ${this.status.errors}\n`);
    } finally {
      this.isJobRunning = false; // 🔓 تحرير القفل دائماً حتى لو في خطأ
    }
  }

  /**
   * مزامنة الوحدات الإعلامية والمصادر والتصنيفات من الـ API الخارجي
   * تُستدعى في بداية كل دورة — تضمن أن الداتابيس المحلي محدّث
   */
  private async syncFromExternalApi(): Promise<void> {
    const { newsDeskApiService } = await import('./newsdesk-api.service');
    const { SourceService, CategoryService } = await import('../database/database.service');
    const { MediaUnitSourceService } = await import('../database/media-unit-source.service');
    const { query } = await import('../../config/database');

    let syncedUnits = 0;
    let syncedSources = 0;
    let syncedLinks = 0;
    let syncedCategories = 0;

    // ── 1. مزامنة التصنيفات ────────────────────────────────────────────────
    try {
      const apiCategories = await newsDeskApiService.getCategories(false);
      if (Array.isArray(apiCategories) && apiCategories.length > 0) {
        for (const cat of apiCategories) {
          const slug = cat.slug || '';
          if (!slug) continue;
          const nameAr = cat.name_ar || cat.name || slug;
          // التحقق من وجود التصنيف — إنشاء أو تحديث
          const existing = await query(
            `SELECT id FROM categories WHERE slug = $1 LIMIT 1`,
            [slug]
          );
          if (existing.rows.length > 0) {
            await query(`UPDATE categories SET name = $1, is_active = true WHERE slug = $2`, [nameAr, slug]);
          } else {
            await query(
              `INSERT INTO categories (name, slug, is_active) VALUES ($1, $2, true)`,
              [nameAr, slug]
            );
          }
          syncedCategories++;
        }
        console.log(`   ✅ تصنيفات: ${syncedCategories}`);
      }
    } catch (err) {
      console.warn(`   ⚠️  فشل مزامنة التصنيفات:`, err instanceof Error ? err.message : err);
    }

    // ── 2. مزامنة الوحدات الإعلامية ومصادرها ────────────────────────────────
    try {
      const apiMediaUnits = await newsDeskApiService.getAdminMediaUnits(false);
      if (Array.isArray(apiMediaUnits) && apiMediaUnits.length > 0) {
        for (const apiUnit of apiMediaUnits) {
          const slug = apiUnit.slug || apiUnit.name?.toLowerCase().replace(/\s+/g, '-') || '';
          if (!slug) continue;

          // إنشاء/تحديث الوحدة
          const existingUnit = await query(
            `SELECT id FROM media_units WHERE slug = $1 LIMIT 1`,
            [slug]
          );

          let localUnitId: number;
          if (existingUnit.rows.length > 0) {
            await query(
              `UPDATE media_units SET name = $1, is_active = $2 WHERE slug = $3`,
              [apiUnit.name, apiUnit.is_active !== false, slug]
            );
            localUnitId = existingUnit.rows[0].id;
          } else {
            const insertResult = await query(
              `INSERT INTO media_units (name, slug, is_active, created_at)
               VALUES ($1, $2, $3, NOW()) RETURNING id`,
              [apiUnit.name, slug, apiUnit.is_active !== false]
            );
            localUnitId = insertResult.rows[0].id;
          }
          syncedUnits++;

          // ربط المصادر بالوحدة
          const apiSources = apiUnit.sources || [];
          for (const apiSource of apiSources) {
            const sourceSlug = apiSource.source_slug || apiSource.slug || '';
            if (!sourceSlug) continue;

            try {
              const localSource = await SourceService.findOrCreateBySlug(
                sourceSlug,
                apiSource.source_name || apiSource.name || sourceSlug,
                apiSource.source_url || apiSource.base_url || ''
              );
              syncedSources++;

              await MediaUnitSourceService.linkSource(localUnitId, localSource.id, apiSource.priority || 1);
              syncedLinks++;
            } catch { /* تجاهل الأخطاء الفردية */ }
          }
        }
        console.log(`   ✅ وحدات: ${syncedUnits} | مصادر: ${syncedSources} | ربط: ${syncedLinks}`);
      }
    } catch (err) {
      console.warn(`   ⚠️  فشل مزامنة الوحدات:`, err instanceof Error ? err.message : err);
    }

    // ── 3. مزامنة المصادر المنفردة (اللي مش مرتبطة بوحدات) ──────────────────
    try {
      const apiSources = await newsDeskApiService.getSources(false);
      if (Array.isArray(apiSources) && apiSources.length > 0) {
        let newSourcesCount = 0;
        for (const src of apiSources) {
          const srcSlug = src.slug || '';
          if (!srcSlug) continue;
          // findOrCreateBySlug بيتحقق إذا موجود — فلا يكرر
          try {
            await SourceService.findOrCreateBySlug(srcSlug, src.name || srcSlug, src.base_url || '');
            newSourcesCount++;
          } catch { /* تجاهل */ }
        }
        console.log(`   ✅ مصادر منفردة: ${newSourcesCount}`);
      }
    } catch (err) {
      console.warn(`   ⚠️  فشل مزامنة المصادر:`, err instanceof Error ? err.message : err);
    }
  }

  /**
   * الحصول على حالة الـ scheduler
   */
  getStatus(): SchedulerStatus {
    return { ...this.status };
  }

  /**
   * الحصول على معلومات الـ scheduler
   */
  getInfo(): string {
    const status = this.getStatus();
    return `
📊 معلومات الـ Scheduler:
   الحالة: ${status.isRunning ? '🟢 يعمل' : '🔴 متوقف'}
   الفاصل الزمني: ${this.currentIntervalMinutes} دقيقة
   إجمالي الدورات: ${status.totalRuns}
   الأخطاء: ${status.errors}
   آخر تشغيل: ${status.lastRun ? status.lastRun.toLocaleString('ar-SA') : 'لم يتم التشغيل'}
   الدورة التالية: ${status.nextRun ? status.nextRun.toLocaleString('ar-SA') : 'غير محدد'}
    `;
  }
}

// تصدير instance واحد من الخدمة
export const schedulerService = new SchedulerService();
