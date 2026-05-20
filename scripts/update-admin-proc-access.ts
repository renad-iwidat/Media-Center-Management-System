import dotenv from 'dotenv';
dotenv.config();

import pool from '../src/config/database';

/**
 * تحديث قائمة المسموح لهم بالوصول للنظام الإداري
 * 
 * المسموح لهم فقط:
 * 1. غازي مرتجى
 * 2. نغم كيلاني
 * 3. هيا المصري
 * 4. حنين بكر
 * 5. رناد عويضات
 * 6. علا عامر
 */

const ALLOWED_USERS = [
  { name: 'غازي مرتجى', searchPatterns: ['غازي مرتجى', 'غازي'] },
  { name: 'نغم كيلاني', searchPatterns: ['نغم كيلاني'] },
  { name: 'هيا المصري', searchPatterns: ['هيا المصري', 'هيا مصري', 'هيا  مصري'] },
  { name: 'حنين بكر', searchPatterns: ['حنين بكر'] },
  { name: 'رناد عويضات', searchPatterns: ['رناد عويضات', 'رناد'] },
  { name: 'علا عامر', searchPatterns: ['علا عامر', 'علا'] },
];

async function updateAdminProcAccess() {
  try {
    console.log('🔄 تحديث قائمة المسموح لهم بالوصول للنظام الإداري...\n');

    // 1. عرض المسموح لهم حالياً
    console.log('=== المسموح لهم حالياً ===');
    const currentResult = await pool.query(
      `SELECT a.id, a.user_id, u.name, a.is_active 
       FROM admin_proc_access a 
       LEFT JOIN users u ON a.user_id = u.id 
       ORDER BY u.name`
    );
    console.table(currentResult.rows);

    // 2. حذف كل الصلاحيات الحالية (إعادة البناء من الصفر)
    console.log('\n🗑️ حذف كل الصلاحيات الحالية...');
    await pool.query('DELETE FROM admin_proc_access');
    console.log('✅ تم الحذف');

    // 3. البحث عن المستخدمين المطلوبين
    console.log('\n🔍 البحث عن المستخدمين المطلوبين...\n');
    const matchedUsers: any[] = [];

    for (const allowedUser of ALLOWED_USERS) {
      let found = false;

      for (const pattern of allowedUser.searchPatterns) {
        const result = await pool.query(
          `SELECT id, name, email FROM users 
           WHERE TRIM(name) ILIKE $1 OR TRIM(name) = $2
           LIMIT 1`,
          [`%${pattern}%`, pattern]
        );

        if (result.rows.length > 0) {
          // تجنب التكرار
          if (!matchedUsers.find((u) => u.id.toString() === result.rows[0].id.toString())) {
            matchedUsers.push({
              ...result.rows[0],
              expected_name: allowedUser.name,
            });
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.log(`⚠️ ما لقينا: ${allowedUser.name}`);
      }
    }

    // 4. عرض المستخدمين اللي لقيناهم
    console.log('=== المستخدمين اللي تم العثور عليهم ===');
    console.table(
      matchedUsers.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        expected: u.expected_name,
      }))
    );

    if (matchedUsers.length === 0) {
      console.log('❌ ما في مستخدمين متطابقين!');
      process.exit(1);
    }

    // 5. منح الصلاحية للمستخدمين
    console.log('\n📝 منح الصلاحيات...');
    const grantedById = matchedUsers[0].id; // أول واحد بمنح للباقي

    for (const user of matchedUsers) {
      await pool.query(
        `INSERT INTO admin_proc_access (user_id, granted_by, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (user_id) DO UPDATE SET is_active = true`,
        [user.id, grantedById]
      );
      console.log(`✅ تم منح الصلاحية لـ: ${user.name}`);
    }

    // 6. عرض النتيجة النهائية
    console.log('\n=== المسموح لهم بعد التحديث ===');
    const finalResult = await pool.query(
      `SELECT a.id, a.user_id, u.name, a.is_active, a.granted_at
       FROM admin_proc_access a 
       LEFT JOIN users u ON a.user_id = u.id 
       WHERE a.is_active = true
       ORDER BY u.name`
    );
    console.table(finalResult.rows);

    console.log(`\n🎉 تم التحديث بنجاح! المسموح لهم: ${finalResult.rows.length} مستخدمين`);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ خطأ:', error.message);
    process.exit(1);
  }
}

updateAdminProcAccess();
