import pool from '../../config/database';

/**
 * Migration: إنشاء جدول uploaded_files
 * لتخزين الملفات الصوتية والفيديو المرفوعة على S3
 */

async function createUploadedFilesTable() {
  console.log('🚀 بدء إنشاء جدول uploaded_files...\n');

  try {
    // 1. إنشاء جدول uploaded_files
    console.log('📋 إنشاء جدول uploaded_files...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id BIGSERIAL PRIMARY KEY,
        
        -- معلومات المصدر
        source_id BIGINT REFERENCES sources(id),
        source_type_id BIGINT REFERENCES source_types(id),
        
        -- معلومات الملف
        file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('audio', 'video')),
        original_filename VARCHAR(500),
        file_size BIGINT,
        mime_type VARCHAR(100),
        
        -- مسار S3
        s3_bucket VARCHAR(255) NOT NULL,
        s3_key TEXT NOT NULL,
        s3_url TEXT NOT NULL,
        
        -- حالة المعالجة
        processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
        
        -- من رفع الملف
        uploaded_by BIGINT REFERENCES users(id),
        
        -- التواريخ
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        processed_at TIMESTAMP WITH TIME ZONE
      );
    `);
    console.log('✅ تم إنشاء جدول uploaded_files\n');

    // 2. إنشاء Indexes للأداء
    console.log('📊 إنشاء Indexes...');
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_source 
      ON uploaded_files(source_id);
    `);
    console.log('✅ Index: idx_uploaded_files_source');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_source_type 
      ON uploaded_files(source_type_id);
    `);
    console.log('✅ Index: idx_uploaded_files_source_type');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_by 
      ON uploaded_files(uploaded_by);
    `);
    console.log('✅ Index: idx_uploaded_files_uploaded_by');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_status 
      ON uploaded_files(processing_status);
    `);
    console.log('✅ Index: idx_uploaded_files_status');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_uploaded_files_file_type 
      ON uploaded_files(file_type);
    `);
    console.log('✅ Index: idx_uploaded_files_file_type\n');

    // 3. إضافة عمود uploaded_file_id في raw_data
    console.log('🔗 إضافة عمود uploaded_file_id في raw_data...');
    await pool.query(`
      ALTER TABLE raw_data 
      ADD COLUMN IF NOT EXISTS uploaded_file_id BIGINT REFERENCES uploaded_files(id) ON DELETE SET NULL;
    `);
    console.log('✅ تم إضافة عمود uploaded_file_id\n');

    // 4. إنشاء Index للعمود الجديد
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_raw_data_uploaded_file 
      ON raw_data(uploaded_file_id);
    `);
    console.log('✅ Index: idx_raw_data_uploaded_file\n');

    // 5. عرض هيكل الجدول الجديد
    console.log('📋 هيكل جدول uploaded_files:');
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'uploaded_files'
      ORDER BY ordinal_position
    `);
    console.table(columns.rows);

    console.log('\n✅ اكتمل إنشاء جدول uploaded_files بنجاح!');
    console.log('\n📝 ملاحظات:');
    console.log('   - الجدول جاهز لتخزين الملفات الصوتية والفيديو');
    console.log('   - raw_data الآن يحتوي على uploaded_file_id للربط');
    console.log('   - processing_status: pending → processing → completed/failed');
    
  } catch (error) {
    console.error('❌ خطأ أثناء إنشاء الجدول:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// تشغيل الـ migration
createUploadedFilesTable();
