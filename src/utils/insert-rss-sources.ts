/**
 * Insert RSS Sources Script
 * سكريبت لإدراج مصادر RSS في قاعدة البيانات
 */

import { query } from '../config/database';
import { RSS_SOURCES, RSS_SOURCES_DIVERSE } from '../config/rss-sources';
import { SourceTypeService, SourceService } from '../services/database';

/**
 * إدراج مصادر RSS في قاعدة البيانات
 */
async function insertRSSSources(): Promise<void> {
  try {
    console.log('🚀 بدء إدراج مصادر RSS...\n');

    // 1. التأكد من وجود نوع RSS
    console.log('📝 التأكد من وجود نوع RSS...');
    let rssType = await SourceTypeService.getByName('RSS');
    
    if (!rssType) {
      console.log('   ➕ إنشاء نوع RSS جديد...');
      rssType = await SourceTypeService.create('RSS');
      console.log(`   ✅ تم إنشاء نوع RSS برقم: ${rssType.id}\n`);
    } else {
      console.log(`   ✅ نوع RSS موجود برقم: ${rssType.id}\n`);
    }

    // 2. إدراج المصادر الرئيسية
    console.log('📰 إدراج المصادر الرئيسية...');
    console.log('='.repeat(80));
    
    let mainSourcesCount = 0;
    for (const source of RSS_SOURCES) {
      try {
        const result = await SourceService.create(
          rssType.id,
          source.url,
          source.name,
          true
        );
        console.log(`✅ ${source.name}`);
        console.log(`   🔗 ${source.url}`);
        console.log(`   📌 ID: ${result.id}\n`);
        mainSourcesCount++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('UNIQUE')) {
          console.log(`⚠️  ${source.name} (موجود بالفعل)\n`);
        } else {
          console.error(`❌ خطأ في ${source.name}:`, error);
        }
      }
    }

    console.log('='.repeat(80));
    console.log(`📊 تم إدراج ${mainSourcesCount} مصدر رئيسي\n`);

    // 3. إدراج المصادر المتنوعة
    console.log('🎯 إدراج المصادر المتنوعة (متخصصة)...');
    console.log('='.repeat(80));
    
    let diverseSourcesCount = 0;
    for (const source of RSS_SOURCES_DIVERSE) {
      try {
        const result = await SourceService.create(
          rssType.id,
          source.url,
          source.name,
          true
        );
        console.log(`✅ ${source.name}`);
        console.log(`   🔗 ${source.url}`);
        console.log(`   📌 ID: ${result.id}\n`);
        diverseSourcesCount++;
      } catch (error) {
        if (error instanceof Error && error.message.includes('UNIQUE')) {
          console.log(`⚠️  ${source.name} (موجود بالفعل)\n`);
        } else {
          console.error(`❌ خطأ في ${source.name}:`, error);
        }
      }
    }

    console.log('='.repeat(80));
    console.log(`📊 تم إدراج ${diverseSourcesCount} مصدر متنوع\n`);

    // 4. عرض الإحصائيات
    console.log('📈 الإحصائيات النهائية:');
    console.log('='.repeat(80));
    
    const allSources = await SourceService.getAll();
    const activeSources = await SourceService.getActive();
    
    console.log(`📌 إجمالي المصادر: ${allSources.length}`);
    console.log(`✅ المصادر النشطة: ${activeSources.length}`);
    console.log(`📰 مصادر RSS: ${allSources.filter(s => s.source_type_id === rssType.id).length}`);
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ تم إدراج جميع مصادر RSS بنجاح!\n');

    // 5. عرض قائمة المصادر
    console.log('📋 قائمة المصادر المدرجة:');
    console.log('='.repeat(80));
    
    const rssSources = allSources.filter(s => s.source_type_id === rssType.id);
    rssSources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   🔗 ${source.url}`);
      console.log(`   📌 ID: ${source.id}`);
      console.log(`   ✅ نشط: ${source.is_active ? 'نعم' : 'لا'}\n`);
    });

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ حدث خطأ أثناء إدراج المصادر:', error);
    process.exit(1);
  }
}

/**
 * حذف جميع مصادر RSS (للاختبار فقط)
 */
async function deleteAllRSSSources(): Promise<void> {
  try {
    console.log('🗑️  حذف جميع مصادر RSS...\n');

    const rssType = await SourceTypeService.getByName('RSS');
    if (!rssType) {
      console.log('❌ نوع RSS غير موجود\n');
      return;
    }

    const result = await query(
      'DELETE FROM sources WHERE source_type_id = $1 RETURNING id',
      [rssType.id]
    );

    console.log(`✅ تم حذف ${result.rowCount} مصدر RSS\n`);
  } catch (error) {
    console.error('❌ خطأ في حذف المصادر:', error);
  }
}

/**
 * عرض جميع مصادر RSS
 */
async function listAllRSSSources(): Promise<void> {
  try {
    console.log('📋 قائمة جميع مصادر RSS:\n');

    const sources = await SourceService.getAll();
    const rssSources = sources.filter(s => s.source_type_id === 1);

    if (rssSources.length === 0) {
      console.log('❌ لا توجد مصادر RSS\n');
      return;
    }

    rssSources.forEach((source, index) => {
      console.log(`${index + 1}. ${source.name}`);
      console.log(`   🔗 ${source.url}`);
      console.log(`   📌 ID: ${source.id}`);
      console.log(`   ✅ نشط: ${source.is_active ? 'نعم' : 'لا'}\n`);
    });

    console.log(`📊 إجمالي: ${rssSources.length} مصدر\n`);
  } catch (error) {
    console.error('❌ خطأ في عرض المصادر:', error);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'delete') {
    deleteAllRSSSources().then(() => process.exit(0));
  } else if (command === 'list') {
    listAllRSSSources().then(() => process.exit(0));
  } else {
    insertRSSSources().then(() => process.exit(0));
  }
}

export { insertRSSSources, deleteAllRSSSources, listAllRSSSources };
