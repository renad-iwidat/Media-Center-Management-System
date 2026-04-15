/**
 * Test Flow
 * اختبار فلو معالجة الأخبار
 */

import FlowRouterService from '../services/news/flow-router.service';
import EditorialQueueService from '../services/news/editorial-queue.service';
import PublishedItemsService from '../services/news/published-items.service';

/**
 * اختبار شامل للفلو
 */
export async function testCompleteFlow(): Promise<void> {
  console.log('\n🧪 بدء اختبار فلو معالجة الأخبار...\n');

  try {
    // 1. اختبار معالجة الأخبار الجديدة
    console.log('1️⃣ اختبار معالجة الأخبار الجديدة');
    console.log('─'.repeat(50));
    const routingResult = await FlowRouterService.processNewArticles();
    console.log(`✅ النتيجة: ${routingResult.message}`);
    console.log(`   - معالج: ${routingResult.processedCount}`);
    console.log(`   - أوتوماتيكي: ${routingResult.automatedCount}`);
    console.log(`   - تحريري: ${routingResult.editorialCount}`);

    if (routingResult.errors.length > 0) {
      console.log(`⚠️ أخطاء: ${routingResult.errors.length}`);
      routingResult.errors.forEach(err => console.log(`   - ${err}`));
    }

    // 2. اختبار جلب الأخبار المعلقة
    console.log('\n2️⃣ اختبار جلب الأخبار المعلقة');
    console.log('─'.repeat(50));
    const pendingItems = await EditorialQueueService.getPendingItems();
    console.log(`✅ وجدنا ${pendingItems.length} خبر معلق`);

    if (pendingItems.length > 0) {
      const firstItem = pendingItems[0];
      console.log(`   - الخبر الأول: ${firstItem.title}`);
      console.log(`   - الفئة: ${firstItem.category_name}`);
      console.log(`   - الوحدة: ${firstItem.media_unit_name}`);

      // 3. اختبار جلب عنصر واحد
      console.log('\n3️⃣ اختبار جلب عنصر واحد من الطابور');
      console.log('─'.repeat(50));
      const singleItem = await EditorialQueueService.getQueueItem(firstItem.id);
      if (singleItem) {
        console.log(`✅ تم جلب العنصر: ${singleItem.title}`);
      }
    }

    // 4. اختبار إحصائيات الطابور
    console.log('\n4️⃣ اختبار إحصائيات الطابور');
    console.log('─'.repeat(50));
    const queueStats = await EditorialQueueService.getQueueStats();
    console.log(`✅ وجدنا ${queueStats.length} وحدة إعلام`);
    queueStats.forEach(stat => {
      console.log(`   - ${stat.name}:`);
      console.log(`     • معلق: ${stat.pending_count}`);
      console.log(`     • قيد المراجعة: ${stat.in_review_count}`);
      console.log(`     • معتمد: ${stat.approved_count}`);
      console.log(`     • مرفوض: ${stat.rejected_count}`);
    });

    // 5. اختبار جلب المحتوى المنشور
    console.log('\n5️⃣ اختبار جلب المحتوى المنشور');
    console.log('─'.repeat(50));
    const published = await PublishedItemsService.getAllPublished(5);
    console.log(`✅ وجدنا ${published.length} محتوى منشور`);

    if (published.length > 0) {
      const firstPublished = published[0];
      console.log(`   - الخبر الأول: ${firstPublished.title}`);
      console.log(`   - النوع: ${firstPublished.flow_type === 'automated' ? 'أوتوماتيكي' : 'تحريري'}`);
      console.log(`   - الفئة: ${firstPublished.category_name}`);
    }

    // 6. اختبار إحصائيات المحتوى المنشور
    console.log('\n6️⃣ اختبار إحصائيات المحتوى المنشور');
    console.log('─'.repeat(50));
    const publishedStats = await PublishedItemsService.getPublishedStats();
    console.log(`✅ الإحصائيات:`);
    console.log(`   - إجمالي: ${publishedStats.total_published}`);
    console.log(`   - أوتوماتيكي: ${publishedStats.automated_count}`);
    console.log(`   - تحريري: ${publishedStats.editorial_count}`);

    if (publishedStats.by_category.length > 0) {
      console.log(`   - الفئات:`);
      publishedStats.by_category.forEach(cat => {
        console.log(`     • ${cat.category}: ${cat.count}`);
      });
    }

    if (publishedStats.by_media_unit.length > 0) {
      console.log(`   - الوحدات:`);
      publishedStats.by_media_unit.forEach(unit => {
        console.log(`     • ${unit.media_unit}: ${unit.count}`);
      });
    }

    // 7. اختبار جلب محتوى حسب الفئة
    console.log('\n7️⃣ اختبار جلب محتوى حسب الفئة');
    console.log('─'.repeat(50));
    if (publishedStats.by_category.length > 0) {
      const firstCategory = publishedStats.by_category[0].category;
      const categoryItems = await PublishedItemsService.getPublishedByCategory(
        firstCategory,
        5
      );
      console.log(`✅ وجدنا ${categoryItems.length} محتوى من فئة "${firstCategory}"`);
    }

    // 8. اختبار جلب محتوى حسب نوع الفلو
    console.log('\n8️⃣ اختبار جلب محتوى حسب نوع الفلو');
    console.log('─'.repeat(50));
    const automatedItems = await PublishedItemsService.getPublishedByFlow(
      'automated',
      5
    );
    console.log(`✅ وجدنا ${automatedItems.length} محتوى أوتوماتيكي`);

    const editorialItems = await PublishedItemsService.getPublishedByFlow(
      'editorial',
      5
    );
    console.log(`✅ وجدنا ${editorialItems.length} محتوى تحريري`);

    console.log('\n✅ انتهى الاختبار بنجاح!\n');
  } catch (error) {
    console.error('\n❌ خطأ في الاختبار:', error);
    throw error;
  }
}

/**
 * اختبار سريع للـ API
 */
export async function testAPIEndpoints(): Promise<void> {
  console.log('\n🧪 اختبار API Endpoints...\n');

  const baseUrl = 'http://localhost:3000/api/flow';

  try {
    // 1. اختبار معالجة الأخبار
    console.log('1️⃣ اختبار POST /api/flow/process');
    const processResponse = await fetch(`${baseUrl}/process`, {
      method: 'POST',
    });
    const processData = await processResponse.json();
    console.log(`✅ الاستجابة:`, processData.message);

    // 2. اختبار جلب الطابور
    console.log('\n2️⃣ اختبار GET /api/flow/queue/pending');
    const queueResponse = await fetch(`${baseUrl}/queue/pending`);
    const queueData = await queueResponse.json();
    console.log(`✅ وجدنا ${queueData.count} عنصر معلق`);

    // 3. اختبار إحصائيات الطابور
    console.log('\n3️⃣ اختبار GET /api/flow/queue/stats');
    const statsResponse = await fetch(`${baseUrl}/queue/stats`);
    const statsData = await statsResponse.json();
    console.log(`✅ وجدنا ${statsData.data.length} وحدة إعلام`);

    // 4. اختبار جلب المحتوى المنشور
    console.log('\n4️⃣ اختبار GET /api/flow/published');
    const publishedResponse = await fetch(`${baseUrl}/published?limit=5`);
    const publishedData = await publishedResponse.json();
    console.log(`✅ وجدنا ${publishedData.count} محتوى منشور`);

    // 5. اختبار إحصائيات المحتوى
    console.log('\n5️⃣ اختبار GET /api/flow/published/stats');
    const publishedStatsResponse = await fetch(`${baseUrl}/published/stats`);
    const publishedStatsData = await publishedStatsResponse.json();
    console.log(`✅ إجمالي المنشور: ${publishedStatsData.data.total_published}`);

    console.log('\n✅ انتهى اختبار API بنجاح!\n');
  } catch (error) {
    console.error('\n❌ خطأ في اختبار API:', error);
    throw error;
  }
}

/**
 * تشغيل جميع الاختبارات
 */
export async function runAllTests(): Promise<void> {
  try {
    await testCompleteFlow();
    // await testAPIEndpoints(); // يتطلب تشغيل الـ server
  } catch (error) {
    console.error('❌ خطأ في الاختبارات:', error);
    process.exit(1);
  }
}

// تشغيل الاختبارات إذا تم استدعاء الفايل مباشرة
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ خطأ:', error);
      process.exit(1);
    });
}
