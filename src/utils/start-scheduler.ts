/**
 * Start Scheduler
 * سكريبت لبدء الـ scheduler
 */

import { schedulerService } from '../services/news/scheduler.service';

async function main() {
  try {
    console.log('🎯 بدء خدمة الجدولة...\n');

    // الحصول على الفاصل الزمني من البيئة (افتراضي: 10 دقائق)
    const intervalMinutes = parseInt(process.env.SCHEDULER_INTERVAL || '10', 10);

    // بدء الـ scheduler
    schedulerService.start(intervalMinutes);

    // عرض المعلومات
    console.log(schedulerService.getInfo());

    // الاستماع لإشارات الإيقاف
    process.on('SIGINT', () => {
      console.log('\n\n⏹️  استقبال إشارة الإيقاف...');
      schedulerService.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n⏹️  استقبال إشارة الإيقاف...');
      schedulerService.stop();
      process.exit(0);
    });

    // الاستمرار في التشغيل
    console.log('\n💡 اضغط Ctrl+C لإيقاف الخدمة\n');
  } catch (error) {
    console.error('❌ خطأ في بدء الخدمة:', error);
    process.exit(1);
  }
}

main();
