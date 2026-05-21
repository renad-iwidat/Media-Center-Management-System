/**
 * Sync Sources
 * 
 * مزامنة المصادر من NewsDesk API إلى جدول sources المحلي
 * يُنشئ مصادر جديدة ويحدّث الموجودة
 */

import { SourceService } from '../../services/database/database.service';
import { newsDeskApiService } from '../../services/news/newsdesk-api.service';

async function syncSources(): Promise<void> {
  try {
    const apiUrl = process.env.NEWSDESK_API_URL || 'https://newsdesk-api.liminal.ps';
    console.log(`🔗 مزامنة المصادر من NewsDesk API...`);
    console.log(`   URL: ${apiUrl}\n`);

    // جلب المصادر من الـ API
    const apiSources = await newsDeskApiService.getSources();
    console.log(`📡 تم جلب ${apiSources.length} مصدر من الـ API\n`);

    let created = 0;
    let updated = 0;

    for (const apiSource of apiSources) {
      const existing = await SourceService.findOrCreateBySlug(
        apiSource.slug,
        apiSource.name,
        apiSource.base_url
      );

      // تحديث الـ URL إذا تغيّر
      if (existing.url !== apiSource.base_url && apiSource.base_url) {
        await SourceService.update(existing.id, { url: apiSource.base_url });
        updated++;
        console.log(`   🔄 تحديث: ${apiSource.name} (${apiSource.slug})`);
      } else if (!existing.last_fetched_at) {
        created++;
        console.log(`   ✅ جديد: ${apiSource.name} (${apiSource.slug})`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 النتيجة:');
    console.log(`   📡 مصادر من الـ API: ${apiSources.length}`);
    console.log(`   ✅ جديد: ${created}`);
    console.log(`   🔄 محدّث: ${updated}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  syncSources();
}

export { syncSources };
