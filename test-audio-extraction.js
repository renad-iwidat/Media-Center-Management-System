/**
 * اختبار خدمة استخراج الصوت
 * Audio Extraction Service Test
 */

const fetch = require('node-fetch');

async function testAudioExtraction() {
  try {
    console.log('🧪 اختبار خدمة استخراج الصوت...');
    
    // اختبار استخراج الصوت من S3
    const response = await fetch('http://localhost:4000/api/ai-hub/audio/extract-from-s3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Url: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-تست-مين-المراسل-والصوت-1776609101440-cu64zv.mp4',
        outputFormat: 'mp3',
        bitrate: '128k'
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ اختبار استخراج الصوت نجح!');
      console.log('📝 النتيجة:', {
        success: result.success,
        audioSize: result.data?.audioBuffer?.length || 'غير محدد',
        format: result.data?.format,
        bitrate: result.data?.bitrate
      });
    } else {
      console.log('❌ اختبار استخراج الصوت فشل!');
      console.log('🔍 الخطأ:', result);
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار استخراج الصوت:', error.message);
  }
}

async function testSTTIntegration() {
  try {
    console.log('\n🧪 اختبار التكامل مع STT...');
    
    // اختبار استخراج الصوت ثم تحويله لنص
    const extractResponse = await fetch('http://localhost:4000/api/ai-hub/audio/extract-from-s3', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        s3Url: 'https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-تست-مين-المراسل-والصوت-1776609101440-cu64zv.mp3',
        outputFormat: 'mp3'
      })
    });

    if (extractResponse.ok) {
      const extractResult = await extractResponse.json();
      console.log('✅ استخراج الصوت نجح');
      
      // الآن جرب تحويل الصوت لنص
      if (extractResult.data?.audioUrl) {
        const sttResponse = await fetch('http://localhost:4000/api/ai-hub/stt/transcribe-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioUrl: extractResult.data.audioUrl,
            language: 'ar'
          })
        });

        const sttResult = await sttResponse.json();
        
        if (sttResponse.ok) {
          console.log('✅ تحويل الصوت لنص نجح!');
          console.log('📝 النص:', sttResult.data?.transcript?.substring(0, 100) + '...');
        } else {
          console.log('❌ تحويل الصوت لنص فشل!');
          console.log('🔍 الخطأ:', sttResult);
        }
      }
    } else {
      console.log('❌ استخراج الصوت فشل في التكامل');
    }
  } catch (error) {
    console.error('❌ خطأ في اختبار التكامل:', error.message);
  }
}

// تشغيل الاختبارات
async function runTests() {
  await testAudioExtraction();
  await testSTTIntegration();
}

runTests();