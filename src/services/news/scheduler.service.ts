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
import { syncStateService } from './sync-state.service';

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

    // ضمان وجود جداول sync_state و sync_logs
    try {
      await syncStateService.ensureTables();
    } catch (err) {
      console.warn('⚠️ فشل إنشاء جداول sync:', err instanceof Error ? err.message : err);
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

      // ══════════════════════════════════════════════════════════════════════
      // المرحلة 5: إعادة صياغة الأخبار بالخلفية
      // تأخذ أخبار لم تُعاد صياغتها بعد وتعالجها تدريجياً (50 بكل دورة)
      // ══════════════════════════════════════════════════════════════════════
      console.log('\n✍️  المرحلة 5: إعادة صياغة الأخبار (خلفية)...');
      try {
        const { articleRewriterService } = await import('./article-rewriter.service');
        const rewriteResult = await articleRewriterService.processUnrewrittenArticles();
        if (rewriteResult.processed > 0 || rewriteResult.failed > 0) {
          console.log(`   📊 صياغة: ✅ ${rewriteResult.processed} | ❌ ${rewriteResult.failed}`);
        } else {
          console.log(`   ✅ لا توجد أخبار تحتاج إعادة صياغة`);
        }
      } catch (rewriteError) {
        console.error('   ⚠️ خطأ في إعادة الصياغة:', rewriteError instanceof Error ? rewriteError.message : rewriteError);
      }

      // ── ملخص ──────────────────────────────────────────────────────────────
      this.status.lastRun = now;
      this.status.totalRuns++;

      // تنظيف سجلات قديمة (أكثر من 30 يوم) — كل 10 دورات
      if (this.status.totalRuns % 10 === 0) {
        try {
          const deleted = await syncStateService.cleanupOldLogs(30);
          if (deleted > 0) console.log(`🗑️ تم حذف ${deleted} سجل مزامنة قديم`);
        } catch { /* تجاهل */ }
      }

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
   * مزامنة الوحدات الإعلامية والمصادر والتصنيفات والنطاقات من الـ API الخارجي
   * تُستدعى في بداية كل دورة — تضمن أن الداتابيس المحلي محدّث
   * تعتمد على newsDeskSyncService (طبقة المزامنة الموحّدة)
   */
  private async syncFromExternalApi(): Promise<void> {
    const { newsDeskSyncService } = await import('./newsdesk-sync.service');
    const result = await newsDeskSyncService.syncAll();
    if (result.errors.length > 0) {
      console.warn(`   ⚠️  أخطاء المزامنة (${result.errors.length}):`, result.errors.slice(0, 3));
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
