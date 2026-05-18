/**
 * اختبار API نظام المنشنات
 * Test API endpoints for mentions system
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let testUserId = '';
let testTaskId = '';

async function testMentionsAPI() {
  console.log('🧪 بدء اختبار API نظام المنشنات...\n');

  try {
    // 1. تسجيل الدخول
    console.log('1️⃣ تسجيل الدخول...');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });
    authToken = loginRes.data.token;
    testUserId = loginRes.data.user.id;
    console.log(`   ✅ تم تسجيل الدخول: ${loginRes.data.user.name}\n`);

    // 2. جلب المهام
    console.log('2️⃣ جلب المهام...');
    const tasksRes = await axios.get(`${API_BASE}/tasks?limit=1`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    testTaskId = tasksRes.data.data[0].id;
    console.log(`   ✅ تم جلب المهام: ${tasksRes.data.data[0].title}\n`);

    // 3. إضافة تعليق بدون منشنات
    console.log('3️⃣ إضافة تعليق بدون منشنات...');
    const commentRes1 = await axios.post(
      `${API_BASE}/tasks/${testTaskId}/comments`,
      { comment: 'هذا تعليق عادي بدون منشنات' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`   ✅ تم إضافة التعليق: ${commentRes1.data.data.comment}\n`);

    // 4. إضافة تعليق مع منشنات
    console.log('4️⃣ إضافة تعليق مع منشنات...');
    const commentRes2 = await axios.post(
      `${API_BASE}/tasks/${testTaskId}/comments`,
      { comment: 'مرحبا @قيس_زهران و @أيمن_عاشور، هذا تعليق مع منشنات' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`   ✅ تم إضافة التعليق مع المنشنات\n`);

    // 5. جلب المنشنات
    console.log('5️⃣ جلب المنشنات...');
    const mentionsRes = await axios.get(
      `${API_BASE}/tasks/${testTaskId}/mentions`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`   ✅ عدد المنشنات: ${mentionsRes.data.data.length}`);
    mentionsRes.data.data.forEach((mention: any) => {
      console.log(`      - ${mention.mentioned_user_name} (منشن من ${mention.mentioned_by_user_name})`);
    });
    console.log();

    // 6. جلب التعليقات
    console.log('6️⃣ جلب التعليقات...');
    const commentsRes = await axios.get(
      `${API_BASE}/tasks/${testTaskId}/comments`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    console.log(`   ✅ عدد التعليقات: ${commentsRes.data.data.length}`);
    commentsRes.data.data.slice(0, 3).forEach((comment: any) => {
      console.log(`      - "${comment.comment.substring(0, 50)}..."`);
    });
    console.log();

    console.log('✅ جميع اختبارات API نجحت!\n');

  } catch (error: any) {
    console.error('❌ خطأ في الاختبار:', error.response?.data || error.message);
  }
}

testMentionsAPI();
