/**
 * Standalone script to run the publishing system migration
 * Usage: npx ts-node src/utils/run-publishing-migration.ts
 */

import { runPublishingMigration } from '../services/publishing';
import { closePool } from '../config/database';

async function main() {
  console.log('🚀 تشغيل migration نظام النشر المتعدد المنصات...\n');

  try {
    await runPublishingMigration();
    console.log('\n✅ انتهى بنجاح!');
  } catch (error) {
    console.error('\n❌ فشل:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();
