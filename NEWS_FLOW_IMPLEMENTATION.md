# 📰 فلو الأخبار — التنفيذ الكامل

## ✅ الفلو المطبق

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🟢 بداية الخبر                                    │
│                         fetch_status = 'fetched'                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ⚙️ مرحلة المعالجة                                    │
│              تصنيف AI + تنظيف النص + فحص اكتمال المحتوى                     │
│                    (FlowRouterService.processNewArticles)                   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
              ❌ ناقص                          ✅ مكتمل
         (< 100 حرف)                        (≥ 100 حرف)
                    │                               │
                    ▼                               │
    ┌───────────────────────────┐                   │
    │   editorial_queue         │                   │
    │   status = 'incomplete'   │                   │
    │   لكل media_unit          │                   │
    └───────────────────────────┘                   │
                    │                               │
           المحرر يكمل الخبر                        │
                    │                               │
                    ▼                               ▼
    ┌───────────────────────────────────────────────────────────────────────┐
    │                    🔀 التوجيه حسب نوع الفلو                            │
    │                  (category.flow = automated/editorial)                │
    └───────────────────────────────────────────────────────────────────────┘
                    │                               │
        ┌───────────┴───────────┐       ┌──────────┴──────────┐
        │                       │       │                      │
   🟡 Automated            🔵 Editorial                        │
        │                       │                              │
        ▼                       ▼                              │
┌───────────────┐     ┌─────────────────┐                      │
│ editorial_queue│     │ editorial_queue │                      │
│ pending →      │     │ status=pending  │                      │
│ approved       │     │ (ينتظر المحرر) │                      │
│ (تلقائياً)     │     └─────────────────┘                      │
└───────────────┘              │                               │
        │              المحرر يراجع                             │
        │                      │                               │
        ▼                      ▼                               │
┌───────────────┐     ┌─────────────────┐                      │
│ published_items│     │ in_review →     │                      │
│ queue_id ≠ NULL│     │ approved →      │                      │
└───────────────┘     │ published_items │                      │
                      │ queue_id ≠ NULL │                      │
                      └─────────────────┘                      │
```

---

## 📋 الحالات في editorial_queue

| الحالة | المعنى | من يغيرها |
|--------|--------|-----------|
| pending | وصل للطابور، بانتظار قرار | أوتوماتيك |
| incomplete | الخبر ناقص، محتاج تدخل | أوتوماتيك |
| in_review | المحرر شغّال عليه | المحرر |
| approved | موافق، جاهز للنشر | المحرر |
| rejected | مرفوض، ما رح ينشر | المحرر |

---

## 🔄 المسارات التفصيلية

### 🟡 أوتوماتيك + مكتمل
```
raw_data (fetched)
  → تنظيف + تصنيف + فحص اكتمال
  → editorial_queue (pending) لكل media_unit
  → approved تلقائياً (بدون محرر)
  → published_items (queue_id موجود) ✓
  → fetch_status = 'published'
```

### 🟡 أوتوماتيك + ناقص
```
raw_data (fetched)
  → editorial_queue (incomplete) لكل media_unit
  → المحرر يكمله
  → approved تلقائياً
  → published_items (queue_id موجود) ✓
  → fetch_status = 'published'
```

### 🔵 تحريري + مكتمل
```
raw_data (fetched)
  → editorial_queue (pending) لكل media_unit
  → المحرر يراجع → in_review → approved
  → published_items (queue_id موجود) ✓
  → fetch_status = 'published'
```

### 🔵 تحريري + ناقص
```
raw_data (fetched)
  → editorial_queue (incomplete) لكل media_unit
  → المحرر يكمل → in_review → approved
  → published_items (queue_id موجود) ✓
  → fetch_status = 'published'
```

### ❌ مرفوض
```
editorial_queue (pending / in_review)
  → rejected
  → بيخلص هون، ما يروح published_items
```

---

## 📁 الملفات المعدلة

### 1. `src/services/news/flow-router.service.ts`
- كل الأخبار تمر عبر editorial_queue (أوتوماتيك وتحريري)
- الناقصة تدخل بحالة 'incomplete'
- الأوتوماتيك المكتمل: pending → approved تلقائياً → published
- التحريري المكتمل: pending (ينتظر المحرر)

### 2. `src/services/news/editorial-queue.service.ts`
- إضافة حالة 'incomplete' للطابور
- إضافة `getIncompleteItems()` لجلب الأخبار الناقصة
- تحديث الإحصائيات لتشمل incomplete_count

### 3. `src/controllers/news/data.controller.ts`
- `updateArticleContent()` يحدّث سجلات editorial_queue الموجودة
- أوتوماتيكي: incomplete → approved → published_items
- تحريري: incomplete → in_review (ينتظر المحرر)

### 4. `src/services/news/published-items.service.ts`
- flow_type يُحدد من categories.flow بدل queue_id IS NULL
- queue_id دايماً موجود (كل خبر منشور مربوط بسجل editorial_queue)

---

## 🗄️ الجداول

| الجدول | الوصف |
|--------|-------|
| `sources` | المصادر + default_category_id |
| `raw_data` | الخبر الأصلي، يُحفظ مرة واحدة، مشترك |
| `categories` | التصنيف + flow (automated/editorial) |
| `editorial_queue` | حالة كل خبر لكل يونت (هون بيعيش الفلو كله) |
| `editorial_policies` | سياسات التحرير لكل يونت |
| `published_items` | النسخة المنشورة النهائية لكل يونت |

---

## 📊 حالات fetch_status

| الحالة | المعنى |
|--------|--------|
| `fetched` | خبر جديد بانتظار المعالجة |
| `processed` | تمت المعالجة (في الطابور أو ناقص) |
| `published` | تم النشر |
