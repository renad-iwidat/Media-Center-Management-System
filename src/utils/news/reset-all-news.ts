/**
 * Reset All News Tables — تصفير كامل
 * يحذف كل محتويات جداول الأخبار ويصفّر العدّادات
 */
import { query, closePool } from '../../config/database';

async function main() {
  console.log('⚠️  تصفير كامل لجداول الأخبار...\n');

  const steps = [
    { name: 'auto_publish_log', sql: 'TRUNCATE TABLE auto_publish_log RESTART IDENTITY CASCADE' },
    { name: 'content_source', sql: 'TRUNCATE TABLE content_source RESTART IDENTITY CASCADE' },
    { name: 'published_items', sql: 'TRUNCATE TABLE published_items RESTART IDENTITY CASCADE' },
    { name: 'editorial_queue', sql: 'TRUNCATE TABLE editorial_queue RESTART IDENTITY CASCADE' },
    { name: 'raw_data', sql: 'TRUNCATE TABLE raw_data RESTART IDENTITY CASCADE' },
    { name: 'media_unit_sources', sql: 'TRUNCATE TABLE media_unit_sources RESTART IDENTITY CASCADE' },
    { name: 'sources', sql: 'TRUNCATE TABLE sources RESTART IDENTITY CASCADE' },
    { name: 'source_types', sql: 'TRUNCATE TABLE source_types RESTART IDENTITY CASCADE' },
    { name: 'media_units', sql: 'TRUNCATE TABLE media_units RESTART IDENTITY CASCADE' },
    { name: 'categories', sql: 'TRUNCATE TABLE categories RESTART IDENTITY CASCADE' },
    { name: 'geographic_scopes', sql: 'TRUNCATE TABLE geographic_scopes RESTART IDENTITY CASCADE' },
  ];

  for (const step of steps) {
    try {
      await query(step.sql);
      console.log(`   ✅ ${step.name} — تم التصفير`);
    } catch (e: any) {
      if (e.code === '42P01') {
        // relation does not exist — skip
        console.log(`   ⏭️  ${step.name} — الجدول غير موجود (تخطي)`);
      } else {
        console.log(`   ❌ ${step.name} — خطأ: ${e.message}`);
      }
    }
  }

  // التحقق
  console.log('\n📊 التحقق بعد التصفير:');
  const tables = ['media_units', 'sources', 'source_types', 'raw_data', 'editorial_queue', 'published_items', 'categories', 'geographic_scopes'];
  for (const t of tables) {
    try {
      const r = await query(`SELECT COUNT(*)::int AS c FROM ${t}`);
      console.log(`   ${t.padEnd(22)} = ${r.rows[0].c}`);
    } catch (e: any) {
      if (e.code === '42P01') console.log(`   ${t.padEnd(22)} = (غير موجود)`);
      else console.log(`   ${t.padEnd(22)} = ERROR`);
    }
  }

  console.log('\n✅ تم! كل الجداول فاضية والعدادات ترجع من 1');
  await closePool();
  process.exit(0);
}

main().catch((e) => { console.error('❌', e); process.exit(1); });
