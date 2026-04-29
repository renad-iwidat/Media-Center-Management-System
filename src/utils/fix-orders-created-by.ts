import pool from '../config/database';

async function fixOrdersCreatedBy() {
  try {
    console.log('🔍 جاري البحث عن الأوردرات بدون created_by...\n');

    // 1. البحث عن الأوردرات بدون created_by
    const emptyCreatedByResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE created_by IS NULL OR created_by = 0'
    );
    const emptyCount = emptyCreatedByResult.rows[0].count;
    console.log(`📊 عدد الأوردرات بدون created_by: ${emptyCount}\n`);

    if (emptyCount > 0) {
      // 2. الحصول على أول مستخدم admin
      const adminResult = await pool.query(
        `SELECT u.id FROM users u
         INNER JOIN user_roles ur ON u.id = ur.user_id
         INNER JOIN roles r ON ur.role_id = r.id
         WHERE r.name = 'Admin' OR r.name = 'admin'
         LIMIT 1`
      );

      if (adminResult.rows.length === 0) {
        console.log('❌ لم يتم العثور على مستخدم Admin\n');
        process.exit(1);
      }

      const adminId = adminResult.rows[0].id;
      console.log(`✅ تم العثور على Admin: ${adminId}\n`);

      // 3. تحديث الأوردرات بدون created_by
      const updateResult = await pool.query(
        'UPDATE orders SET created_by = $1 WHERE created_by IS NULL OR created_by = 0 RETURNING id',
        [adminId]
      );

      console.log(`✅ تم تحديث ${updateResult.rows.length} أوردر\n`);

      // 4. التحقق من النتيجة
      const verifyResult = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE created_by IS NULL OR created_by = 0'
      );
      const remainingCount = verifyResult.rows[0].count;
      console.log(`📊 عدد الأوردرات المتبقية بدون created_by: ${remainingCount}\n`);

      if (remainingCount === 0) {
        console.log('✅ تم إصلاح جميع الأوردرات بنجاح!\n');
      }
    } else {
      console.log('✅ جميع الأوردرات لديها created_by\n');
    }

    // 5. عرض عينة من الأوردرات مع created_by_name
    console.log('📋 عينة من الأوردرات:\n');
    const sampleResult = await pool.query(
      `SELECT o.id, o.title, o.created_by, u.name as created_by_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       LIMIT 5`
    );

    sampleResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   - created_by: ${row.created_by}`);
      console.log(`   - created_by_name: ${row.created_by_name || 'غير معروف'}\n`);
    });

    console.log('✅ انتهى الإصلاح بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

fixOrdersCreatedBy();
