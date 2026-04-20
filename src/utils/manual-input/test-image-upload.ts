/**
 * اختبار رفع الصور
 * Test Image Upload Feature
 */

import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

async function testImageUpload() {
  console.log('🧪 اختبار رفع الصور...\n');

  try {
    // 1. التحقق من الاتصال بالـ API
    console.log('1️⃣ التحقق من الاتصال بالـ API...');
    const healthCheck = await axios.get(`${API_URL}/health`);
    console.log('✅ الاتصال بالـ API:', healthCheck.data);

    // 2. جلب قائمة المستخدمين
    console.log('\n2️⃣ جلب قائمة المستخدمين...');
    const usersRes = await axios.get(`${API_URL}/manual-input/users`);
    const users = usersRes.data.data;
    console.log(`✅ عدد المستخدمين: ${users.length}`);
    const testUser = users[0];
    console.log(`   المستخدم للاختبار: ${testUser.name} (ID: ${testUser.id})`);

    // 3. جلب قائمة الوحدات الإعلامية
    console.log('\n3️⃣ جلب قائمة الوحدات الإعلامية...');
    const mediaUnitsRes = await axios.get(`${API_URL}/manual-input/media-units`);
    const mediaUnits = mediaUnitsRes.data.data;
    console.log(`✅ عدد الوحدات: ${mediaUnits.length}`);
    const testMediaUnit = mediaUnits[0];
    console.log(`   الوحدة للاختبار: ${testMediaUnit.name} (ID: ${testMediaUnit.id})`);

    // 4. إنشاء صورة اختبار (1x1 pixel PNG)
    console.log('\n4️⃣ إنشاء صورة اختبار...');
    const testImagePath = path.join(__dirname, 'test-image.png');
    
    // PNG 1x1 pixel (أصغر صورة ممكنة)
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log(`✅ تم إنشاء صورة اختبار: ${testImagePath}`);
    console.log(`   الحجم: ${pngBuffer.length} bytes`);

    // 5. رفع الصورة
    console.log('\n5️⃣ رفع الصورة...');
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testImagePath));
    formData.append('uploaded_by', testUser.id.toString());
    formData.append('media_unit_id', testMediaUnit.id.toString());
    formData.append('title', 'Test Image Upload');

    const uploadRes = await axios.post(
      `${API_URL}/manual-input/upload-image`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    console.log('✅ تم رفع الصورة بنجاح!');
    console.log('   البيانات:', JSON.stringify(uploadRes.data, null, 2));

    // 6. التحقق من رابط S3
    console.log('\n6️⃣ التحقق من رابط S3...');
    const imageUrl = uploadRes.data.data.file_url;
    console.log(`   الرابط: ${imageUrl}`);
    
    const s3Check = await axios.head(imageUrl);
    console.log(`✅ الصورة موجودة على S3 (Status: ${s3Check.status})`);

    // 7. حذف الصورة الاختبارية
    console.log('\n7️⃣ تنظيف...');
    fs.unlinkSync(testImagePath);
    console.log('✅ تم حذف الصورة الاختبارية');

    console.log('\n✅ اكتمل الاختبار بنجاح!');
    console.log('\n📝 الخلاصة:');
    console.log('   - رفع الصورة: ✅');
    console.log('   - حفظ في قاعدة البيانات: ✅');
    console.log('   - رفع على S3: ✅');
    console.log('   - الرابط يعمل: ✅');

  } catch (error: any) {
    console.error('\n❌ فشل الاختبار:', error.message);
    
    if (error.response) {
      console.error('   الاستجابة:', error.response.data);
      console.error('   الحالة:', error.response.status);
    }
    
    // حذف الصورة الاختبارية في حالة الفشل
    const testImagePath = path.join(__dirname, 'test-image.png');
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }
    
    process.exit(1);
  }
}

// تشغيل الاختبار
testImageUpload();
