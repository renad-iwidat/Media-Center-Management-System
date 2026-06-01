import pool from '../src/config/database';

/**
 * Script لمنح صلاحية الوصول للنظام الإداري باستخدام ID
 * استخدام: ts-node scripts/grant-access-by-id.ts 40 59
 */

async function grantAccessById() {
  try {
    const userIds = process.argv.slice(2).map(id => BigInt(id));
    
    if (userIds.length === 0) {
      console.log('❌ الرجاء تحديد IDs المستخدمين');
      console.log('الاستخدام: ts-node scripts/grant-access-by-id.ts 40 59');
      process.exit(1);
    }

    console.log('🔍 منح الصلاحيات...\n');

    for (const userId of userIds) {
      // جلب بيانات المستخدم
      const userResult = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        console.log(`❌ لم يتم العثور على مستخدم برقم: ${userId}`);
        continue;
      }

      const user = userResult.rows[0];
      console.log(`✅ المستخدم: ${user.name} (${user.email})`);

      // منح الصلاحية
      const accessResult = await pool.query(
        `INSERT INTO admin_proc_access (user_id, granted_by, is_active)
         VALUES ($1, $1, true)
         ON CONFLICT (user_id) DO UPDATE SET is_active = true, granted_at = NOW()
         RETURNING *`,
        [userId]
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

grantAccessById();
