/**
 * Scheduler Service
 * خدمة جدولة سحب الأخبار
 */

import { rssPipelineService } from './rss-pipeline.service';

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
  private status: SchedulerStatus = {
    isRunning: false,
    totalRuns: 0,
    errors: 0,
  };

  /**
   * بدء الـ scheduler
   * @param intervalMinutes - الفاصل الزمني بالدقائق (افتراضي: 10)
   */
  start(intervalMinutes: number = 10): void {
    if (this.status.isRunning) {
      console.log('⚠️  الـ scheduler يعمل بالفعل');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(`🚀 بدء الـ scheduler - كل ${intervalMinutes} دقائق`);
    this.status.isRunning = true;

    // تشغيل أول مرة فوراً
    this.runJob();

    // تشغيل المهمة بشكل دوري
    this.intervalId = setInterval(() => {
      this.runJob();
    }, intervalMs);

    console.log(`✅ الـ scheduler بدأ العمل\n`);
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
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.status.isRunning = false;
    console.log('⏹️  تم إيقاف الـ scheduler');
  }

  /**
   * تشغيل المهمة
   */
  private async runJob(): Promise<void> {
    try {
      const now = new Date();
      console.log(`\n${'='.repeat(80)}`);
      console.log(`⏰ تشغيل المهمة في: ${now.toLocaleString('ar-SA')}`);
      console.log(`${'='.repeat(80)}\n`);

      // تشغيل الـ pipeline (السحب + الحفظ + التصنيف الآلي)
      const result = await rssPipelineService.runPipeline();

      // تحديث الحالة
      this.status.lastRun = now;
      this.status.totalRuns++;
      this.status.nextRun = new Date(now.getTime() + 10 * 60 * 1000);

      console.log(`\n✅ انتهت المهمة بنجاح`);
      console.log(`\n📊 ملخص النتائج:`);
      console.log(`   إجمالي الأخبار المسحوبة: ${result.totalArticles}`);
      console.log(`   تم حفظها: ${result.savedCount}`);
      console.log(`   الفاشلة: ${result.failedCount}`);
      console.log(`   الوقت المستغرق: ${(result.duration / 1000).toFixed(2)} ثانية`);
      console.log(`   إجمالي التشغيلات: ${this.status.totalRuns}`);
      console.log(`   التشغيل التالي: ${this.status.nextRun.toLocaleString('ar-SA')}\n`);
    } catch (error) {
      this.status.errors++;
      console.error(`\n❌ خطأ في المهمة:`, error);
      console.log(`   إجمالي الأخطاء: ${this.status.errors}\n`);
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
   إجمالي التشغيلات: ${status.totalRuns}
   الأخطاء: ${status.errors}
   آخر تشغيل: ${status.lastRun ? status.lastRun.toLocaleString('ar-SA') : 'لم يتم التشغيل'}
   التشغيل التالي: ${status.nextRun ? status.nextRun.toLocaleString('ar-SA') : 'غير محدد'}
    `;
  }
}

// تصدير instance واحد من الخدمة
export const schedulerService = new SchedulerService();
