/**
 * Process News Flow
 * تشغيل فلو معالجة الأخبار من السحب للنشر
 */

import FlowRouterService from '../services/news/flow-router.service';
import EditorialQueueService from '../services/news/editorial-queue.service';
import PublishedItemsService from '../services/news/published-items.service';

/**
 * تشغيل الفلو الكامل
 * 1. توجيه الأخبار الجديدة للمسار الصحيح
 * 2. عرض إحصائيات الطابور
 * 3. عرض إحصائيات المحتوى المنشور
 */
export async function runNewsFlow(): Promise<void> {
  console.log('\n🚀 بدء تشغيل فلو معالجة الأخبار...\n');

  try {
    // المرحلة 1: توجيه الأخبار الجديدة
    console.log('📰 المرحلة 1: توجيه الأخبار الجديدة');
    console.log('─'.repeat(50));
    const routingResult = await FlowRouterService.processNewArticles();

    console.log(`\n✅ النتيجة:`);
    console.log(`   - تمت معالجة: ${routingResult.processedCount} خبر`);
    console.log(`   - أخبار أوتوماتيكية: ${routingResult.automatedCount}`);
    console.log(`   - أخبار تحريرية: ${routingResult.editorialCount}`);

    if (routingResult.errors.length > 0) {
      console.log(`\n⚠️ أخطاء:`);
      routingResult.errors.forEach(err => console.log(`   - ${err}`));
    }

    // المرحلة 2: عرض طابور التحرير
    console.log('\n\n📝 المرحلة 2: طابور التحرير');
    console.log('─'.repeat(50));
    const queueStats = await EditorialQueueService.getQueueStats();

    console.log('\n📊 إحصائيات الطابور حسب وحدة الإعلام:');
    queueStats.forEach((stat: any) => {
      console.log(`\n   ${stat.name}:`);
      console.log(`     - معلق: ${stat.pending_count}`);
      console.log(`     - قيد المراجعة: ${stat.in_review_count}`);
      console.log(`     - معتمد: ${stat.approved_count}`);
      console.log(`     - مرفوض: ${stat.rejected_count}`);
    });

    // المرحلة 3: عرض المحتوى المنشور
    console.log('\n\n📤 المرحلة 3: المحتوى المنشور');
    console.log('─'.repeat(50));
    const publishedStats = await PublishedItemsService.getPublishedStats();

    console.log(`\n📊 إحصائيات المحتوى المنشور:`);
    console.log(`   - إجمالي المنشور: ${publishedStats.total_published}`);
    console.log(`   - أوتوماتيكي: ${publishedStats.automated_count}`);
    console.log(`   - تحريري: ${publishedStats.editorial_count}`);

    console.log(`\n📂 حسب الفئة:`);
    publishedStats.by_category.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat.count}`);
    });

    console.log(`\n🏢 حسب وحدة الإعلام:`);
    publishedStats.by_media_unit.forEach(unit => {
      console.log(`   - ${unit.media_unit}: ${unit.count}`);
    });

    console.log('\n\n✅ انتهى تشغيل الفلو بنجاح!\n');
  } catch (error) {
    console.error('\n❌ خطأ في تشغيل الفلو:', error);
    throw error;
  }
}

/**
 * عرض العناصر المعلقة في الطابور
 */
export async function showPendingItems(): Promise<void> {
  console.log('\n📋 العناصر المعلقة في طابور التحرير:\n');

  try {
    const pendingItems = await EditorialQueueService.getPendingItems();

    if (pendingItems.length === 0) {
      console.log('✅ لا توجد عناصر معلقة');
      return;
    }

    pendingItems.forEach((item, index) => {
      console.log(`${index + 1}. [ID: ${item.id}] ${item.title}`);
      console.log(`   - الوحدة: ${item.media_unit_name}`);
      console.log(`   - الفئة: ${item.category_name}`);
      console.log(`   - التاريخ: ${new Date(item.created_at).toLocaleString('ar-SA')}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ خطأ في عرض العناصر المعلقة:', error);
  }
}

/**
 * عرض آخر المحتوى المنشور
 */
export async function showLatestPublished(limit: number = 10): Promise<void> {
  console.log(`\n📰 آخر ${limit} محتوى منشور:\n`);

  try {
    const published = await PublishedItemsService.getAllPublished(limit);

    if (published.length === 0) {
      console.log('✅ لا يوجد محتوى منشور');
      return;
    }

    published.forEach((item, index) => {
      const flowType = item.flow_type === 'automated' ? '🚀 أوتوماتيكي' : '📝 تحريري';
      console.log(`${index + 1}. [${flowType}] ${item.title}`);
      console.log(`   - الوحدة: ${item.media_unit_name}`);
      console.log(`   - الفئة: ${item.category_name}`);
      console.log(`   - التاريخ: ${new Date(item.published_at).toLocaleString('ar-SA')}`);
      if (item.tag_names && item.tag_names.length > 0) {
        console.log(`   - التاجات: ${item.tag_names.join(', ')}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ خطأ في عرض المحتوى المنشور:', error);
  }
}

/**
 * موافقة المحرر على خبر
 */
export async function approveArticle(
  queueId: number,
  policyId: number,
  notes?: string
): Promise<void> {
  console.log(`\n✅ الموافقة على الخبر ${queueId}...\n`);

  try {
    const result = await EditorialQueueService.approveItem(
      queueId,
      policyId,
      notes
    );

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('❌ خطأ في الموافقة:', error);
  }
}

/**
 * رفض المحرر لخبر
 */
export async function rejectArticle(
  queueId: number,
  notes?: string
): Promise<void> {
  console.log(`\n❌ رفض الخبر ${queueId}...\n`);

  try {
    const result = await EditorialQueueService.rejectItem(queueId, notes);

    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.message}`);
    }
  } catch (error) {
    console.error('❌ خطأ في الرفض:', error);
  }
}

// تشغيل الفلو إذا تم استدعاء الفايل مباشرة
if (require.main === module) {
  runNewsFlow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ خطأ:', error);
      process.exit(1);
    });
}
