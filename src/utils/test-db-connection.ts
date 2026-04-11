/**
 * Test Database Connection
 * اختبار الاتصال بقاعدة البيانات
 */

import { testConnection } from '../config/database';

async function main() {
  try {
    console.log('🔍 اختبار الاتصال بقاعدة البيانات...\n');
    await testConnection();
    console.log('\n✅ الاتصال يعمل بشكل صحيح');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ فشل الاتصال');
    process.exit(1);
  }
}

main();
