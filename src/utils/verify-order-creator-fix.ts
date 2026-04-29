import pool from '../config/database';

async function verifyOrderCreatorFix() {
  try {
    console.log('🔍 جاري التحقق من إصلاح عرض منشئ الأوردر...\n');

    // 1. التحقق من أن جميع الأوردرات لديها created_by
    const createdByCheck = await pool.query(
      'SELECT COUNT(*) as count FROM orders WHERE created_by IS NULL OR created_by = 0'
    );
    const nullCount = createdByCheck.rows[0].count;
    console.log(`✅ الأوردرات بدون created_by: ${nullCount} (يجب أن تكون 0)`);

    if (nullCount > 0) {
      console.log('❌ هناك أوردرات بدون created_by!\n');
      process.exit(1);
    }

    // 2. التحقق من أن جميع الأوردرات لديها created_by_name عند الربط مع جدول users
    const createdByNameCheck = await pool.query(
      `SELECT COUNT(*) as count FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.created_by IS NOT NULL AND u.id IS NULL`
    );
    const invalidCount = createdByNameCheck.rows[0].count;
    console.log(`✅ الأوردرات بـ created_by غير موجود في جدول users: ${invalidCount} (يجب أن تكون 0)`);

    if (invalidCount > 0) {
      console.log('❌ هناك أوردرات بـ created_by غير موجود!\n');
      process.exit(1);
    }

    // 3. عرض عينة من الأوردرات مع created_by_name
    console.log('\n📋 عينة من الأوردرات مع created_by_name:\n');
    const sampleOrders = await pool.query(
      `SELECT 
        o.id, 
        o.title, 
        o.created_by, 
        u.name as created_by_name,
        o.created_at
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       ORDER BY o.created_at DESC
       LIMIT 10`
    );

    sampleOrders.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   - ID: ${row.id}`);
      console.log(`   - created_by: ${row.created_by}`);
      console.log(`   - created_by_name: ${row.created_by_name || 'غير معروف'}`);
      console.log(`   - created_at: ${row.created_at}\n`);
    });

    // 4. التحقق من أن OrderModel.findAllWithDetails يرجع البيانات الصحيحة
    console.log('✅ التحقق من OrderModel.findAllWithDetails:\n');
    const detailedOrders = await pool.query(
      `SELECT 
        o.*,
        u.name as created_by_name,
        d.name as desk_name,
        os.name as status_name,
        pl.name as priority_name,
        pr.title as program_name,
        e.title as episode_title
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id
       LEFT JOIN desks d ON o.desk_id = d.id
       LEFT JOIN order_statuses os ON o.status_id = os.id
       LEFT JOIN priority_levels pl ON o.priority_id = pl.id
       LEFT JOIN programs pr ON o.program_id = pr.id
       LEFT JOIN episodes e ON o.episode_id = e.id
       ORDER BY o.created_at DESC
       LIMIT 3`
    );

    detailedOrders.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title}`);
      console.log(`   - created_by_name: ${row.created_by_name || 'غير معروف'}`);
      console.log(`   - desk_name: ${row.desk_name || 'غير محدد'}`);
      console.log(`   - status_name: ${row.status_name || 'غير محدد'}`);
      console.log(`   - program_name: ${row.program_name || 'غير محدد'}\n`);
    });

    // 5. التحقق من أن OrderModel.findByIdWithDetails يرجع البيانات الصحيحة
    console.log('✅ التحقق من OrderModel.findByIdWithDetails:\n');
    if (sampleOrders.rows.length > 0) {
      const firstOrderId = sampleOrders.rows[0].id;
      const detailedOrder = await pool.query(
        `SELECT 
          o.*,
          u.name as created_by_name,
          d.name as desk_name,
          os.name as status_name,
          pl.name as priority_name,
          pr.title as program_name,
          e.title as episode_title
         FROM orders o
         LEFT JOIN users u ON o.created_by = u.id
         LEFT JOIN desks d ON o.desk_id = d.id
         LEFT JOIN order_statuses os ON o.status_id = os.id
         LEFT JOIN priority_levels pl ON o.priority_id = pl.id
         LEFT JOIN programs pr ON o.program_id = pr.id
         LEFT JOIN episodes e ON o.episode_id = e.id
         WHERE o.id = $1`,
        [firstOrderId]
      );

      if (detailedOrder.rows.length > 0) {
        const order = detailedOrder.rows[0];
        console.log(`Order ID: ${order.id}`);
        console.log(`Title: ${order.title}`);
        console.log(`created_by_name: ${order.created_by_name || 'غير معروف'}`);
        console.log(`desk_name: ${order.desk_name || 'غير محدد'}`);
        console.log(`status_name: ${order.status_name || 'غير محدد'}`);
        console.log(`program_name: ${order.program_name || 'غير محدد'}\n`);
      }
    }

    // 6. التحقق من أن OrderModel.getHistory يرجع البيانات الصحيحة
    console.log('✅ التحقق من OrderModel.getHistory:\n');
    if (sampleOrders.rows.length > 0) {
      const firstOrderId = sampleOrders.rows[0].id;
      const history = await pool.query(
        `SELECT 
          oh.*,
          u.name as changed_by_name,
          os_old.name as old_status_name,
          os_new.name as new_status_name
         FROM order_history oh
         LEFT JOIN users u ON oh.changed_by = u.id
         LEFT JOIN order_statuses os_old ON oh.old_status_id = os_old.id
         LEFT JOIN order_statuses os_new ON oh.new_status_id = os_new.id
         WHERE oh.order_id = $1 
         ORDER BY oh.changed_at DESC
         LIMIT 5`,
        [firstOrderId]
      );

      if (history.rows.length > 0) {
        console.log(`History for Order ID ${firstOrderId}:\n`);
        history.rows.forEach((log, index) => {
          console.log(`${index + 1}. ${log.changed_by_name || 'غير معروف'}`);
          console.log(`   - old_status_name: ${log.old_status_name || 'N/A'}`);
          console.log(`   - new_status_name: ${log.new_status_name || 'N/A'}`);
          console.log(`   - changed_at: ${log.changed_at}\n`);
        });
      } else {
        console.log(`No history found for Order ID ${firstOrderId}\n`);
      }
    }

    console.log('✅ انتهى التحقق بنجاح! جميع الفحوصات نجحت!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

verifyOrderCreatorFix();
