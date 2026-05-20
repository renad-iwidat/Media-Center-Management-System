import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import jwt from 'jsonwebtoken';
import pool from '../src/config/database';

const API_URL = 'http://localhost:3000';
const JWT_SECRET = process.env.JWT_SECRET || 'media-center-secret-key-change-in-production';

function generateTestToken(userId: string, email: string, roleName: string = 'admin'): string {
  return jwt.sign(
    { user_id: userId, email, role_id: '1', role_name: roleName },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

async function testAdminProcAPI() {
  try {
    console.log('🧪 اختبار API الإجراءات الإدارية...\n');

    // 1. توليد توكن لـ غازي مرتجى (له صلاحية)
    const ghaziResult = await pool.query(
      "SELECT id, email, name FROM users WHERE name LIKE '%غازي%' LIMIT 1"
    );
    if (ghaziResult.rows.length === 0) {
      console.log('❌ ما لقينا المستخدم غازي');
      process.exit(1);
    }
    const ghazi = ghaziResult.rows[0];
    const ghaziToken = generateTestToken(ghazi.id.toString(), ghazi.email);
    console.log(`✅ توكن غازي: ${ghazi.name} (ID: ${ghazi.id})`);

    // 2. توليد توكن لمستخدم عادي (ما له صلاحية)
    const regularResult = await pool.query(
      `SELECT id, email, name FROM users 
       WHERE id NOT IN (SELECT user_id FROM admin_proc_access) 
       LIMIT 1`
    );
    const regular = regularResult.rows[0];
    const regularToken = generateTestToken(regular.id.toString(), regular.email, 'user');
    console.log(`✅ توكن مستخدم عادي: ${regular.name} (ID: ${regular.id})\n`);

    const ghaziHeaders = { Authorization: `Bearer ${ghaziToken}` };
    const regularHeaders = { Authorization: `Bearer ${regularToken}` };

    // ============ TEST 1: فحص الصلاحيات ============
    console.log('=== TEST 1: فحص صلاحية الوصول ===');
    const accessGhazi = await axios.get(
      `${API_URL}/api/administrative/access/check`,
      { headers: ghaziHeaders }
    );
    console.log(`غازي has_access:`, accessGhazi.data.data.has_access);

    const accessRegular = await axios.get(
      `${API_URL}/api/administrative/access/check`,
      { headers: regularHeaders }
    );
    console.log(`المستخدم العادي has_access:`, accessRegular.data.data.has_access);

    // ============ TEST 2: جلب الأقسام الأربعة ============
    console.log('\n=== TEST 2: جلب الأقسام الأربعة ===');
    const categories = await axios.get(
      `${API_URL}/api/administrative/categories`,
      { headers: ghaziHeaders }
    );
    console.log(`✅ عدد الأقسام: ${categories.data.data.length}`);
    categories.data.data.forEach((c: any) => {
      console.log(`   - ${c.name} (${c.icon}, ${c.color})`);
    });

    // ============ TEST 3: إنشاء طلب إداري ============
    console.log('\n=== TEST 3: إنشاء طلب إداري ===');
    const officialBooksCategory = categories.data.data.find(
      (c: any) => c.name === 'تكليف الكتب الرسمية'
    );
    
    // جلب status_id متوفر
    const statusResult = await pool.query(
      "SELECT id, name FROM order_statuses LIMIT 1"
    );
    const firstStatusId = statusResult.rows[0]?.id;
    
    if (!firstStatusId) {
      console.log('⚠️ ما في حالات للطلبات');
    } else {
      const orderResp = await axios.post(
        `${API_URL}/api/administrative/orders`,
        {
          category_id: officialBooksCategory.id,
          title: 'كتاب رسمي تجريبي للاختبار',
          description: 'هذا طلب تجريبي لاختبار النظام الإداري',
          status_id: firstStatusId,
          notes: 'ملاحظة تجريبية',
        },
        { headers: ghaziHeaders }
      );
      console.log(`✅ تم إنشاء الطلب رقم: ${orderResp.data.data.id}`);
      console.log(`   العنوان: ${orderResp.data.data.title}`);

      const createdOrderId = orderResp.data.data.id;

      // ============ TEST 4: جلب الطلبات ============
      console.log('\n=== TEST 4: جلب طلبات غازي ===');
      const myOrders = await axios.get(
        `${API_URL}/api/administrative/orders`,
        { headers: ghaziHeaders }
      );
      console.log(`✅ عدد طلبات غازي: ${myOrders.data.data.length}`);

      // ============ TEST 5: المستخدم العادي ما يقدر يشوف ============
      console.log('\n=== TEST 5: المستخدم العادي يحاول يشوف الطلبات ===');
      const regularOrders = await axios.get(
        `${API_URL}/api/administrative/orders`,
        { headers: regularHeaders }
      );
      console.log(`✅ عدد طلبات المستخدم العادي: ${regularOrders.data.data.length} (يفترض 0)`);

      // ============ TEST 6: المستخدم العادي يحاول إنشاء طلب ============
      console.log('\n=== TEST 6: المستخدم العادي يحاول إنشاء طلب ===');
      try {
        await axios.post(
          `${API_URL}/api/administrative/orders`,
          {
            category_id: officialBooksCategory.id,
            title: 'طلب من مستخدم عادي',
            status_id: firstStatusId,
          },
          { headers: regularHeaders }
        );
        console.log('❌ المفروض يرفض الطلب!');
      } catch (err: any) {
        console.log(`✅ تم رفض الطلب بشكل صحيح: ${err.response?.data?.error}`);
      }

      // ============ TEST 7: إنشاء مهمة وتعيين مستخدمين ============
      console.log('\n=== TEST 7: إنشاء مهمة وتعيين مستخدم عادي ===');
      const taskStatusResult = await pool.query(
        "SELECT id, name FROM task_statuses LIMIT 1"
      );
      const firstTaskStatusId = taskStatusResult.rows[0]?.id;

      if (firstTaskStatusId) {
        const taskResp = await axios.post(
          `${API_URL}/api/administrative/tasks`,
          {
            admin_order_id: createdOrderId,
            title: 'مهمة تجريبية للاختبار',
            description: 'هذه مهمة تجريبية',
            status_id: firstTaskStatusId,
            assigned_users: [regular.id.toString()], // نعيّن المستخدم العادي على المهمة
          },
          { headers: ghaziHeaders }
        );
        console.log(`✅ تم إنشاء المهمة رقم: ${taskResp.data.data.id}`);

        // ============ TEST 8: المستخدم العادي يقدر يشوف المهمة الآن ============
        console.log('\n=== TEST 8: المستخدم المعين يقدر يشوف الطلب الآن ===');
        const regularOrdersAfter = await axios.get(
          `${API_URL}/api/administrative/orders`,
          { headers: regularHeaders }
        );
        console.log(`✅ عدد طلبات المستخدم بعد التعيين: ${regularOrdersAfter.data.data.length} (يفترض 1)`);

        // ============ TEST 9: المستخدم يقدر يشوف مهامه ============
        console.log('\n=== TEST 9: مهام المستخدم العادي (المعين عليها) ===');
        const myTasks = await axios.get(
          `${API_URL}/api/administrative/my-tasks`,
          { headers: regularHeaders }
        );
        console.log(`✅ عدد مهام المستخدم العادي: ${myTasks.data.data.length}`);
        if (myTasks.data.data.length > 0) {
          console.log(`   - ${myTasks.data.data[0].title}`);
        }
      }
    }

    // ============ تنظيف بيانات الاختبار ============
    console.log('\n=== تنظيف بيانات الاختبار ===');
    await pool.query("DELETE FROM admin_proc_orders WHERE title LIKE '%تجريبي%'");
    console.log('✅ تم حذف بيانات الاختبار');

    console.log('\n🎉 كل الاختبارات نجحت!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ خطأ في الاختبار:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testAdminProcAPI();
