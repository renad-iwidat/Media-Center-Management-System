/**
 * Start Scheduler
 * سكريبت لبدء الـ scheduler — يقرأ الإعدادات من الداتابيس
 */

import { schedulerService } from '../services/news/scheduler.service';

async function main() {
  try {
    console.log('🎯 بدء خدمة الجدولة...\n');
    console.log('📡 قراءة الإعدادات من الداتابيس...\n');

    // start() تقرأ الـ interval من الداتابيس تلقائياً
    // الـ fallback هو 15 دقيقة لو الداتابيس ما رد
    await schedulerService.start(15);

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
