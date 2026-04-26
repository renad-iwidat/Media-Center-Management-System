/**
 * اختبار خدمة تحويل الفيديو إلى نص
 * Video to Text Service Test
 */

const fetch = require('node-fetch');

async function testVideoToText() {
  try {
    console.log('🧪 اختبار خدمة تحويل الفيديو إلى نص...');
    
    const response = await fetch('http://localhost:4000/api/ai-hub/video-to-text/process-s3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileId: 123,
        s3Url: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-تست-مين-المراسل-والصوت-1776609101440-cu64zv.mp4',
        language: 'ar',
        outputFormat: 'mp3',
        bitrate: '128k'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ اختبار تحويل الفيديو إلى نص نجح!');
      console.log('📝 النتيجة:', {
        success: result.success,
        fileId: result.data?.fileId,
        transcriptLength: result.data?.transcriptLength,
        audioSize: result.data?.audioSize,
        language: result.data?.language,
        transcript: result.data?.transcript?.substring(0, 200) + '...' // أول 200 حرف
      });
    } else {
      console.log('❌ اختبار تحويل الفيديو إلى نص فشل!');
      console.log('🔍 الخطأ:', result);
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار تحويل الفيديو إلى نص:', error.message);
  }
}

async function testVideoToTextFromUrl() {
  try {
    console.log('\n🧪 اختبار تحويل الفيديو إلى نص من URL...');
    
    const response = await fetch('http://localhost:4000/api/ai-hub/video-to-text/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-تست-مين-المراسل-والصوت-1776609101440-cu64zv.mp4',
        language: 'ar',
        outputFormat: 'mp3',
        bitrate: '128k'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ اختبار تحويل الفيديو إلى نص من URL نجح!');
      console.log('📝 النتيجة:', {
        success: result.success,
        transcriptLength: result.data?.transcriptLength,
        audioSize: result.data?.audioSize,
        language: result.data?.language,
        transcript: result.data?.transcript?.substring(0, 200) + '...' // أول 200 حرف
      });
    } else {
      console.log('❌ اختبار تحويل الفيديو إلى نص من URL فشل!');
      console.log('🔍 الخطأ:', result);
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار تحويل الفيديو إلى نص من URL:', error.message);
  }
}

// تشغيل الاختبارات
async function runTests() {
  await testVideoToText();
  await testVideoToTextFromUrl();
}

runTests();