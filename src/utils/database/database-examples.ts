/**
 * Database Usage Examples
 * أمثلة على استخدام خدمات قاعدة البيانات
 */

import {
  SourceTypeService,
  SourceService,
  RawDataService,
  CategoryService,
  EditorialQueueService,
  PublishedItemService,
} from '../../services/database/database.service';

/**
 * مثال 1: إنشاء أنواع المصادر
 */
export async function exampleCreateSourceTypes() {
  try {
    console.log('📝 إنشاء أنواع المصادر...');
    
    const rssType = await SourceTypeService.create('RSS');
    const apiType = await SourceTypeService.create('API');
    const telegramType = await SourceTypeService.create('Telegram');
    
    console.log('✅ تم إنشاء أنواع المصادر:', { rssType, apiType, telegramType });
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 2: إنشاء مصادر جديدة
 */
export async function exampleCreateSources() {
  try {
    console.log('📝 إنشاء مصادر جديدة...');
    
    // الحصول على نوع RSS
    const rssType = await SourceTypeService.getByName('RSS');
    if (!rssType) {
      console.error('❌ نوع RSS غير موجود');
      return;
    }

    // إنشاء مصادر
    const source1 = await SourceService.create(
      rssType.id,
      'https://news1.com/rss',
      'موقع الأخبار 1',
      true
    );

    const source2 = await SourceService.create(
      rssType.id,
      'https://news2.com/rss',
      'موقع الأخبار 2',
      true
    );

    console.log('✅ تم إنشاء المصادر:', { source1, source2 });
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 3: الحصول على جميع المصادر
 */
export async function exampleGetAllSources() {
  try {
    console.log('📝 جلب جميع المصادر...');
    
    const sources = await SourceService.getAll();
    console.log('✅ المصادر:', sources);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 4: إنشاء بيانات خام
 */
export async function exampleCreateRawData() {
  try {
    console.log('📝 إنشاء بيانات خام...');
    
    const rawData = await RawDataService.create({
      source_id: 1,
      source_type_id: 1,
      category_id: 1,
      url: 'https://example.com/article1',
      title: 'عنوان الخبر',
      content: 'محتوى الخبر...',
      image_url: 'https://example.com/image.jpg',
      tags: ['سياسة', 'أخبار'],
      fetch_status: 'success',
      pub_date: new Date(),
    });

    console.log('✅ تم إنشاء البيانات الخام:', rawData);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 5: إنشاء تصنيفات
 */
export async function exampleCreateCategories() {
  try {
    console.log('📝 إنشاء تصنيفات...');
    
    const category1 = await CategoryService.create(
      'سياسة',
      'politics',
      'editorial_flow_1',
      true
    );

    const category2 = await CategoryService.create(
      'رياضة',
      'sports',
      'editorial_flow_2',
      true
    );

    console.log('✅ تم إنشاء التصنيفات:', { category1, category2 });
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 6: الحصول على جميع التصنيفات
 */
export async function exampleGetAllCategories() {
  try {
    console.log('📝 جلب جميع التصنيفات...');
    
    const categories = await CategoryService.getAll();
    console.log('✅ التصنيفات:', categories);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 7: إضافة عنصر لطابور التحرير
 */
export async function exampleAddToEditorialQueue() {
  try {
    console.log('📝 إضافة عنصر لطابور التحرير...');
    
    const queueItem = await EditorialQueueService.create(
      1, // media_unit_id
      1, // raw_data_id
      1, // policy_id
      'pending'
    );

    console.log('✅ تم إضافة العنصر للطابور:', queueItem);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 8: الحصول على طابور التحرير
 */
export async function exampleGetEditorialQueue() {
  try {
    console.log('📝 جلب طابور التحرير...');
    
    const queue = await EditorialQueueService.getAll();
    console.log('✅ طابور التحرير:', queue);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 9: إنشاء محتوى منشور
 */
export async function exampleCreatePublishedItem() {
  try {
    console.log('📝 إنشاء محتوى منشور...');
    
    const publishedItem = await PublishedItemService.create({
      media_unit_id: 1,
      raw_data_id: 1,
      queue_id: 1,
      content_type_id: 1,
      title: 'عنوان الخبر المنشور',
      content: 'محتوى الخبر المنشور...',
      tags: ['سياسة', 'أخبار'],
      is_active: true,
    });

    console.log('✅ تم إنشاء المحتوى المنشور:', publishedItem);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * مثال 10: الحصول على المحتوى المنشور
 */
export async function exampleGetPublishedItems() {
  try {
    console.log('📝 جلب المحتوى المنشور...');
    
    const items = await PublishedItemService.getAll();
    console.log('✅ المحتوى المنشور:', items);
  } catch (error) {
    console.error('❌ خطأ:', error);
  }
}

/**
 * تشغيل جميع الأمثلة
 */
export async function runAllExamples() {
  console.log('🚀 بدء تشغيل الأمثلة...\n');

  await exampleCreateSourceTypes();
  console.log('\n---\n');

  await exampleCreateSources();
  console.log('\n---\n');

  await exampleGetAllSources();
  console.log('\n---\n');

  await exampleCreateCategories();
  console.log('\n---\n');

  await exampleGetAllCategories();
  console.log('\n---\n');

  console.log('✅ انتهت جميع الأمثلة');
}
