/**
 * اختبار سريع لخدمة استخراج الصوت
 * Quick Audio Extraction Test
 */

const { extractAudioFromFile } = require('./dist/services/ai-hub/audio-extraction.service');
const fs = require('fs');
const path = require('path');

async function quickTest() {
  try {
    console.log('🧪 اختبار سريع لاستخراج الصوت...');
    
    // إنشاء ملف فيديو وهمي للاختبار (يمكنك استبداله بملف حقيقي)
    const testVideoPath = 'test-video.mp4';
    
    if (!fs.existsSync(testVideoPath)) {
      console.log('❌ ملف الاختبار غير موجود. يرجى وضع ملف فيديو باسم test-video.mp4');
      return;
    }

    console.log('📁 ملف الاختبار موجود، بدء الاستخراج...');
    
    const audioBuffer = await extractAudioFromFile(testVideoPath, {
      outputFormat: 'mp3',
      bitrate: '128k'
    });

    console.log(`✅ تم استخراج الصوت بنجاح! الحجم: ${audioBuffer.length} bytes`);
    
    // حفظ الصوت المستخرج
    fs.writeFileSync('extracted-audio.mp3', audioBuffer);
    console.log('💾 تم حفظ الصوت في extracted-audio.mp3');
    
  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error.message);
  }
}

// تشغيل الاختبار
quickTest();