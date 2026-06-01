import pool from '../src/config/database';

/**
 * Script لسحب صلاحية الوصول للنظام الإداري
 * استخدام: ts-node scripts/revoke-admin-access.ts 40 47 59
 */

async function revokeAdminAccess() {
  try {
    const userIds = process.argv.slice(2).map(id => BigInt(id));
    
    if (userIds.length === 0) {
      console.log('❌ الرجاء تحديد IDs المستخدمين لسحب الصلاحيات منهم');
      console.log('الاستخدام: ts-node scripts/revoke-admin-access.ts 40 47 59');
      process.exit(1);
    }

    console.log('🔍 سحب الصلاحيات...\n');

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
      console.log(`🔴 المستخدم: ${user.name} (${user.email})`);

      // سحب الصلاحية
      const revokeResult = await pool.query(
        `UPDATE admin_proc_access SET is_active = false WHERE user_id = $1`,
        [userId]
      );

      if ((revokeResult.rowCount || 0) > 0) {
        console.log(`✨ تم سحب صلاحية الوصول\n`);
      } else {
        console.log(`⚠️ لم تكن لديه صلاحية من الأساس\n`);
      }
    }

    console.log('✅ تم إكمال العملية بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

revokeAdminAccess();
