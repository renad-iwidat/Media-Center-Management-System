import pool from '../../config/database';
import { ManualInputService } from '../../services/manual-input/ManualInputService';
import { ManualInputData } from '../../models/manual-input/ManualInput';

/**
 * سكربت اختبار الإدخال اليدوي (محدّث)
 */

async function testManualInput() {
  console.log('🧪 بدء اختبار الإدخال اليدوي (النسخة المحدثة)...\n');

  try {
    // 1. اختبار جلب التصنيفات
    console.log('1️⃣ اختبار جلب التصنيفات...');
    const categories = await ManualInputService.getActiveCategories();
    console.log(`✅ تم جلب ${categories.length} تصنيف`);
    console.log('التصنيفات:', categories.map(c => `${c.name} (${c.flow})`).join(', '));

    // 2. اختبار جلب المصادر الجديدة
    console.log('\n2️⃣ اختبار جلب المصادر الجديدة...');
    const sources = await ManualInputService.getManualInputSources();
    if (sources) {
      console.log('✅ المصادر موجودة:');
      console.log('  - نص:', sources.text);
      console.log('  - صوت:', sources.audio);
      console.log('  - فيديو:', sources.video);
    } else {
      console.log('❌ المصادر غير موجودة');
      return;
    }

    // 3. اختبار جلب مصدر النص فقط
    console.log('\n3️⃣ اختبار جلب مصدر النص فقط...');
    const textSource = await ManualInputService.getTextInputSource();
    if (textSource) {
      console.log('✅ مصدر النص:', textSource);
    } else {
      console.log('❌ مصدر النص غير موجود');
      return;
    }

    // 4. اختبار Validation
    console.log('\n4️⃣ اختبار Validation...');
    
    // بيانات غير صالحة
    const invalidData: ManualInputData = {
      source_id: textSource.id,
      source_type_id: textSource.source_type_id,
      category_id: categories[0].id,
      url: null,
      title: 'قصير', // أقل من 5 أحرف
      content: 'قصير جداً', // أقل من 20 حرف
      fetch_status: 'fetched',
      created_by: 1
    };

    const invalidValidation = ManualInputService.validateInput(invalidData);
    console.log('Validation للبيانات الغير صالحة:', invalidValidation);

    // بيانات صالحة
    const validData: ManualInputData = {
      source_id: textSource.id,
      source_type_id: textSource.source_type_id,
      category_id: categories[0].id,
      url: null,
      title: 'خبر تجريبي للاختبار - النسخة المحدثة',
      content: 'هذا محتوى تجريبي للاختبار يحتوي على أكثر من 20 حرف لضمان نجاح الـ validation. تم استخدام المصادر الجديدة المنفصلة.',
      tags: ['اختبار', 'تجريبي', 'محدث'],
      fetch_status: 'fetched',
      created_by: 1
    };

    const validValidation = ManualInputService.validateInput(validData);
    console.log('Validation للبيانات الصالحة:', validValidation);

    // 5. اختبار إضافة خبر (اختياري - يمكن تعطيله)
    console.log('\n5️⃣ هل تريد إضافة خبر تجريبي؟ (تم التخطي)');
    // Uncomment to actually insert test data:
    // const result = await ManualInputService.createManualInput(validData);
    // console.log('✅ تم إضافة الخبر:', result);

    console.log('\n✅ انتهى الاختبار بنجاح!');
    console.log('\n📊 ملخص:');
    console.log(`  - التصنيفات: ${categories.length}`);
    console.log(`  - مصدر النص: ID ${textSource.id}`);
    console.log(`  - مصدر الصوت: ID ${sources.audio.id}`);
    console.log(`  - مصدر الفيديو: ID ${sources.video.id}`);
    
  } catch (error) {
    console.error('❌ خطأ أثناء الاختبار:', error);
  } finally {
    await pool.end();
  }
}

testManualInput();
