/**
 * اختبار بسيط لخدمة STT
 * Simple STT Service Test
 */

const fetch = require('node-fetch');

async function testSTTService() {
  try {
    console.log('🧪 اختبار خدمة STT...');
    
    const response = await fetch('http://localhost:4000/api/ai-hub/stt/transcribe-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav',
        language: 'ar'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ الاختبار نجح!');
      console.log('📝 النتيجة:', result);
    } else {
      console.log('❌ الاختبار فشل!');
      console.log('🔍 الخطأ:', result);
    }
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
testSTTService();