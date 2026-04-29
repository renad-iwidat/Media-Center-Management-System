import pool from '../config/database';

async function testOrderAPI() {
  try {
    console.log('🧪 اختبار API الأوردرات...\n');

    // 1. Test getAllOrders query (simulating what the API does)
    console.log('1️⃣ اختبار getAllOrders (GET /api/orders):\n');
    const allOrdersResult = await pool.query(
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
       LIMIT 10 OFFSET 0`
    );

    console.log(`✅ تم استرجاع ${allOrdersResult.rows.length} أوردر\n`);
    
    if (allOrdersResult.rows.length > 0) {
      const order = allOrdersResult.rows[0];
      console.log('📋 أول أوردر:');
      console.log(`  - ID: ${order.id}`);
      console.log(`  - Title: ${order.title}`);
      console.log(`  - created_by_name: ${order.created_by_name || 'غير معروف'}`);
      console.log(`  - desk_name: ${order.desk_name || 'غير محدد'}`);
      console.log(`  - status_name: ${order.status_name || 'غير محدد'}`);
      console.log(`  - priority_name: ${order.priority_name || 'غير محدد'}`);
      console.log(`  - program_name: ${order.program_name || 'غير محدد'}`);
      console.log(`  - episode_title: ${order.episode_title || 'غير محدد'}\n`);
    }

    // 2. Test getOrderWithDetails query
    if (allOrdersResult.rows.length > 0) {
      console.log('2️⃣ اختبار getOrderWithDetails (GET /api/orders/:id/details):\n');
      const orderId = allOrdersResult.rows[0].id;
      
      const detailsResult = await pool.query(
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
        [orderId]
      );

      if (detailsResult.rows.length > 0) {
        const order = detailsResult.rows[0];
        console.log(`✅ تم استرجاع تفاصيل الأوردر #${orderId}\n`);
        console.log('📋 التفاصيل:');
        console.log(`  - Title: ${order.title}`);
        console.log(`  - created_by_name: ${order.created_by_name || 'غير معروف'}`);
        console.log(`  - desk_name: ${order.desk_name || 'غير محدد'}`);
        console.log(`  - status_name: ${order.status_name || 'غير محدد'}`);
        console.log(`  - priority_name: ${order.priority_name || 'غير محدد'}`);
        console.log(`  - program_name: ${order.program_name || 'غير محدد'}`);
        console.log(`  - episode_title: ${order.episode_title || 'غير محدد'}\n`);
      }

      // 3. Test getHistory query
      console.log('3️⃣ اختبار getHistory (GET /api/orders/:id/history):\n');
      const historyResult = await pool.query(
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
        [orderId]
      );

      if (historyResult.rows.length > 0) {
        console.log(`✅ تم استرجاع ${historyResult.rows.length} سجل تاريخي\n`);
        historyResult.rows.forEach((log, idx) => {
          console.log(`${idx + 1}. ${log.changed_by_name || 'غير معروف'}`);
          console.log(`   - old_status_name: ${log.old_status_name || 'N/A'}`);
          console.log(`   - new_status_name: ${log.new_status_name || 'N/A'}`);
          console.log(`   - changed_at: ${log.changed_at}\n`);
        });
      } else {
        console.log('✅ لا يوجد سجل تاريخي لهذا الأوردر\n');
      }
    }

    // 4. Verify all orders have created_by_name
    console.log('4️⃣ التحقق من أن جميع الأوردرات لديها created_by_name:\n');
    const countResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END) as with_creator_name,
        COUNT(CASE WHEN u.id IS NULL THEN 1 END) as without_creator_name
       FROM orders o
       LEFT JOIN users u ON o.created_by = u.id`
    );

    const stats = countResult.rows[0];
    console.log(`✅ إجمالي الأوردرات: ${stats.total}`);
    console.log(`✅ الأوردرات بـ created_by_name: ${stats.with_creator_name}`);
    console.log(`✅ الأوردرات بدون created_by_name: ${stats.without_creator_name}\n`);

    if (stats.without_creator_name > 0) {
      console.log('⚠️ تحذير: هناك أوردرات بدون created_by_name!\n');
    }

    console.log('✅ انتهى الاختبار بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

testOrderAPI();
