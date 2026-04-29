import https from 'https';

const BASE_URL = 'media-center-management-system.onrender.com';

function request(method: string, path: string, body?: any, token?: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: BASE_URL,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(data && { 'Content-Length': Buffer.byteLength(data) }),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => { responseData += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch { resolve(responseData); }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testRenderAPI() {
  try {
    console.log('🔍 اختبار الـ Backend على Render...\n');

    // 1. Login
    console.log('1️⃣ تسجيل الدخول...');
    const loginRes = await request('POST', '/api/auth/login', {
      email: 'gmortaja@najah.edu',
      password: 'admin123'
    });
    
    if (!loginRes.success) {
      console.log('❌ فشل تسجيل الدخول:', loginRes);
      process.exit(1);
    }

    const token = loginRes.data?.token;
    console.log(`✅ تم تسجيل الدخول بنجاح - User: ${loginRes.data?.user?.name}\n`);

    // 2. Get Orders
    console.log('2️⃣ جلب الأوردرات...');
    const ordersRes = await request('GET', '/api/orders?limit=5&offset=0', undefined, token);
    
    if (!ordersRes.success) {
      console.log('❌ فشل جلب الأوردرات:', ordersRes);
      process.exit(1);
    }

    const orders = ordersRes.data;
    console.log(`✅ تم جلب ${orders?.length || 0} أوردر\n`);

    if (orders && orders.length > 0) {
      console.log('📋 أول أوردر:');
      const first = orders[0];
      console.log(`  - ID: ${first.id}`);
      console.log(`  - Title: ${first.title}`);
      console.log(`  - created_by: ${first.created_by}`);
      console.log(`  - created_by_name: ${first.created_by_name || '❌ غير موجود'}`);
      console.log(`  - desk_name: ${first.desk_name || '❌ غير موجود'}`);
      console.log(`  - status_name: ${first.status_name || '❌ غير موجود'}`);
      console.log(`  - priority_name: ${first.priority_name || '❌ غير موجود'}\n`);

      // 3. Get Order Details
      console.log(`3️⃣ جلب تفاصيل الأوردر #${first.id}...`);
      const detailsRes = await request('GET', `/api/orders/${first.id}/details`, undefined, token);
      
      if (detailsRes.success) {
        const detail = detailsRes.data;
        console.log(`✅ تم جلب التفاصيل\n`);
        console.log('📋 التفاصيل:');
        console.log(`  - created_by_name: ${detail.created_by_name || '❌ غير موجود'}`);
        console.log(`  - desk_name: ${detail.desk_name || '❌ غير موجود'}`);
        console.log(`  - status_name: ${detail.status_name || '❌ غير موجود'}`);
        console.log(`  - priority_name: ${detail.priority_name || '❌ غير موجود'}`);
        console.log(`  - program_name: ${detail.program_name || '❌ غير موجود'}\n`);
      } else {
        console.log('❌ فشل جلب التفاصيل:', detailsRes);
      }
    }

    console.log('✅ انتهى الاختبار!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

testRenderAPI();
