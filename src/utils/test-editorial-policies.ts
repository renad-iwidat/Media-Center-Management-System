/**
 * اختبار سياسات التحرير
 * Test Editorial Policies
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api/news/editorial-policies';

/**
 * اختبار تطبيق سياسة واحدة
 */
async function testSinglePolicy() {
  console.log('\n🧪 اختبار تطبيق سياسة واحدة (Replace)...\n');

  try {
    const response = await axios.post(`${API_BASE}/apply`, {
      policyName: 'replace',
      text: 'الجيش الإسرائيلي قصف المدينة بقوة',
    });

    console.log('✅ النتيجة:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ خطأ:', error instanceof Error ? error.message : error);
  }
}

/**
 * اختبار تطبيق Pipeline
 */
async function testPipeline() {
  console.log('\n🧪 اختبار تطبيق Pipeline...\n');

  try {
    const response = await axios.post(`${API_BASE}/pipeline`, {
      text: 'الجيش الإسرائيلي قصف المدينة بقوة شديدة جداً',
      policyNames: ['replace', 'rewrite', 'formatting'],
    });

    console.log('✅ النتيجة:');
    console.log(`النص الأصلي: ${response.data.originalText}`);
    console.log(`النص النهائي: ${response.data.finalText}`);
    console.log(`إجمالي الوقت: ${response.data.totalExecutionTime}ms`);
    console.log('\n📊 تفاصيل كل سياسة:');
    
    response.data.pipelineResults.forEach((result: any, index: number) => {
      console.log(`\n${index + 1}. ${result.policyName} (${result.taskType})`);
      console.log(`   الـ Endpoint: ${result.endpoint}`);
      console.log(`   الحالة: ${result.status}`);
      console.log(`   الوقت: ${result.executionTime}ms`);
      if (result.status === 'success') {
        console.log(`   النص: ${result.modifiedText}`);
      }
    });
  } catch (error) {
    console.error('❌ خطأ:', error instanceof Error ? error.message : error);
  }
}

/**
 * اختبار جلب السياسات
 */
async function testGetPolicies() {
  console.log('\n🧪 اختبار جلب السياسات...\n');

  try {
    const response = await axios.get(API_BASE);

    console.log(`✅ عدد السياسات: ${response.data.count}`);
    console.log('\n📋 السياسات:');
    
    response.data.policies.forEach((policy: any) => {
      console.log(`  - ${policy.name} (${policy.task_type})`);
    });
  } catch (error) {
    console.error('❌ خطأ:', error instanceof Error ? error.message : error);
  }
}

/**
 * اختبار جلب سياسة واحدة
 */
async function testGetPolicyDetails() {
  console.log('\n🧪 اختبار جلب تفاصيل سياسة...\n');

  try {
    const response = await axios.get(`${API_BASE}/replace`);

    console.log('✅ تفاصيل السياسة:');
    console.log(`الاسم: ${response.data.policy.name}`);
    console.log(`النوع: ${response.data.policy.task_type}`);
    console.log(`الوصف: ${response.data.policy.description}`);
    console.log(`مفعّلة: ${response.data.policy.is_active}`);
  } catch (error) {
    console.error('❌ خطأ:', error instanceof Error ? error.message : error);
  }
}

/**
 * اختبار شامل
 */
async function runAllTests() {
  console.log('🚀 بدء اختبار سياسات التحرير...');
  console.log('═'.repeat(50));

  await testGetPolicies();
  await testGetPolicyDetails();
  await testSinglePolicy();
  await testPipeline();

  console.log('\n' + '═'.repeat(50));
  console.log('✅ انتهى الاختبار!');
}

// تشغيل الاختبارات
runAllTests().catch(console.error);
