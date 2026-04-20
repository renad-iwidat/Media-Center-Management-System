import pool from '../../config/database';

/**
 * نقل media_unit_id من users إلى raw_data
 */

async function moveMediaUnitToRawData() {
  try {
    console.log('🔧 نقل media_unit_id من users إلى raw_data...\n');

    // 1. إضافة media_unit_id لجدول raw_data
    await pool.query(`
      ALTER TABLE raw_data 
      ADD COLUMN IF NOT EXISTS media_unit_id BIGINT REFERENCES media_units(id)
    `);
    console.log('✅ تم إضافة media_unit_id لجدول raw_data');

    // 2. حذف media_unit_id من جدول users
    await pool.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS media_unit_id
    `);
    console.log('✅ تم حذف media_unit_id من جدول users');

    // 3. عرض هيكل raw_data الجديد
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'raw_data' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📊 أعمدة جدول raw_data:');
    console.table(columns.rows);

    console.log('\n✅ تم الانتهاء بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
  }
}

moveMediaUnitToRawData();
