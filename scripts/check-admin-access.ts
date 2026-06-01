import pool from '../src/config/database';

async function checkAdminAccess() {
  try {
    const res = await pool.query(
      `SELECT a.user_id, u.name, u.email, a.is_active, a.granted_at
       FROM admin_proc_access a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.is_active = true
       ORDER BY a.granted_at DESC`
    );
    
    console.log('\n📋 المستخدمون الذين لديهم صلاحية الوصول للنظام الإداري:\n');
    res.rows.forEach((row: any) => {
      console.log(`✅ ${row.name} (${row.email}) - منح في: ${new Date(row.granted_at).toLocaleString('ar-SA')}`);
    });
    
    console.log(`\n📊 إجمالي المستخدمين: ${res.rows.length}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

checkAdminAccess();
