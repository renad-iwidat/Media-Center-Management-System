import pool from '../../config/database';

/**
 * إرجاع media_unit_id لكل المستخدمين إلى NULL
 */

async function resetMediaUnits() {
  try {
    console.log('🔄 إرجاع media_unit_id إلى NULL...\n');

    // إرجاع كل المستخدمين إلى NULL
    await pool.query(`
      UPDATE users 
      SET media_unit_id = NULL
    `);
    console.log('✅ تم إرجاع media_unit_id لكل المستخدمين إلى NULL');

    // عرض النتيجة
    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.media_unit_id
      FROM users u
      ORDER BY u.id
      LIMIT 10
    `);
    
    console.log('\n📊 المستخدمين بعد التراجع:');
    console.table(result.rows);

    console.log('\n✅ تم التراجع بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
  }
}

resetMediaUnits();
