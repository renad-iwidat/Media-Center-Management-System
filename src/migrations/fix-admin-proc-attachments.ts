import pool from '../config/database';

/**
 * Migration: Fix admin_proc_task_attachments file_url column
 * 
 * المشاكل:
 * 1. الـ file_url column صغير جداً (500 حرف) والـ URLs طويلة
 * 2. الـ file_url بتتخزن كاملة مع الـ domain
 * 
 * الحل:
 * 1. أزيد حجم الـ column إلى 1000 حرف
 * 2. أضيف column جديد للـ s3_key (بس الـ key بدون domain)
 */
export async function fixAdminProcAttachments() {
  try {
    console.log('📝 Fixing admin_proc_task_attachments table...');

    // 1. زيادة حجم file_url column
    await pool.query(`
      ALTER TABLE admin_proc_task_attachments 
      ALTER COLUMN file_url TYPE VARCHAR(1000);
    `);
    console.log('✅ file_url column size increased to 1000');

    // 2. إضافة column جديد للـ s3_key (بس الـ key بدون domain)
    await pool.query(`
      ALTER TABLE admin_proc_task_attachments 
      ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);
    `);
    console.log('✅ s3_key column added');

    // 3. إضافة column للـ s3_bucket
    await pool.query(`
      ALTER TABLE admin_proc_task_attachments 
      ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(100);
    `);
    console.log('✅ s3_bucket column added');

    // 4. إضافة indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_attachments_s3_key ON admin_proc_task_attachments(s3_key);
    `);
    console.log('✅ Indexes created');

    console.log('\n🎉 admin_proc_task_attachments table fixed successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Columns already exist');
    } else {
      console.error('❌ Error fixing admin_proc_task_attachments:', error.message);
      throw error;
    }
  }
}

// Run migration
fixAdminProcAttachments().catch(console.error);
