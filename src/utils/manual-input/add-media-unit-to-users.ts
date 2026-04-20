import pool from '../../config/database';

/**
 * إضافة media_unit_id لجدول users وربط المستخدمين بالوحدات الإعلامية
 */

async function addMediaUnitToUsers() {
  try {
    console.log('🔧 إضافة media_unit_id لجدول users...\n');

    // 1. إضافة العمود
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS media_unit_id BIGINT REFERENCES media_units(id)
    `);
    console.log('✅ تم إضافة العمود media_unit_id');

    // 2. ربط المستخدمين الحاليين بالوحدات الإعلامية
    // نفترض: قيس زهران → هنا غزة (id=1)
    // الباقي → النجاح (id=2)
    
    await pool.query(`
      UPDATE users 
      SET media_unit_id = 1 
      WHERE id = 42
    `);
    console.log('✅ تم ربط قيس زهران بـ "هنا غزة"');

    await pool.query(`
      UPDATE users 
      SET media_unit_id = 2 
      WHERE id != 42 AND media_unit_id IS NULL
    `);
    console.log('✅ تم ربط باقي المستخدمين بـ "النجاح"');

    // 3. عرض النتيجة
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, mu.name as media_unit
      FROM users u
      LEFT JOIN media_units mu ON u.media_unit_id = mu.id
      ORDER BY u.id
      LIMIT 10
    `);
    
    console.log('\n📊 المستخدمين مع الوحدات الإعلامية:');
    console.table(result.rows);

    console.log('\n✅ تم الانتهاء بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
  }
}

addMediaUnitToUsers();
