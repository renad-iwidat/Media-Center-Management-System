import pool from '../../config/database';

/**
 * سكربت للتحقق من جاهزية قاعدة البيانات لميزة الإدخال اليدوي
 */

async function checkDatabaseSetup() {
  console.log('🔍 جاري التحقق من إعدادات قاعدة البيانات...\n');

  try {
    // 1. التحقق من وجود source_type: user_input
    console.log('1️⃣ التحقق من نوع المصدر user_input...');
    const sourceTypeResult = await pool.query(
      `SELECT id, name FROM source_types WHERE name = 'user_input'`
    );
    
    if (sourceTypeResult.rows.length > 0) {
      console.log('✅ نوع المصدر user_input موجود:', sourceTypeResult.rows[0]);
    } else {
      console.log('❌ نوع المصدر user_input غير موجود - يجب إضافته');
    }

    // 2. التحقق من وجود المصدر: User Manual Input
    console.log('\n2️⃣ التحقق من المصدر User Manual Input...');
    const sourceResult = await pool.query(
      `SELECT id, name, source_type_id, is_active FROM sources WHERE name = 'User Manual Input'`
    );
    
    if (sourceResult.rows.length > 0) {
      console.log('✅ المصدر User Manual Input موجود:', sourceResult.rows[0]);
    } else {
      console.log('❌ المصدر User Manual Input غير موجود - يجب إضافته');
    }

    // 3. التحقق من عمود created_by في raw_data
    console.log('\n3️⃣ التحقق من عمود created_by في جدول raw_data...');
    const columnResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'raw_data' AND column_name = 'created_by'
    `);
    
    if (columnResult.rows.length > 0) {
      console.log('✅ عمود created_by موجود:', columnResult.rows[0]);
    } else {
      console.log('❌ عمود created_by غير موجود - يجب إضافته');
    }

    // 4. التحقق من أن url يقبل NULL
    console.log('\n4️⃣ التحقق من أن عمود url يقبل NULL...');
    const urlColumnResult = await pool.query(`
      SELECT column_name, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'raw_data' AND column_name = 'url'
    `);
    
    if (urlColumnResult.rows.length > 0) {
      const isNullable = urlColumnResult.rows[0].is_nullable === 'YES';
      if (isNullable) {
        console.log('✅ عمود url يقبل NULL');
      } else {
        console.log('❌ عمود url لا يقبل NULL - يجب تعديله');
      }
    }

    // 5. عرض التصنيفات المتاحة
    console.log('\n5️⃣ التصنيفات المتاحة:');
    const categoriesResult = await pool.query(`
      SELECT id, name, slug, flow, is_active
      FROM categories
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log('✅ التصنيفات النشطة:', categoriesResult.rows);

    // 6. عرض وحدات الإعلام النشطة
    console.log('\n6️⃣ وحدات الإعلام النشطة:');
    const mediaUnitsResult = await pool.query(`
      SELECT id, name, slug, is_active
      FROM media_units
      WHERE is_active = true
      ORDER BY name
    `);
    
    console.log('✅ وحدات الإعلام النشطة:', mediaUnitsResult.rows);

    console.log('\n✅ انتهى الفحص!');
    
  } catch (error) {
    console.error('❌ خطأ أثناء الفحص:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseSetup();
