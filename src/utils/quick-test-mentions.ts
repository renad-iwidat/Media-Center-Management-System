/**
 * اختبار سريع لنظام المنشنات
 */

import axios from 'axios';

const API = 'http://localhost:3000/api';

async function quickTest() {
  try {
    console.log('🧪 اختبار سريع لنظام المنشنات\n');

    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    const token = loginRes.data.token;
    const userId = loginRes.data.user.id;
    console.log(`✅ تم تسجيل الدخول: ${loginRes.data.user.name}\n`);

    // 2. جلب أول مهمة
    console.log('2️⃣ جلب أول مهمة...');
    const tasksRes = await axios.get(`${API}/tasks?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const taskId = tasksRes.data.data[0].id;
    console.log(`✅ المهمة: ${tasksRes.data.data[0].title} (ID: ${taskId})\n`);

    // 3. إضافة تعليق مع منشنات
    console.log('3️⃣ إضافة تعليق مع منشنات...');
    const commentRes = await axios.post(
      `${API}/tasks/${taskId}/comments`,
      { comment: 'مرحبا @قيس_زهران، هذا اختبار المنشنات' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ تم إضافة التعليق\n`);

    // 4. جلب المنشنات
    console.log('4️⃣ جلب المنشنات...');
    const mentionsRes = await axios.get(
      `${API}/tasks/${taskId}/mentions`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log(`✅ عدد المنشنات: ${mentionsRes.data.data.length}`);
    if (mentionsRes.data.data.length > 0) {
      mentionsRes.data.data.forEach((m: any) => {
        console.log(`   - ${m.mentioned_user_name}`);
      });
    }
    console.log();

    console.log('✅ الاختبار نجح!\n');

  } catch (error: any) {
    console.error('❌ خطأ:', error.response?.data?.message || error.message);
  }
}

quickTest();
