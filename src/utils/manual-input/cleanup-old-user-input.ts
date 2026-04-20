import pool from '../../config/database';

/**
 * حذف user_input القديم والمصدر المرتبط فيه
 */

async function cleanupOldUserInput() {
  console.log('🗑️  حذف user_input القديم...\n');

  try {
    // 1. التحقق من وجود بيانات في raw_data مرتبطة بالمصدر القديم
    console.log('1️⃣ التحقق من البيانات المرتبطة...');
    const dataCheck = await pool.query(`
      SELECT COUNT(*) as count 
      FROM raw_data 
      WHERE source_id = 13 OR source_type_id = 5
    `);
    
    const count = parseInt(dataCheck.rows[0].count);
    console.log(`📊 عدد السجلات المرتبطة: ${count}`);
    
    if (count > 0) {
      console.log('⚠️  تحذير: يوجد بيانات مرتبطة بالمصدر القديم');
      console.log('هل تريد حذفها؟ (سيتم الحذف الآن)');
      
      // حذف البيانات المرتبطة
      await pool.query(`
        DELETE FROM raw_data 
        WHERE source_id = 13 OR source_type_id = 5
      `);
      console.log('✅ تم حذف البيانات المرتبطة');
    }

    // 2. حذف المصدر من جدول sources
    console.log('\n2️⃣ حذف المصدر من جدول sources...');
    const sourceDelete = await pool.query(`
      DELETE FROM sources 
      WHERE id = 13 AND source_type_id = 5
      RETURNING id, name
    `);
    
    if (sourceDelete.rows.length > 0) {
      console.log('✅ تم حذف المصدر:', sourceDelete.rows[0]);
    } else {
      console.log('⚠️  المصدر غير موجود أو تم حذفه مسبقاً');
    }

    // 3. حذف نوع المصدر من source_types
    console.log('\n3️⃣ حذف نوع المصدر من source_types...');
    const typeDelete = await pool.query(`
      DELETE FROM source_types 
      WHERE id = 5 AND name = 'user_input'
      RETURNING id, name
    `);
    
    if (typeDelete.rows.length > 0) {
      console.log('✅ تم حذف نوع المصدر:', typeDelete.rows[0]);
    } else {
      console.log('⚠️  نوع المصدر غير موجود أو تم حذفه مسبقاً');
    }

    // 4. التحقق من النتيجة
    console.log('\n4️⃣ التحقق من النتيجة...');
    const remainingTypes = await pool.query(`
      SELECT id, name 
      FROM source_types 
      WHERE name LIKE '%user_input%'
      ORDER BY id
    `);
    console.log('أنواع المصادر المتبقية:', remainingTypes.rows);

    console.log('\n✅ تم الحذف بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ أثناء الحذف:', error);
  } finally {
    await pool.end();
  }
}

cleanupOldUserInput();
