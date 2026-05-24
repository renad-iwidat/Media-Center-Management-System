/**
 * Standalone script to run the transcription editorial system migration + seed
 * Usage: npx ts-node src/utils/run-transcription-editorial-migration.ts
 */

import { runTranscriptionEditorialMigration } from '../services/ai-hub/transcription-editorial-migration';
import { seedTranscriptionEditorialData } from '../services/ai-hub/transcription-editorial-seed';
import { closePool } from '../config/database';

async function main() {
  console.log('🚀 تشغيل migration نظام التفريغ الذكي متعدد الجهات...\n');

  try {
    // 1. إنشاء الجداول
    await runTranscriptionEditorialMigration();

    console.log('');

    // 2. تعبئة البيانات الأولية
    await seedTranscriptionEditorialData();

    console.log('\n✅ انتهى بنجاح!');
  } catch (error) {
    console.error('\n❌ فشل:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
