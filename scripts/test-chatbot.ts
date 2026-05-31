import axios from 'axios';

const BASE = 'http://localhost:3000';

async function main() {
  // 1) تسجيل الدخول للحصول على توكن
  const email = process.env.TEST_EMAIL || 'admin@media.com';
  const password = process.env.TEST_PASSWORD || 'admin123';

  console.log(`\n🔐 تسجيل الدخول كـ ${email} ...`);
  let token = '';
  try {
    const login = await axios.post(`${BASE}/api/auth/login`, { email, password });
    token = login.data?.data?.token;
    console.log('   ✅ تم تسجيل الدخول، التوكن جاهز');
  } catch (e: any) {
    console.error('   ❌ فشل تسجيل الدخول:', e?.response?.data || e.message);
    console.error('   جرّب تمرير TEST_EMAIL و TEST_PASSWORD صحيحين.');
    process.exit(1);
  }

  // 2) إرسال رسالة للتشات بوت
  // نقرأ السؤال من متغير البيئة CHAT_Q أو من ملف chat_question.txt (UTF-8) أو الافتراضي
  let question = process.env.CHAT_Q || process.argv[2] || '';
  if (!question) {
    try {
      const fs = require('fs');
      const path = require('path');
      const qPath = path.join(__dirname, 'chat_question.txt');
      if (fs.existsSync(qPath)) {
        question = fs.readFileSync(qPath, 'utf8').trim();
      }
    } catch { /* ignore */ }
  }
  if (!question) question = 'كم عدد المهام المتأخرة في النظام؟';
  console.log(`\n💬 السؤال: "${question}"`);
  console.log('   ... جاري انتظار رد المساعد (قد يأخذ بضع ثوانٍ) ...');

  try {
    const res = await axios.post(
      `${BASE}/api/chat`,
      { message: question, history: [] },
      { headers: { Authorization: `Bearer ${token}` }, timeout: 60000 }
    );

    console.log('\n🤖 رد المساعد:');
    console.log('   ', res.data?.data?.reply);
    console.log('\n🧭 الإجراء (action):', JSON.stringify(res.data?.data?.action));
    console.log('\n✅ التشات بوت يعمل بشكل صحيح!');
  } catch (e: any) {
    console.error('\n❌ خطأ من endpoint التشات بوت:');
    console.error('   ', e?.response?.data || e.message);
    process.exit(1);
  }
}

main();
