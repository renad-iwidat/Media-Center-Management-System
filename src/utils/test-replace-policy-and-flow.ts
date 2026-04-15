/**
 * Test Replace Policy & Editorial Flow
 * اختبار شامل لسياسة Replace والفلو الكامل
 */

import axios from 'axios';
import * as db from '../config/database';

const API_BASE = 'http://localhost:3000/api';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_ARTICLE = {
  title: 'الجيش الإسرائيلي يشن هجوم انتحاري على غزة',
  content: `
    شنت قوات الاحتلال الإسرائيلي غارات جوية مكثفة على قطاع غزة اليوم الأربعاء.
    وقال الناطق باسم جيش الدفاع الإسرائيلي إن العملية استهدفت مخابر فلسطينية.
    وأسفرت الغارات عن استشهاد عدد من المدنيين وإصابة عشرات آخرين.
    وأضاف أن فرق الإنقاذ تعمل على انتشال الجثث من تحت الأنقاض.
    وأشار إلى أن البنية التحتية تعرضت لأضرار جسيمة.
    وقال مراقبون إن هذا الهجوم الانتحاري يعكس التصعيد المستمر.
  `,
};

// ============================================================================
// UTILITIES
// ============================================================================

function printSection(title: string, width: number = 100) {
  console.log(`\n${'█'.repeat(width)}`);
  console.log(`█ ${title}`);
  console.log(`${'█'.repeat(width)}\n`);
}

function printSubSection(title: string, width: number = 100) {
  console.log(`\n${'═'.repeat(width)}`);
  console.log(`${title}`);
  console.log(`${'═'.repeat(width)}\n`);
}

// ============================================================================
// TEST 1: REPLACE POLICY DIRECT TEST
// ============================================================================

async function testReplacePolicy() {
  printSection('TEST 1: اختبار سياسة Replace مباشرة');

  try {
    console.log('📤 إرسال الطلب للـ API...\n');
    console.log(`النص الأصلي:\n${TEST_ARTICLE.content}\n`);

    const response = await axios.post(
      `${API_BASE}/news/editorial-policies/apply`,
      {
        policyName: 'replace',
        text: TEST_ARTICLE.content,
      },
      { timeout: 120000 }
    );

    const result = response.data;

    console.log('📡 النتيجة:\n');
    console.log(`السياسة: ${result.policy.name}`);
    console.log(`النوع: ${result.policy.taskType}`);
    console.log(`الوقت: ${result.executionTime}ms`);
    console.log(`تغييرات: ${result.hasChanges ? 'نعم' : 'لا'}\n`);

    if (result.changes) {
      console.log('التغييرات المطبقة:');
      console.log(`  - عدد التغييرات: ${result.changes.totalChanges}`);
      if (result.changes.changesMade && result.changes.changesMade.length > 0) {
        console.log(`  - التغييرات:`);
        result.changes.changesMade.forEach((change: string) => {
          console.log(`    • ${change}`);
        });
      }
    }

    console.log(`\nالنص المعدّل:\n${result.modifiedText}\n`);

    return {
      success: true,
      modifiedText: result.modifiedText,
      changes: result.changes,
    };
  } catch (error: any) {
    console.error('❌ خطأ:', error?.response?.data?.error || error?.message);
    return { success: false };
  }
}

// ============================================================================
// TEST 2: REPLACE POLICY WITH QUEUE ITEM
// ============================================================================

async function testReplacePolicyWithQueue() {
  printSection('TEST 2: اختبار سياسة Replace مع خبر من الطابور');

  try {
    // جلب أول خبر من الطابور
    console.log('🔍 جاري البحث عن خبر في الطابور...\n');

    const queueResult = await db.query(
      `SELECT 
        eq.id as queue_id,
        eq.media_unit_id,
        eq.raw_data_id,
        rd.title,
        rd.content,
        c.name as category_name,
        mu.name as media_unit_name
      FROM editorial_queue eq
      JOIN raw_data rd ON eq.raw_data_id = rd.id
      JOIN categories c ON rd.category_id = c.id
      JOIN media_units mu ON eq.media_unit_id = mu.id
      LIMIT 1`
    );

    if (queueResult.rows.length === 0) {
      console.log('⚠️  لا توجد أخبار في الطابور');
      return { success: false };
    }

    const article = queueResult.rows[0];
    console.log(`✅ وجدنا خبر:`);
    console.log(`   ID: ${article.queue_id}`);
    console.log(`   العنوان: ${article.title}`);
    console.log(`   الفئة: ${article.category_name}`);
    console.log(`   الوحدة: ${article.media_unit_name}\n`);

    console.log('📤 إرسال الطلب للـ API...\n');

    const response = await axios.post(
      `${API_BASE}/news/editorial-policies/apply`,
      {
        policyName: 'replace',
        queueId: article.queue_id,
      },
      { timeout: 120000 }
    );

    const result = response.data;

    console.log('📡 النتيجة:\n');
    console.log(`السياسة: ${result.policy.name}`);
    console.log(`النوع: ${result.policy.taskType}`);
    console.log(`الوقت: ${result.executionTime}ms`);
    console.log(`تغييرات: ${result.hasChanges ? 'نعم' : 'لا'}\n`);

    if (result.changes) {
      console.log('التغييرات المطبقة:');
      console.log(`  - عدد التغييرات: ${result.changes.totalChanges}`);
      if (result.changes.changesMade && result.changes.changesMade.length > 0) {
        console.log(`  - التغييرات:`);
        result.changes.changesMade.forEach((change: string) => {
          console.log(`    • ${change}`);
        });
      }
    }

    console.log(`\nالنص الأصلي (أول 300 حرف):\n${result.originalText.substring(0, 300)}...\n`);
    console.log(`النص المعدّل (أول 300 حرف):\n${result.modifiedText.substring(0, 300)}...\n`);

    return {
      success: true,
      queueId: article.queue_id,
      modifiedText: result.modifiedText,
      changes: result.changes,
    };
  } catch (error: any) {
    console.error('❌ خطأ:', error?.response?.data?.error || error?.message);
    return { success: false };
  }
}

// ============================================================================
// TEST 3: FULL PIPELINE TEST
// ============================================================================

async function testFullPipeline() {
  printSection('TEST 3: اختبار Pipeline كامل (جميع السياسات بالترتيب)');

  try {
    const policies = [
      'content_validation',
      'classify',
      'replace',
      'remove',
      'rewrite',
      'cleanup',
      'formatting',
    ];

    console.log(`📋 السياسات المراد تطبيقها: ${policies.join(' → ')}\n`);

    // جلب السياسات من الـ API
    console.log('📤 جاري جلب السياسات من الـ API...\n');

    const pipelineResponse = await axios.post(
      `${API_BASE}/news/editorial-policies/pipeline`,
      {
        text: TEST_ARTICLE.content,
        policyNames: policies,
      },
      { timeout: 120000 }
    );

    const pipelineData = pipelineResponse.data;

    console.log('✅ تم جلب السياسات بنجاح\n');
    console.log(`عدد السياسات: ${pipelineData.policies.length}\n`);

    // تطبيق السياسات واحدة تلو الأخرى
    let currentText = TEST_ARTICLE.content;
    const results: any[] = [];

    for (let i = 0; i < pipelineData.policies.length; i++) {
      const policy = pipelineData.policies[i];
      console.log(`\n${'─'.repeat(100)}`);
      console.log(`${i + 1}. تطبيق السياسة: ${policy.name}`);
      console.log(`${'─'.repeat(100)}\n`);

      try {
        const response = await axios.post(
          `${API_BASE}/news/editorial-policies/apply`,
          {
            policyName: policy.name,
            text: currentText,
          },
          { timeout: 120000 }
        );

        const result = response.data;
        results.push({
          name: policy.name,
          status: 'success',
          time: result.executionTime,
          hasChanges: result.hasChanges,
        });

        console.log(`✅ نجحت`);
        console.log(`   الوقت: ${result.executionTime}ms`);
        console.log(`   تغييرات: ${result.hasChanges ? 'نعم' : 'لا'}`);

        // تحديث النص للسياسة التالية إذا كانت تعديلية
        if (result.modifiedText && result.policy.isModifying) {
          currentText = result.modifiedText;
          console.log(`   النص المعدّل (أول 100 حرف): ${result.modifiedText.substring(0, 100)}...`);
        }
      } catch (error: any) {
        console.error(`❌ فشلت`);
        console.error(`   الخطأ: ${error?.response?.data?.error || error?.message}`);
        results.push({
          name: policy.name,
          status: 'error',
          error: error?.response?.data?.error || error?.message,
        });
      }
    }

    // ملخص النتائج
    printSubSection('ملخص نتائج Pipeline');

    const successful = results.filter((r) => r.status === 'success').length;
    const failed = results.filter((r) => r.status === 'error').length;
    const totalTime = results
      .filter((r) => r.status === 'success')
      .reduce((sum, r) => sum + r.time, 0);

    console.log(`✅ نجح: ${successful}/${results.length}`);
    console.log(`❌ فشل: ${failed}/${results.length}`);
    console.log(`⏱️  إجمالي الوقت: ${totalTime}ms\n`);

    console.log('📋 تفاصيل كل سياسة:\n');
    results.forEach((r, i) => {
      const status = r.status === 'success' ? '✅' : '❌';
      console.log(`${i + 1}. ${status} ${r.name}`);
      if (r.status === 'success') {
        console.log(`   - الوقت: ${r.time}ms`);
        console.log(`   - تغييرات: ${r.hasChanges ? 'نعم' : 'لا'}`);
      } else {
        console.log(`   - الخطأ: ${r.error}`);
      }
    });

    console.log(`\n📝 النص النهائي (أول 500 حرف):\n${currentText.substring(0, 500)}...\n`);

    return {
      success: failed === 0,
      results,
      finalText: currentText,
    };
  } catch (error: any) {
    console.error('❌ خطأ:', error?.response?.data?.error || error?.message);
    return { success: false };
  }
}

// ============================================================================
// TEST 4: FLOW ROUTING TEST
// ============================================================================

async function testFlowRouting() {
  printSection('TEST 4: اختبار توجيه الأخبار (Flow Routing)');

  try {
    // جلب إحصائيات الأخبار
    console.log('📊 جاري جلب إحصائيات الأخبار...\n');

    const statsResult = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM raw_data WHERE fetch_status = 'fetched') as new_articles,
        (SELECT COUNT(*) FROM editorial_queue WHERE status = 'pending') as pending_queue,
        (SELECT COUNT(*) FROM published_items) as published_items
    `);

    const stats = statsResult.rows[0];

    console.log('📈 الإحصائيات الحالية:');
    console.log(`   - أخبار جديدة (fetch_status = 'fetched'): ${stats.new_articles}`);
    console.log(`   - أخبار في الطابور (pending): ${stats.pending_queue}`);
    console.log(`   - أخبار منشورة: ${stats.published_items}\n`);

    if (stats.new_articles === 0) {
      console.log('⚠️  لا توجد أخبار جديدة للمعالجة');
      return { success: false };
    }

    // جلب عينة من الأخبار الجديدة
    console.log('📰 جاري جلب عينة من الأخبار الجديدة...\n');

    const articlesResult = await db.query(`
      SELECT 
        rd.id,
        rd.title,
        rd.content,
        rd.category_id,
        c.name as category_name,
        c.flow
      FROM raw_data rd
      JOIN categories c ON rd.category_id = c.id
      WHERE rd.fetch_status = 'fetched'
      LIMIT 5
    `);

    const articles = articlesResult.rows;

    console.log(`وجدنا ${articles.length} أخبار:\n`);
    articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title}`);
      console.log(`   - الفئة: ${article.category_name}`);
      console.log(`   - المسار: ${article.flow === 'automated' ? '🚀 أوتوماتيكي' : '📝 تحريري'}\n`);
    });

    return {
      success: true,
      stats,
      articles,
    };
  } catch (error: any) {
    console.error('❌ خطأ:', error?.message);
    return { success: false };
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.clear();
  printSection('اختبار شامل: سياسة Replace والفلو الكامل', 100);

  try {
    // اختبار الاتصال بقاعدة البيانات
    console.log('🔗 اختبار الاتصال بقاعدة البيانات...\n');
    await db.testConnection();
    console.log();

    // Test 1: Replace Policy Direct
    const test1 = await testReplacePolicy();

    // Test 2: Replace Policy with Queue
    const test2 = await testReplacePolicyWithQueue();

    // Test 3: Full Pipeline
    const test3 = await testFullPipeline();

    // Test 4: Flow Routing
    const test4 = await testFlowRouting();

    // ملخص عام
    printSection('ملخص عام للاختبارات', 100);

    console.log('📋 نتائج الاختبارات:\n');
    console.log(`1. Replace Policy Direct: ${test1.success ? '✅ نجح' : '❌ فشل'}`);
    console.log(`2. Replace Policy with Queue: ${test2.success ? '✅ نجح' : '❌ فشل'}`);
    console.log(`3. Full Pipeline: ${test3.success ? '✅ نجح' : '❌ فشل'}`);
    console.log(`4. Flow Routing: ${test4.success ? '✅ نجح' : '❌ فشل'}\n`);

    const allSuccess = test1.success && test2.success && test3.success && test4.success;
    console.log(allSuccess ? '✅ جميع الاختبارات نجحت!' : '⚠️  بعض الاختبارات فشلت');
    console.log();
  } catch (error) {
    console.error('❌ خطأ عام:', error);
  }
}

// تشغيل البرنامج
main().catch(console.error);
