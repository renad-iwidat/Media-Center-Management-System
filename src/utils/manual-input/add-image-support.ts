import pool from '../../config/database';

/**
 * Migration: إضافة دعم الصور في جدول uploaded_files
 * تحديث CHECK constraint لقبول file_type = 'image'
 */

async function addImageSupport() {
  console.log('🚀 بدء تحديث جدول uploaded_files لدعم الصور...\n');

  try {
    // 1. حذف القيد القديم
    console.log('🗑️ حذف القيد القديم...');
    await pool.query(`
      ALTER TABLE uploaded_files 
      DROP CONSTRAINT IF EXISTS uploaded_files_file_type_check;
    `);
    console.log('✅ تم حذف القيد القديم\n');

    // 2. إضافة القيد الجديد مع دعم الصور
    console.log('➕ إضافة القيد الجديد مع دعم الصور...');
    await pool.query(`
      ALTER TABLE uploaded_files 
      ADD CONSTRAINT uploaded_files_file_type_check 
      CHECK (file_type IN ('audio', 'video', 'image'));
    `);
    console.log('✅ تم إضافة القيد الجديد\n');

    // 3. التحقق من التحديث
    console.log('🔍 التحقق من القيد الجديد...');
    const result = await pool.query(`
      SELECT 
        conname AS constraint_name,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conname = 'uploaded_files_file_type_check';
    `);

    if (result.rows.length > 0) {
      console.log('✅ القيد الجديد:');
      console.table(result.rows);
    }

    console.log('\n✅ اكتمل التحديث بنجاح!');
    console.log('\n📝 ملاحظات:');
    console.log('   - جدول uploaded_files الآن يدعم: audio, video, image');
    console.log('   - يمكن رفع الصور وتخزينها في S3');
    console.log('   - الصور ستُخزن في مجلد: manual-input-image/');
    
  } catch (error) {
    console.error('❌ خطأ أثناء التحديث:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الـ migration
addImageSupport();
