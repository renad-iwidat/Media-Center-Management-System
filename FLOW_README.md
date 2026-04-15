# 📰 فلو معالجة الأخبار — من السحب للنشر

## 🎯 نظرة عامة

تم تطبيق نظام متكامل لمعالجة الأخبار من السحب من المصادر إلى النشر النهائي، مع دعم مسارين:

1. **المسار الأوتوماتيكي** 🚀 — نشر فوري للأخبار المنوعة
2. **مسار التحرير** 📝 — معالجة من قبل محرر للأخبار السياسية

---

## 📁 البنية

```
src/
├── services/news/
│   ├── flow-router.service.ts          ← توجيه الأخبار
│   ├── editorial-queue.service.ts      ← إدارة الطابور
│   └── published-items.service.ts      ← إدارة المحتوى
├── controllers/news/
│   └── flow.controller.ts              ← API
├── routes/news/
│   └── flow.routes.ts                  ← المسارات
└── utils/
    ├── process-news-flow.ts            ← دوال مساعدة
    └── test-flow.ts                    ← اختبارات

Documentation/
├── IMPLEMENTATION_FLOW.md              ← شرح تفصيلي
├── FLOW_IMPLEMENTATION_GUIDE.md        ← دليل التطبيق
├── FLOW_USAGE_EXAMPLES.md              ← أمثلة عملية
├── FLOW_SUMMARY.md                     ← ملخص سريع
└── FLOW_README.md                      ← هذا الملف
```

---

## 🚀 البدء السريع

### 1. معالجة الأخبار الجديدة

```bash
# عبر API
curl -X POST http://localhost:3000/api/flow/process

# أو عبر TypeScript
import { runNewsFlow } from './utils/process-news-flow';
await runNewsFlow();
```

### 2. عرض الأخبار المعلقة

```bash
curl http://localhost:3000/api/flow/queue/pending
```

### 3. موافقة على خبر

```bash
curl -X POST http://localhost:3000/api/flow/queue/1/approve \
  -H "Content-Type: application/json" \
  -d '{"policyId": 2, "editorNotes": "تم التحقق"}'
```

### 4. عرض المحتوى المنشور

```bash
curl http://localhost:3000/api/flow/published
```

---

## 🔌 API الكامل

### معالجة الأخبار
| الطريقة | المسار | الوصف |
|--------|--------|--------|
| POST | `/api/flow/process` | معالجة الأخبار الجديدة |

### طابور التحرير
| الطريقة | المسار | الوصف |
|--------|--------|--------|
| GET | `/api/flow/queue/pending` | الأخبار المعلقة |
| GET | `/api/flow/queue/stats` | إحصائيات الطابور |
| GET | `/api/flow/queue/:id` | خبر واحد |
| POST | `/api/flow/queue/:id/approve` | موافقة |
| POST | `/api/flow/queue/:id/reject` | رفض |

### المحتوى المنشور
| الطريقة | المسار | الوصف |
|--------|--------|--------|
| GET | `/api/flow/published` | جميع المحتوى |
| GET | `/api/flow/published/:id` | محتوى واحد |
| GET | `/api/flow/published/category/:category` | حسب الفئة |
| GET | `/api/flow/published/stats` | الإحصائيات |

---

## 🛠️ الخدمات (Services)

### FlowRouterService
**الملف:** `src/services/news/flow-router.service.ts`

```typescript
// معالجة الأخبار الجديدة
const result = await FlowRouterService.processNewArticles();
```

**الوظائف:**
- `processNewArticles()` — معالجة جميع الأخبار الجديدة

### EditorialQueueService
**الملف:** `src/services/news/editorial-queue.service.ts`

```typescript
// جلب الأخبار المعلقة
const pending = await EditorialQueueService.getPendingItems();

// موافقة على خبر
await EditorialQueueService.approveItem(queueId, policyId, notes);

// رفض خبر
await EditorialQueueService.rejectItem(queueId, notes);

// إحصائيات
const stats = await EditorialQueueService.getQueueStats();
```

**الوظائف:**
- `getPendingItems()` — الأخبار المعلقة
- `getQueueItem(id)` — خبر واحد
- `approveItem(id, policyId, notes)` — موافقة
- `rejectItem(id, notes)` — رفض
- `getQueueStats()` — إحصائيات

### PublishedItemsService
**الملف:** `src/services/news/published-items.service.ts`

```typescript
// جميع المحتوى
const published = await PublishedItemsService.getAllPublished(50);

// محتوى واحد
const item = await PublishedItemsService.getPublishedItem(id);

// حسب الفئة
const category = await PublishedItemsService.getPublishedByCategory('سياسة', 50);

// حسب نوع الفلو
const automated = await PublishedItemsService.getPublishedByFlow('automated', 50);

// إحصائيات
const stats = await PublishedItemsService.getPublishedStats();
```

**الوظائف:**
- `getAllPublished(limit)` — جميع المحتوى
- `getPublishedItem(id)` — محتوى واحد
- `getPublishedByCategory(category, limit)` — حسب الفئة
- `getPublishedByMediaUnit(unitId, limit)` — حسب الوحدة
- `getPublishedByFlow(flowType, limit)` — حسب نوع الفلو
- `getPublishedStats()` — إحصائيات
- `deactivateItem(id)` — إلغاء التفعيل

---

## 📚 الدوال المساعدة

**الملف:** `src/utils/process-news-flow.ts`

```typescript
// تشغيل الفلو الكامل
import { runNewsFlow } from './utils/process-news-flow';
await runNewsFlow();

// عرض الأخبار المعلقة
import { showPendingItems } from './utils/process-news-flow';
await showPendingItems();

// عرض آخر المحتوى المنشور
import { showLatestPublished } from './utils/process-news-flow';
await showLatestPublished(10);

// موافقة على خبر
import { approveArticle } from './utils/process-news-flow';
await approveArticle(queueId, policyId, notes);

// رفض خبر
import { rejectArticle } from './utils/process-news-flow';
await rejectArticle(queueId, notes);
```

---

## 📊 تدفق البيانات

```
1. السحب من المصادر
   ↓
   raw_data (fetch_status = 'fetched')
   ↓
2. تحديد المسار
   ↓
   ├─ flow = 'automated'
   │  ↓
   │  published_items (queue_id = NULL)
   │  ↓
   │  ✅ منشور فوراً
   │
   └─ flow = 'editorial'
      ↓
      editorial_queue (status = 'pending')
      ↓
      المحرر يقرر
      ├─ رفض → rejected
      └─ موافقة → approved
         ↓
         published_items (queue_id = X)
         ↓
         ✅ منشور بعد التحرير
```

---

## 🔄 مثال عملي متكامل

```typescript
import { 
  runNewsFlow, 
  showPendingItems, 
  approveArticle,
  rejectArticle,
  showLatestPublished 
} from './utils/process-news-flow';

async function dailyWorkflow() {
  // 1. معالجة الأخبار الجديدة
  await runNewsFlow();

  // 2. عرض الأخبار المعلقة
  await showPendingItems();

  // 3. موافقة على الأخبار الجيدة
  await approveArticle(1, 2, 'تم التحقق');
  await approveArticle(3, 2, 'خبر موثوق');

  // 4. رفض الأخبار التي تحتاج تحقق
  await rejectArticle(2, 'يحتاج مصادر إضافية');

  // 5. عرض آخر المحتوى المنشور
  await showLatestPublished(5);
}

dailyWorkflow().catch(console.error);
```

---

## 📈 الإحصائيات

### إحصائيات الطابور
```json
{
  "id": 2,
  "name": "وحدة الأخبار",
  "pending_count": 5,
  "in_review_count": 2,
  "approved_count": 45,
  "rejected_count": 3
}
```

### إحصائيات المحتوى المنشور
```json
{
  "total_published": 150,
  "automated_count": 100,
  "editorial_count": 50,
  "by_category": [
    {"category": "سياسة", "count": 45},
    {"category": "رياضة", "count": 55}
  ],
  "by_media_unit": [
    {"media_unit": "وحدة الأخبار", "count": 100}
  ]
}
```

---

## 🧪 الاختبارات

```typescript
import { testCompleteFlow } from './utils/test-flow';

// تشغيل الاختبارات
await testCompleteFlow();
```

---

## 🔐 الحماية

- ✅ Trigger في قاعدة البيانات يمنع نشر خبر تحريري بدون `queue_id`
- ✅ التحقق من وجود الفئة والوحدة قبل المعالجة
- ✅ معالجة شاملة للأخطاء

---

## 📖 التوثيق الكامل

- **IMPLEMENTATION_FLOW.md** — شرح تفصيلي للفلو والجداول
- **FLOW_IMPLEMENTATION_GUIDE.md** — دليل التطبيق والـ API
- **FLOW_USAGE_EXAMPLES.md** — أمثلة عملية لكل حالة
- **FLOW_SUMMARY.md** — ملخص سريع

---

## ✨ الميزات

✅ توجيه ذكي للأخبار
✅ طابور تحرير متكامل
✅ نشر أوتوماتيكي وتحريري
✅ إحصائيات شاملة
✅ API كامل
✅ دوال مساعدة
✅ معالجة أخطاء
✅ حماية من الأخطاء

---

## 🚀 الخطوات التالية

1. اختبار الفلو مع بيانات حقيقية
2. ضبط منطق التوجيه
3. إضافة المزيد من السياسات التحريرية
4. تطوير واجهة مستخدم للمحررين
5. إضافة تنبيهات وإشعارات

---

## 📞 الدعم

للمزيد من المعلومات، راجع الملفات التوثيقية المرفقة.

