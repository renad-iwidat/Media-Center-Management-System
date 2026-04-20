import pool from '../../config/database';

/**
 * فحص دعم الصور في قاعدة البيانات
 * Check Image Support in Database
 */

async function checkImageSupport() {
  console.log('🔍 فحص دعم الصور في قاعدة البيانات...\n');

  try {
    // 1. التحقق من CHECK constraint
    console.log('1️⃣ التحقق من CHECK constraint في جدول uploaded_files...');
    const constraintCheck = await pool.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'uploaded_files_file_type_check';
    `);

    if (constraintCheck.rows.length > 0) {
      console.log('✅ القيد موجود:');
      console.table(constraintCheck.rows);
      
      const def = constraintCheck.rows[0].constraint_definition;
      if (def.includes('image')) {
        console.log('✅ القيد يدعم الصور (image) ✓\n');
      } else {
        console.log('⚠️ القيد لا يدعم الصور! يجب تشغيل migration\n');
      }
    } else {
      console.log('⚠️ القيد غير موجود!\n');
    }

    // 2. عرض هيكل جدول uploaded_files
    console.log('2️⃣ هيكل جدول uploaded_files:');
    const columns = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'uploaded_files'
      ORDER BY ordinal_position;
    `);
    console.table(columns.rows);

    // 3. عرض إحصائيات الملفات حسب النوع
    console.log('\n3️⃣ إحصائيات الملفات المرفوعة:');
    const stats = await pool.query(`
      SELECT 
        file_type,
        COUNT(*) as count,
        SUM(file_size) as total_size_bytes,
        ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_size_mb,
        MIN(uploaded_at) as first_upload,
        MAX(uploaded_at) as last_upload
      FROM uploaded_files
      GROUP BY file_type
      ORDER BY file_type;
    `);
    
    if (stats.rows.length > 0) {
      console.table(stats.rows);
    } else {
      console.log('   لا توجد ملفات مرفوعة بعد');
    }

    // 4. عرض الصور المرفوعة (إن وجدت)
    console.log('\n4️⃣ الصور المرفوعة:');
    const images = await pool.query(`
      SELECT 
        uf.id,
        uf.file_type,
        uf.original_filename,
        ROUND(uf.file_size::numeric / 1024 / 1024, 2) as size_mb,
        uf.mime_type,
        uf.s3_url,
        u.name as uploaded_by_name,
        m.name as media_unit_name,
        uf.uploaded_at
      FROM uploaded_files uf
      LEFT JOIN users u ON uf.uploaded_by = u.id
      LEFT JOIN media_units m ON uf.media_unit_id = m.id
      WHERE uf.file_type = 'image'
      ORDER BY uf.uploaded_at DESC
      LIMIT 10;
    `);

    if (images.rows.length > 0) {
      console.log(`✅ عدد الصور: ${images.rows.length}`);
      console.table(images.rows);
    } else {
      console.log('   لا توجد صور مرفوعة بعد');
    }

    // 5. عرض الأخبار التي تحتوي على صور
    console.log('\n5️⃣ الأخبار التي تحتوي على صور:');
    const newsWithImages = await pool.query(`
      SELECT 
        r.id,
        r.title,
        r.image_url,
        u.name as correspondent_name,
        m.name as media_unit_name,
        r.fetched_at
      FROM raw_data r
      LEFT JOIN users u ON r.created_by = u.id
      LEFT JOIN media_units m ON r.media_unit_id = m.id
      WHERE r.image_url IS NOT NULL
        AND r.image_url LIKE '%manual-input-image%'
      ORDER BY r.fetched_at DESC
      LIMIT 10;
    `);

    if (newsWithImages.rows.length > 0) {
      console.log(`✅ عدد الأخبار مع صور: ${newsWithImages.rows.length}`);
      console.table(newsWithImages.rows);
    } else {
      console.log('   لا توجد أخبار مع صور بعد');
    }

    // 6. التحقق من عمود media_unit_id في uploaded_files
    console.log('\n6️⃣ التحقق من عمود media_unit_id:');
    const mediaUnitColumn = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'uploaded_files'
        AND column_name = 'media_unit_id';
    `);

    if (mediaUnitColumn.rows.length > 0) {
      console.log('✅ عمود media_unit_id موجود:');
      console.table(mediaUnitColumn.rows);
    } else {
      console.log('⚠️ عمود media_unit_id غير موجود!');
    }

    // 7. عرض جميع القيود على جدول uploaded_files
    console.log('\n7️⃣ جميع القيود على جدول uploaded_files:');
    const allConstraints = await pool.query(`
      SELECT 
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'uploaded_files'::regclass
      ORDER BY conname;
    `);
    console.table(allConstraints.rows);

    console.log('\n✅ اكتمل الفحص!');

  } catch (error) {
    console.error('❌ خطأ أثناء الفحص:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الفحص
checkImageSupport();
