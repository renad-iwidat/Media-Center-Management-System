import pool from '../config/database';

/**
 * Migration: إضافة حقول التعديل على جدول التعليقات الإدارية
 * 
 * الحقول الجديدة:
 * - is_edited: هل تم تعديل التعليق
 * - edited_by: من عدل التعليق
 * - edited_at: متى تم التعديل
 */
export async function addCommentEditFields() {
  try {
    console.log('📝 Adding edit fields to admin_proc_task_comments...');

    await pool.query(`
      ALTER TABLE admin_proc_task_comments 
      ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ is_edited column added');

    await pool.query(`
      ALTER TABLE admin_proc_task_comments 
      ADD COLUMN IF NOT EXISTS edited_by BIGINT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ edited_by column added');

    await pool.query(`
      ALTER TABLE admin_proc_task_comments 
      ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ edited_at column added');

    console.log('\n🎉 Comment edit fields added successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Columns already exist');
    } else {
      console.error('❌ Error adding comment edit fields:', error.message);
      throw error;
    }
  }
}

// Run migration
addCommentEditFields().catch(console.error);
