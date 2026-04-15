# أمثلة استخدام فلو معالجة الأخبار

## 🎯 الحالات الاستخدامية

### الحالة 1: معالجة أخبار جديدة تم سحبها

**السيناريو:** لديك أخبار جديدة في جدول `raw_data` بحالة `fetch_status = 'fetched'` وتريد توجيهها للمسار الصحيح.

#### باستخدام API

```bash
# 1. معالجة الأخبار الجديدة
curl -X POST http://localhost:3000/api/flow/process

# الاستجابة:
{
  "success": true,
  "message": "تمت معالجة 5 خبر بنجاح",
  "data": {
    "processedCount": 5,
    "automatedCount": 3,
    "editorialCount": 2,
    "errors": []
  }
}
```

#### باستخدام TypeScript

```typescript
import FlowRouterService from './services/news/flow-router.service';

async function processNews() {
  const result = await FlowRouterService.processNewArticles();
  
  console.log(`✅ تمت معالجة ${result.processedCount} خبر`);
  console.log(`   - أوتوماتيكي: ${result.automatedCount}`);
  console.log(`   - تحريري: ${result.editorialCount}`);
}

processNews();
```

---

### الحالة 2: عرض الأخبار المعلقة في الطابور

**السيناريو:** المحرر يريد رؤية الأخبار التي تنتظر موافقته.

#### باستخدام API

```bash
# جلب الأخبار المعلقة
curl http://localhost:3000/api/flow/queue/pending

# الاستجابة:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "media_unit_id": 2,
      "raw_data_id": 10,
      "title": "الرئيس يعقد اجتماعاً مهماً",
      "content": "محتوى الخبر الكامل...",
      "category_name": "سياسة",
      "media_unit_name": "وحدة الأخبار الرئيسية",
      "status": "pending",
      "created_at": "2026-04-13T10:00:00Z"
    },
    {
      "id": 2,
      "media_unit_id": 2,
      "raw_data_id": 11,
      "title": "اقتصاد: ارتفاع الأسعار",
      "content": "محتوى الخبر الكامل...",
      "category_name": "اقتصاد",
      "media_unit_name": "وحدة الأخبار الرئيسية",
      "status": "pending",
      "created_at": "2026-04-13T10:05:00Z"
    }
  ],
  "count": 2
}
```

#### باستخدام TypeScript

```typescript
import EditorialQueueService from './services/news/editorial-queue.service';

async function showPendingNews() {
  const pending = await EditorialQueueService.getPendingItems();
  
  pending.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
    console.log(`   الفئة: ${item.category_name}`);
    console.log(`   الوحدة: ${item.media_unit_name}`);
    console.log(`   التاريخ: ${new Date(item.created_at).toLocaleString('ar-SA')}`);
    console.log('');
  });
}

showPendingNews();
```

---

### الحالة 3: موافقة المحرر على خبر

**السيناريو:** المحرر يريد الموافقة على خبر سياسي وتحديد السياسة التحريرية.

#### باستخدام API

```bash
# موافقة على الخبر رقم 1 مع السياسة رقم 2
curl -X POST http://localhost:3000/api/flow/queue/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": 2,
    "editorNotes": "تم التحقق من المصادر والمعلومات صحيحة"
  }'

# الاستجابة:
{
  "success": true,
  "message": "تمت الموافقة على الخبر ونشره بنجاح",
  "data": {
    "queueId": 1
  }
}
```

#### باستخدام TypeScript

```typescript
import EditorialQueueService from './services/news/editorial-queue.service';

async function approveNews(queueId: number) {
  const result = await EditorialQueueService.approveItem(
    queueId,
    2, // policyId
    'تم التحقق من المصادر والمعلومات صحيحة'
  );
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.log(`❌ ${result.message}`);
  }
}

approveNews(1);
```

---

### الحالة 4: رفض المحرر لخبر

**السيناريو:** المحرر يريد رفض خبر لأنه يحتاج تحقق إضافي.

#### باستخدام API

```bash
# رفض الخبر رقم 2
curl -X POST http://localhost:3000/api/flow/queue/2/reject \
  -H "Content-Type: application/json" \
  -d '{
    "editorNotes": "الخبر يحتاج تحقق إضافي من المصادر الأصلية"
  }'

# الاستجابة:
{
  "success": true,
  "message": "تم رفض الخبر بنجاح",
  "data": {
    "queueId": 2
  }
}
```

#### باستخدام TypeScript

```typescript
import EditorialQueueService from './services/news/editorial-queue.service';

async function rejectNews(queueId: number) {
  const result = await EditorialQueueService.rejectItem(
    queueId,
    'الخبر يحتاج تحقق إضافي من المصادر الأصلية'
  );
  
  if (result.success) {
    console.log(`✅ ${result.message}`);
  } else {
    console.log(`❌ ${result.message}`);
  }
}

rejectNews(2);
```

---

### الحالة 5: عرض المحتوى المنشور

**السيناريو:** تريد عرض آخر الأخبار المنشورة.

#### باستخدام API

```bash
# جلب آخر 20 خبر منشور
curl "http://localhost:3000/api/flow/published?limit=20"

# الاستجابة:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "الرئيس يعقد اجتماعاً مهماً",
      "content": "محتوى الخبر...",
      "image_url": "https://example.com/image.jpg",
      "original_url": "https://source.com/news/123",
      "category_name": "سياسة",
      "media_unit_name": "وحدة الأخبار الرئيسية",
      "flow_type": "editorial",
      "tag_names": ["سياسة", "فلسطين", "اجتماع"],
      "published_at": "2026-04-13T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### باستخدام TypeScript

```typescript
import PublishedItemsService from './services/news/published-items.service';

async function showPublished() {
  const published = await PublishedItemsService.getAllPublished(20);
  
  published.forEach((item, index) => {
    const flowType = item.flow_type === 'automated' ? '🚀' : '📝';
    console.log(`${index + 1}. [${flowType}] ${item.title}`);
    console.log(`   الفئة: ${item.category_name}`);
    console.log(`   التاجات: ${item.tag_names.join(', ')}`);
    console.log(`   النشر: ${new Date(item.published_at).toLocaleString('ar-SA')}`);
    console.log('');
  });
}

showPublished();
```

---

### الحالة 6: عرض إحصائيات الطابور

**السيناريو:** تريد رؤية إحصائيات الطابور لكل وحدة إعلام.

#### باستخدام API

```bash
# جلب إحصائيات الطابور
curl http://localhost:3000/api/flow/queue/stats

# الاستجابة:
{
  "success": true,
  "data": [
    {
      "id": 2,
      "name": "وحدة الأخبار الرئيسية",
      "pending_count": 5,
      "in_review_count": 2,
      "approved_count": 45,
      "rejected_count": 3
    },
    {
      "id": 3,
      "name": "وحدة الأخبار الدولية",
      "pending_count": 2,
      "in_review_count": 1,
      "approved_count": 30,
      "rejected_count": 1
    }
  ]
}
```

#### باستخدام TypeScript

```typescript
import EditorialQueueService from './services/news/editorial-queue.service';

async function showQueueStats() {
  const stats = await EditorialQueueService.getQueueStats();
  
  stats.forEach(stat => {
    console.log(`\n${stat.name}:`);
    console.log(`  معلق: ${stat.pending_count}`);
    console.log(`  قيد المراجعة: ${stat.in_review_count}`);
    console.log(`  معتمد: ${stat.approved_count}`);
    console.log(`  مرفوض: ${stat.rejected_count}`);
  });
}

showQueueStats();
```

---

### الحالة 7: عرض إحصائيات المحتوى المنشور

**السيناريو:** تريد رؤية إحصائيات شاملة للمحتوى المنشور.

#### باستخدام API

```bash
# جلب إحصائيات المحتوى المنشور
curl http://localhost:3000/api/flow/published/stats

# الاستجابة:
{
  "success": true,
  "data": {
    "total_published": 150,
    "automated_count": 100,
    "editorial_count": 50,
    "by_category": [
      {
        "category": "سياسة",
        "count": 45
      },
      {
        "category": "رياضة",
        "count": 55
      },
      {
        "category": "صحة",
        "count": 50
      }
    ],
    "by_media_unit": [
      {
        "media_unit": "وحدة الأخبار الرئيسية",
        "count": 100
      },
      {
        "media_unit": "وحدة الأخبار الدولية",
        "count": 50
      }
    ]
  }
}
```

#### باستخدام TypeScript

```typescript
import PublishedItemsService from './services/news/published-items.service';

async function showPublishedStats() {
  const stats = await PublishedItemsService.getPublishedStats();
  
  console.log(`📊 إحصائيات المحتوى المنشور:`);
  console.log(`   إجمالي: ${stats.total_published}`);
  console.log(`   أوتوماتيكي: ${stats.automated_count}`);
  console.log(`   تحريري: ${stats.editorial_count}`);
  
  console.log(`\n📂 حسب الفئة:`);
  stats.by_category.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.count}`);
  });
  
  console.log(`\n🏢 حسب الوحدة:`);
  stats.by_media_unit.forEach(unit => {
    console.log(`   ${unit.media_unit}: ${unit.count}`);
  });
}

showPublishedStats();
```

---

### الحالة 8: تشغيل الفلو الكامل

**السيناريو:** تريد تشغيل الفلو الكامل مع عرض جميع الإحصائيات.

#### باستخدام TypeScript

```typescript
import { runNewsFlow } from './utils/process-news-flow';

async function fullWorkflow() {
  await runNewsFlow();
}

fullWorkflow();
```

**الإخراج:**
```
🚀 بدء تشغيل فلو معالجة الأخبار...

📰 المرحلة 1: توجيه الأخبار الجديدة
──────────────────────────────────────────────────

✅ النتيجة:
   - تمت معالجة: 5 خبر
   - أخبار أوتوماتيكية: 3
   - أخبار تحريرية: 2

📝 المرحلة 2: طابور التحرير
──────────────────────────────────────────────────

📊 إحصائيات الطابور حسب وحدة الإعلام:

   وحدة الأخبار الرئيسية:
     - معلق: 2
     - قيد المراجعة: 1
     - معتمد: 45
     - مرفوض: 3

📤 المرحلة 3: المحتوى المنشور
──────────────────────────────────────────────────

📊 إحصائيات المحتوى المنشور:
   - إجمالي المنشور: 150
   - أوتوماتيكي: 100
   - تحريري: 50

📂 حسب الفئة:
   - سياسة: 45
   - رياضة: 55
   - صحة: 50

🏢 حسب وحدة الإعلام:
   - وحدة الأخبار الرئيسية: 100
   - وحدة الأخبار الدولية: 50

✅ انتهى تشغيل الفلو بنجاح!
```

---

### الحالة 9: جلب محتوى حسب الفئة

**السيناريو:** تريد عرض جميع الأخبار المنشورة من فئة معينة.

#### باستخدام API

```bash
# جلب أخبار السياسة
curl "http://localhost:3000/api/flow/published/category/سياسة?limit=10"

# الاستجابة:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "الرئيس يعقد اجتماعاً مهماً",
      "category_name": "سياسة",
      "flow_type": "editorial",
      "published_at": "2026-04-13T10:30:00Z"
    }
  ],
  "count": 1
}
```

#### باستخدام TypeScript

```typescript
import PublishedItemsService from './services/news/published-items.service';

async function getPoliticalNews() {
  const news = await PublishedItemsService.getPublishedByCategory('سياسة', 10);
  
  console.log(`📰 أخبار السياسة (${news.length}):`);
  news.forEach((item, index) => {
    console.log(`${index + 1}. ${item.title}`);
  });
}

getPoliticalNews();
```

---

## 🔄 سيناريو عملي متكامل

```typescript
import { 
  runNewsFlow, 
  showPendingItems, 
  approveArticle,
  rejectArticle,
  showLatestPublished 
} from './utils/process-news-flow';

async function dailyNewsWorkflow() {
  console.log('🌅 بدء سير العمل اليومي...\n');

  // 1. معالجة الأخبار الجديدة
  console.log('1️⃣ معالجة الأخبار الجديدة...');
  await runNewsFlow();

  // 2. عرض الأخبار المعلقة
  console.log('\n2️⃣ عرض الأخبار المعلقة...');
  await showPendingItems();

  // 3. موافقة على الأخبار الجيدة
  console.log('\n3️⃣ الموافقة على الأخبار...');
  await approveArticle(1, 2, 'تم التحقق من المصادر');
  await approveArticle(3, 2, 'خبر موثوق');

  // 4. رفض الأخبار التي تحتاج تحقق
  console.log('\n4️⃣ رفض الأخبار التي تحتاج تحقق...');
  await rejectArticle(2, 'يحتاج مصادر إضافية');

  // 5. عرض آخر المحتوى المنشور
  console.log('\n5️⃣ عرض آخر المحتوى المنشور...');
  await showLatestPublished(5);

  console.log('\n✅ انتهى سير العمل اليومي!');
}

dailyNewsWorkflow().catch(console.error);
```

---

## 📝 ملاحظات مهمة

1. **الأخبار الأوتوماتيكية** تنشر فوراً بدون تأخير
2. **الأخبار التحريرية** تنتظر موافقة المحرر
3. **السياسة التحريرية** تُختار من قبل المحرر عند الموافقة
4. **الصور والروابط** تُسحب من `raw_data` عند العرض
5. **التاجات** تُحفظ مع الخبر الأصلي

