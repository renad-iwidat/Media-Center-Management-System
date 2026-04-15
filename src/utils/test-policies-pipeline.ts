/**
 * اختبار Pipeline سياسات التحرير على خبر محدد
 * Test Editorial Policies Pipeline on Queue Item #50
 */

import axios from 'axios';
import * as db from '../config/database';

const API_BASE = 'http://localhost:3000/api';
const AI_API_URL = process.env.AI_MODEL || 'http://93.127.132.59:8080';

/**
 * السياسات اللي بدنا نطبقها بالترتيب
 */
const POLICIES_TO_TEST = [
  'content_validation',  // فحص صلاحية المحتوى
  'classify',            // تصنيف نوع المحتوى
  'replace',             // استبدال المصطلحات
  'remove',              // حذف المصطلحات الممنوعة
  'rewrite',             // إعادة الصياغة
  'cleanup',             // التنظيف التقني
  'formatting',          // التنسيق
];

interface PolicyResult {
  policyName: string;
  status: string;
  executionTime: number;
  hasChanges: boolean;
  modifiedText?: string;
  error?: string;
}

/**
 * الدالة الرئيسية للاختبار
 */
async function testPoliciesPipeline() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 اختبار Pipeline سياسات التحرير على الخبر رقم 50');
  console.log('='.repeat(80) + '\n');

  try {
    // 1. جلب الخبر من الـ queue
    console.log('📍 الخطوة 1: جلب الخبر رقم 50 من الـ queue...\n');
    const queueResult = await db.query(
      `SELECT 
        eq.id as queue_id,
        eq.media_unit_id,
        eq.raw_data_id,
        eq.status,
        rd.title,
        rd.content,
        rd.category_id,
        c.name as category_name,
        mu.name as media_unit_name
      FROM editorial_queue eq
      JOIN raw_data rd ON eq.raw_data_id = rd.id
      JOIN categories c ON rd.category_id = c.id
      JOIN media_units mu ON eq.media_unit_id = mu.id
      WHERE eq.id = 50`,
      []
    );

    if (queueResult.rows.length === 0) {
      console.error('❌ الخبر رقم 50 غير موجود في الـ queue');
      return;
    }

    const article = queueResult.rows[0];
    console.log('✅ تم جلب الخبر بنجاح');
    console.log(`   ID: ${article.queue_id}`);
    console.log(`   العنوان: ${article.title.substring(0, 80)}...`);
    console.log(`   الفئة: ${article.category_name}`);
    console.log(`   الوحدة: ${article.media_unit_name}`);
    console.log(`   الحالة: ${article.status}`);
    console.log(`   طول المحتوى: ${article.content.length} حرف\n`);

    // 2. تطبيق السياسات بالترتيب
    console.log('📍 الخطوة 2: تطبيق السياسات بالترتيب...\n');

    const results: PolicyResult[] = [];
    let currentText = article.content;

    for (const policyName of POLICIES_TO_TEST) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`🔄 تطبيق السياسة: ${policyName}`);
      console.log(`${'─'.repeat(80)}`);

      try {
        const startTime = Date.now();

        // تطبيق السياسة
        const response = await axios.post(
          `${API_BASE}/news/editorial-policies/apply`,
          {
            policyName,
            queueId: article.queue_id,
          },
          { timeout: 120000 }
        );

        const executionTime = Date.now() - startTime;
        const policyData = response.data;

        // تحديث النص للسياسة التالية إذا كانت تعديلية
        if (policyData.modifiedText && policyData.policy.isModifying) {
          currentText = policyData.modifiedText;
        }

        const result: PolicyResult = {
          policyName,
          status: policyData.policy.isModifying ? 'تعديل' : 'فحص',
          executionTime,
          hasChanges: policyData.hasChanges || false,
          modifiedText: policyData.modifiedText,
        };

        results.push(result);

        // طباعة النتائج
        console.log(`✅ النتيجة:`);
        console.log(`   النوع: ${result.status}`);
        console.log(`   الوقت: ${result.executionTime}ms`);
        console.log(`   تغييرات: ${result.hasChanges ? 'نعم' : 'لا'}`);

        if (policyData.changes) {
          console.log(`   عدد التغييرات: ${policyData.changes.totalChanges || 0}`);
          if (policyData.changes.changesMade?.length > 0) {
            console.log(`   التغييرات: ${policyData.changes.changesMade.slice(0, 3).join(', ')}`);
          }
        }

        if (policyData.inspection && Object.keys(policyData.inspection).length > 0) {
          console.log(`   نتائج الفحص:`, JSON.stringify(policyData.inspection).substring(0, 100));
        }

        if (policyData.modifiedText) {
          console.log(`   النص المعدّل (أول 150 حرف): ${policyData.modifiedText.substring(0, 150)}...`);
        }
      } catch (error: any) {
        console.error(`❌ خطأ في تطبيق السياسة:`);
        console.error(`   ${error?.response?.data?.error || error?.message}`);

        results.push({
          policyName,
          status: 'خطأ',
          executionTime: 0,
          hasChanges: false,
          error: error?.response?.data?.error || error?.message,
        });
      }
    }

    // 3. ملخص النتائج
    console.log('\n' + '='.repeat(80));
    console.log('📊 ملخص النتائج');
    console.log('='.repeat(80) + '\n');

    const successCount = results.filter(r => r.status !== 'خطأ').length;
    const errorCount = results.filter(r => r.status === 'خطأ').length;
    const changesCount = results.filter(r => r.hasChanges).length;
    const totalTime = results.reduce((sum, r) => sum + r.executionTime, 0);

    console.log(`✅ السياسات الناجحة: ${successCount}/${POLICIES_TO_TEST.length}`);
    console.log(`❌ السياسات الفاشلة: ${errorCount}/${POLICIES_TO_TEST.length}`);
    console.log(`📝 السياسات اللي عملت تغييرات: ${changesCount}/${POLICIES_TO_TEST.length}`);
    console.log(`⏱️  الوقت الإجمالي: ${totalTime}ms\n`);

    // جدول النتائج
    console.log('📋 جدول النتائج:\n');
    console.log('┌─────────────────────────┬──────────┬──────────┬────────────┬──────────┐');
    console.log('│ السياسة                 │ النوع    │ الحالة   │ الوقت (ms) │ تغييرات │');
    console.log('├─────────────────────────┼──────────┼──────────┼────────────┼──────────┤');

    results.forEach(r => {
      const policyName = r.policyName.padEnd(23);
      const type = r.status.padEnd(8);
      const status = (r.error ? '❌' : '✅').padEnd(8);
      const time = r.executionTime.toString().padEnd(10);
      const changes = (r.hasChanges ? 'نعم' : 'لا').padEnd(8);
      console.log(`│ ${policyName} │ ${type} │ ${status} │ ${time} │ ${changes} │`);
    });

    console.log('└─────────────────────────┴──────────┴──────────┴────────────┴──────────┘\n');

    // 4. JSON Output
    console.log('📄 JSON Output:\n');
    const jsonOutput = {
      testInfo: {
        queueId: article.queue_id,
        title: article.title,
        category: article.category_name,
        mediaUnit: article.media_unit_name,
        contentLength: article.content.length,
        testDate: new Date().toISOString(),
      },
      summary: {
        totalPolicies: POLICIES_TO_TEST.length,
        successCount,
        errorCount,
        changesCount,
        totalExecutionTime: totalTime,
      },
      results,
    };

    console.log(JSON.stringify(jsonOutput, null, 2));

    // 5. حفظ النتائج في ملف
    const fs = require('fs');
    const outputPath = `./test-results-queue-50-${Date.now()}.json`;
    fs.writeFileSync(outputPath, JSON.stringify(jsonOutput, null, 2));
    console.log(`\n✅ تم حفظ النتائج في: ${outputPath}\n`);
  } catch (error) {
    console.error('❌ خطأ عام:', error instanceof Error ? error.message : error);
  } finally {
    process.exit(0);
  }
}

// تشغيل الاختبار
testPoliciesPipeline();
