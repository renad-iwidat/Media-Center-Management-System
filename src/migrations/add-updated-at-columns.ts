/**
 * Migration: إضافة عمود updated_at للتعليقات والمرفقات
 * عشان نقدر نعرض إذا التعليق/المرفق تم تعديله
 */

import pool from '../config/database';

async function runMigration() {
  console.log('🚀 بدء إضافة updated_at columns...\n');

  try {
    // 1. task_comments
    console.log('1️⃣ إضافة updated_at لـ task_comments...');
    await pool.query(`
      ALTER TABLE task_comments 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NULL
    `);
    console.log('   ✅ تم\n');

    // 2. task_attachments
    console.log('2️⃣ إضافة updated_at لـ task_attachments...');
    await pool.query(`
      ALTER TABLE task_attachments 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NULL
    `);
    console.log('   ✅ تم\n');

    console.log('✅ Migration نجحت بالكامل!');
  } catch (error) {
    console.error('❌ خطأ في الـ migration:', error);
    throw error;
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();
