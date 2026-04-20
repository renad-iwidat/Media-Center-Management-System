import axios from 'axios';

/**
 * اختبار الـ API endpoints
 */

const API_BASE = 'http://localhost:3000/api';

async function testAPIEndpoints() {
  console.log('🧪 اختبار الـ API Endpoints...\n');

  try {
    // 1. Health check
    console.log('1️⃣ اختبار Health Check...');
    try {
      const healthRes = await axios.get('http://localhost:3000/health');
      console.log('✅ Health Check:', healthRes.data);
    } catch (error) {
      console.log('❌ Server غير شغال. تأكد من تشغيل: npm run dev');
      return;
    }

    // 2. Test GET /api/manual-input/categories
    console.log('\n2️⃣ اختبار GET /api/manual-input/categories...');
    try {
      const categoriesRes = await axios.get(`${API_BASE}/manual-input/categories`);
      console.log('✅ التصنيفات:', categoriesRes.data.data.length, 'تصنيف');
      console.log('   أمثلة:', categoriesRes.data.data.slice(0, 3).map((c: any) => c.name).join(', '));
    } catch (error: any) {
      console.log('❌ فشل:', error.response?.data || error.message);
    }

    // 3. Test GET /api/manual-input/sources
    console.log('\n3️⃣ اختبار GET /api/manual-input/sources...');
    try {
      const sourcesRes = await axios.get(`${API_BASE}/manual-input/sources`);
      console.log('✅ المصادر:', sourcesRes.data.data);
    } catch (error: any) {
      console.log('❌ فشل:', error.response?.data || error.message);
    }

    // 4. Test GET /api/manual-input/source/text
    console.log('\n4️⃣ اختبار GET /api/manual-input/source/text...');
    try {
      const textSourceRes = await axios.get(`${API_BASE}/manual-input/source/text`);
      console.log('✅ مصدر النص:', textSourceRes.data.data);
    } catch (error: any) {
      console.log('❌ فشل:', error.response?.data || error.message);
    }

    // 5. Test POST /api/manual-input/submit (validation test)
    console.log('\n5️⃣ اختبار POST /api/manual-input/submit (validation)...');
    try {
      await axios.post(`${API_BASE}/manual-input/submit`, {
        title: 'قصير', // سيفشل
        content: 'قصير'
      });
    } catch (error: any) {
      if (error.response?.status === 400) {
        console.log('✅ Validation يعمل:', error.response.data.errors);
      } else {
        console.log('❌ خطأ غير متوقع:', error.response?.data || error.message);
      }
    }

    console.log('\n✅ انتهى الاختبار!');
    console.log('\n📝 ملاحظة: لاختبار الإرسال الكامل، استخدم الفرونت على http://localhost:3001');

  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

testAPIEndpoints();
