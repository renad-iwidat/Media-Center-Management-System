/**
 * تشخيص حساب مستخدم: الحالة + الأدوار + الصلاحيات الفعلية
 * الاستخدام: ts-node src/utils/diagnose-user.ts <email>
 */
import pool, { closePool } from '../config/database';

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('❌ مرّر الإيميل: ts-node src/utils/diagnose-user.ts <email>');
    process.exit(1);
  }

  console.log(`\n🔍 تشخيص الحساب: ${email}\n${'─'.repeat(60)}`);

  // 1) بيانات المستخدم الأساسية
  const u = await pool.query(
    'SELECT id, name, email, role_id, is_active, (password_hash IS NOT NULL) AS has_password, last_login FROM users WHERE email = $1',
    [email]
  );

  if (u.rows.length === 0) {
    console.log('❌ المستخدم غير موجود في جدول users');
    await closePool();
    return;
  }

  const user = u.rows[0];
  console.log('👤 المستخدم:');
  console.log(`   id=${user.id} | name=${user.name}`);
  console.log(`   is_active=${user.is_active} | has_password=${user.has_password} | role_id=${user.role_id}`);
  console.log(`   last_login=${user.last_login}`);

  // 2) الأدوار عبر user_roles
  const roles = await pool.query(
    'SELECT r.id, r.name FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = $1',
    [user.id]
  );
  console.log(`\n🎭 الأدوار (user_roles): ${roles.rows.length ? roles.rows.map((r: any) => `${r.name}(${r.id})`).join(', ') : 'لا يوجد'}`);

  // 3) صلاحيات مباشرة عبر user_permissions
  const direct = await pool.query(
    'SELECT p.name FROM permissions p INNER JOIN user_permissions up ON p.id = up.permission_id WHERE up.user_id = $1',
    [user.id]
  );
  console.log(`\n🔑 صلاحيات مباشرة (user_permissions): ${direct.rows.length ? direct.rows.map((r: any) => r.name).join(', ') : 'لا يوجد'}`);

  // 4) نفس استعلام الـ login/getMe (الاتحاد الكامل)
  const all = await pool.query(
    `SELECT DISTINCT p.name FROM permissions p
     WHERE p.id IN (
       SELECT rp.permission_id FROM role_permissions rp
       INNER JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1
       UNION
       SELECT rp2.permission_id FROM role_permissions rp2
       INNER JOIN users u ON rp2.role_id = u.role_id
       WHERE u.id = $1
       UNION
       SELECT up.permission_id FROM user_permissions up
       WHERE up.user_id = $1
     )
     ORDER BY p.name`,
    [user.id]
  );
  const perms = all.rows.map((r: any) => r.name);
  console.log(`\n✅ الصلاحيات النهائية الفعلية (نفس ما بيرجعه /me): ${perms.length}`);
  console.log(perms.length ? '   ' + perms.join('\n   ') : '   ⚠️ لا توجد أي صلاحية — لهذا الواجهة فاضية');

  // 5) فحص مطابقة صلاحيات السايدبار
  const sidebar = ['news.dashboard','news.view','news.edit','news.publish','news.settings','ai.use'];
  console.log(`\n🧭 مطابقة صلاحيات القوائم في الواجهة:`);
  for (const s of sidebar) {
    console.log(`   ${perms.includes(s) ? '✅' : '❌'} ${s}`);
  }
  const hasNews = perms.some(p => p.startsWith('news.'));
  const hasAI = perms.some(p => p.startsWith('ai.'));
  console.log(`\n   مجموعة الأخبار تظهر؟ ${hasNews ? '✅ نعم' : '❌ لا'}`);
  console.log(`   مجموعة AI تظهر؟ ${hasAI ? '✅ نعم' : '❌ لا'}`);

  await closePool();
}

main().catch(async (e) => {
  console.error('❌ خطأ:', e);
  await closePool();
  process.exit(1);
});
