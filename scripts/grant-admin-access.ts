import pool from '../src/config/database';

/**
 * Script لمنح صلاحية الوصول للنظام الإداري
 * استخدام: ts-node scripts/grant-admin-access.ts "حنين بكر" "علا عامر"
 */

async function grantAdminAccess() {
  try {
    const names = process.argv.slice(2);
    
    if (names.length === 0) {
      console.log('❌ الرجاء تحديد أسماء المستخدمين');
      console.log('الاستخدام: ts-node scripts/grant-admin-access.ts "الاسم الأول" "الاسم الثاني"');
      process.exit(1);
    }

    console.log('🔍 البحث عن المستخدمين...\n');

    for (const name of names) {
      // البحث عن المستخدم
      const userResult = await pool.query(
        'SELECT id, name, email FROM users WHERE name ILIKE $1',
        [`%${name}%`]
      );

      if (userResult.rows.length === 0) {
        console.log(`❌ لم يتم العثور على مستخدم باسم: ${name}`);
        continue;
      }

      const user = userResult.rows[0];
      console.log(`✅ وجدت المستخدم: ${user.name} (${user.email})`);

      // منح الصلاحية
      const accessResult = await pool.query(
        `INSERT INTO admin_proc_access (user_id, granted_by, is_active)
         VALUES ($1, $1, true)
         ON CONFLICT (user_id) DO UPDATE SET is_active = true, granted_at = NOW()
         RETURNING *`,
        [user.id]
      );

      console.log(`✨ تم منح صلاحية الوصول للنظام الإداري\n`);
    }

    console.log('✅ تم إكمال العملية بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

grantAdminAccess();
