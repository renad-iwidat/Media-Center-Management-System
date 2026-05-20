import pool from '../src/config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdminProcTables() {
  try {
    console.log('🔍 فحص الجداول الإدارية...\n');

    // 1. فحص الأقسام الأربعة
    console.log('=== الأقسام الإدارية ===');
    const categoriesResult = await pool.query(
      'SELECT id, name, description, icon, color FROM admin_proc_categories ORDER BY id'
    );
    console.table(categoriesResult.rows);

    // 2. فحص المستخدمين المسموح لهم
    console.log('\n=== المستخدمين المسموح لهم ===');
    const accessResult = await pool.query(
      `SELECT a.id, a.user_id, u.name as user_name, a.is_active, a.granted_at 
       FROM admin_proc_access a
       LEFT JOIN users u ON a.user_id = u.id
       ORDER BY a.granted_at DESC`
    );
    console.table(accessResult.rows);

    // 3. فحص كل الجداول الإدارية
    console.log('\n=== كل الجداول الإدارية ===');
    const tablesResult = await pool.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_name LIKE 'admin_proc_%'
       ORDER BY table_name`
    );
    console.table(tablesResult.rows);

    // 4. فحص أعداد كل الجداول
    console.log('\n=== أعداد الصفوف في كل جدول ===');
    const tableCounts = [];
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
      tableCounts.push({
        table: tableName,
        count: countResult.rows[0].count,
      });
    }
    console.table(tableCounts);

    console.log('\n✅ كل الجداول الإدارية موجودة وشغالة!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

checkAdminProcTables();
