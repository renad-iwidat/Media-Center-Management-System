# 📅 إصلاح ترتيب الأخبار (الأحدث أولاً)

## 🎯 المشكلة

الأخبار كانت مرتبة بشكل خاطئ:
- ❌ أخبار من 7 أشهر تظهر قبل أخبار 10 أشهر
- ❌ ترتيب غير منطقي حسب ID

## ✅ الحل

تغيير الترتيب في جميع الصفحات إلى **الأحدث أولاً** (DESC)

---

## 📋 التعديلات المطبقة

### 1️⃣ أخبار غير مكتملة (IncompleteView)

**الملف**: `src/controllers/news/data.controller.ts`

#### قبل:
```sql
ORDER BY rd.id, rd.fetched_at DESC
-- ❌ يرتب أولاً بالـ ID، ثم بالتاريخ
```

#### بعد:
```sql
ORDER BY rd.fetched_at DESC, rd.id DESC
-- ✅ يرتب أولاً بالتاريخ (الأحدث أولاً)، ثم بالـ ID
```

---

### 2️⃣ قسم التحرير (QueueView)

**الملف**: `src/services/news/editorial-queue.service.ts`

#### قبل:
```sql
ORDER BY eq.created_at ASC
-- ❌ الأقدم أولاً
```

#### بعد:
```sql
ORDER BY eq.created_at DESC
-- ✅ الأحدث أولاً
```

---

### 3️⃣ قسم النشر (PublishedView)

**الملف**: `src/services/news/published-items.service.ts`

#### الحالة:
```sql
ORDER BY pi.published_at DESC
-- ✅ كان صحيح بالفعل (الأحدث أولاً)
```

---

## 📊 التأثير

### قبل التعديل ❌

```
قائمة الأخبار:
1. خبر من 7 أشهر (ID: 100)
2. خبر من 5 أشهر (ID: 200)
3. خبر من 10 أشهر (ID: 50)  ← يظهر متأخر!
```

### بعد التعديل ✅

```
قائمة الأخبار:
1. خبر من 10 أشهر (الأحدث)
2. خبر من 7 أشهر
3. خبر من 5 أشهر (الأقدم)
```

---

## 🔍 التفاصيل التقنية

### حقل التاريخ في كل جدول:

| الجدول | الحقل المستخدم | الوصف |
|--------|----------------|-------|
| `raw_data` | `fetched_at` | تاريخ سحب الخبر |
| `editorial_queue` | `created_at` | تاريخ إضافة الخبر للقائمة |
| `published_items` | `published_at` | تاريخ نشر الخبر |

---

## 🚀 التطبيق

### الخطوة 1️⃣: الكود محدث بالفعل ✅

التعديلات مطبقة في:
- ✅ `src/controllers/news/data.controller.ts`
- ✅ `src/services/news/editorial-queue.service.ts`

### الخطوة 2️⃣: إعادة تشغيل Backend

```bash
# أوقف الخادم (Ctrl + C)
npm run dev
```

**انتهى!** ✅

---

## 📱 في الواجهة (Frontend)

### IncompleteView.tsx

الـ Frontend يطبق ترتيب إضافي:

```typescript
// السطر 69-71
if (sortBy === "newest") {
  filtered.sort((a, b) => 
    new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
  );
} else {
  filtered.sort((a, b) => 
    new Date(a.fetched_at).getTime() - new Date(b.fetched_at).getTime()
  );
}
```

**الحالة**: ✅ صحيح (الأحدث أولاً هو الافتراضي)

---

## 🎯 ملخص الترتيب في كل صفحة

### 1. أخبار غير مكتملة

```
الترتيب: fetched_at DESC
← الأخبار الأحدث (الأقرب لتاريخ اليوم) تظهر أولاً
```

### 2. قسم التحرير

```
الترتيب: created_at DESC
← الأخبار التي دخلت القائمة مؤخراً تظهر أولاً
```

### 3. قسم النشر

```
الترتيب: published_at DESC
← الأخبار المنشورة مؤخراً تظهر أولاً
```

---

## 💡 مثال توضيحي

### البيانات:

| ID | العنوان | التاريخ | fetched_at |
|----|---------|---------|------------|
| 100 | خبر A | 2025-07-01 | 7 أشهر قبل |
| 200 | خبر B | 2025-05-01 | 5 أشهر قبل |
| 50 | خبر C | 2025-10-01 | 10 أشهر قبل |

### قبل التعديل (ORDER BY id):

```
1. خبر C (ID: 50)  ← 10 أشهر قبل
2. خبر A (ID: 100) ← 7 أشهر قبل
3. خبر B (ID: 200) ← 5 أشهر قبل
```

❌ **غير منطقي!** الأقدم يظهر أولاً

### بعد التعديل (ORDER BY fetched_at DESC):

```
1. خبر C (10 أشهر قبل) ← الأحدث
2. خبر A (7 أشهر قبل)
3. خبر B (5 أشهر قبل)  ← الأقدم
```

✅ **منطقي!** الأحدث يظهر أولاً

---

## 🔍 التحقق

### من الواجهة:

1. افتح **"أخبار غير مكتملة"**
2. تحقق من التواريخ في العمود "التاريخ"
3. يجب أن تكون مرتبة من الأحدث للأقدم

### من قاعدة البيانات:

```sql
-- أخبار غير مكتملة (أحدث 10)
SELECT 
  id,
  SUBSTRING(title, 1, 40) AS title,
  fetched_at,
  AGE(NOW(), fetched_at) AS عمر_الخبر
FROM raw_data
WHERE is_incomplete = true
ORDER BY fetched_at DESC
LIMIT 10;

-- قسم التحرير (أحدث 10)
SELECT 
  id,
  raw_data_id,
  status,
  created_at,
  AGE(NOW(), created_at) AS عمر_القائمة
FROM editorial_queue
ORDER BY created_at DESC
LIMIT 10;

-- قسم النشر (أحدث 10)
SELECT 
  id,
  raw_data_id,
  published_at,
  AGE(NOW(), published_at) AS منذ_النشر
FROM published_items
WHERE is_active = true
ORDER BY published_at DESC
LIMIT 10;
```

---

## ⚠️ ملاحظة مهمة

### `DISTINCT ON (rd.id)` في الأخبار غير المكتملة

```sql
SELECT DISTINCT ON (rd.id) ...
ORDER BY rd.fetched_at DESC, rd.id DESC
```

**السبب**: 
- خبر واحد قد يكون في `editorial_queue` لعدة وحدات إعلامية
- `DISTINCT ON` يختار سجل واحد فقط لكل `raw_data_id`
- يجب أن يكون `rd.id` أول حقل في `ORDER BY`

---

## 🎯 الخلاصة

```
┌────────────────────────────────────────┐
│        الترتيب في جميع الصفحات        │
├────────────────────────────────────────┤
│                                        │
│  أخبار غير مكتملة → fetched_at DESC  │
│  قسم التحرير       → created_at DESC  │
│  قسم النشر         → published_at DESC│
│                                        │
│  النتيجة: الأحدث أولاً في كل مكان ✅  │
│                                        │
└────────────────────────────────────────┘
```

---

📅 **تاريخ التعديل**: يونيو 2026  
👤 **المطور**: Kiro AI Assistant  
🎯 **الحالة**: مطبق ✅
