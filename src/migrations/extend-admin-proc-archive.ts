import pool from '../config/database';

/**
 * Migration: توسيع جدول admin_proc_archive الموجود
 * 
 * نضيف عليه أعمدة الملفات والمرفقات عشان يصير أرشيف كامل
 * (يخزن الطلبات/المهام المؤرشفة + الملفات المرفقة بكل تفاصيلها)
 */
export async function extendAdminProcArchive() {
  try {
    console.log('📝 توسيع جدول admin_proc_archive...');

    // ============ إضافة أعمدة الملفات ============
    
    // معلومات الملف
    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    `);
    console.log('✅ Added: title');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS description TEXT;
    `);
    console.log('✅ Added: description');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
    `);
    console.log('✅ Added: file_url');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);
    `);
    console.log('✅ Added: file_type');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS file_size BIGINT;
    `);
    console.log('✅ Added: file_size');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
    `);
    console.log('✅ Added: file_name');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);
    `);
    console.log('✅ Added: s3_key');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(100);
    `);
    console.log('✅ Added: s3_bucket');

    // ربط بالقسم والمرفق الأصلي
    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS category_id BIGINT REFERENCES admin_proc_categories(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added: category_id');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS admin_attachment_id BIGINT REFERENCES admin_proc_task_attachments(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added: admin_attachment_id');

    // معلومات إضافية
    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS tags TEXT[];
    `);
    console.log('✅ Added: tags');

    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ADD COLUMN IF NOT EXISTS uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ Added: uploaded_by');

    // تحديث القيود
    await pool.query(`
      ALTER TABLE admin_proc_archive 
      ALTER COLUMN entity_data DROP NOT NULL;
    `);
    console.log('✅ Made: entity_data nullable (للملفات لا تحتاج entity_data)');

    // إضافة Indexes جديدة
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_archive_category ON admin_proc_archive(category_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_archive_attachment ON admin_proc_archive(admin_attachment_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_archive_uploaded_by ON admin_proc_archive(uploaded_by);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_archive_entity_type ON admin_proc_archive(entity_type);`);
    
    console.log('✅ All indexes created');

    console.log('\n🎉 جدول admin_proc_archive تم توسيعه بنجاح!');
    console.log('📋 الجدول الآن يدعم:');
    console.log('   1. أرشفة الطلبات (entity_type = "order")');
    console.log('   2. أرشفة المهام (entity_type = "task")');
    console.log('   3. أرشفة الملفات المرفقة (entity_type = "attachment")');

  } catch (error: any) {
    console.error('❌ Error extending admin_proc_archive:', error.message);
    throw error;
  }
}

// Run migration
extendAdminProcArchive().catch(console.error);
