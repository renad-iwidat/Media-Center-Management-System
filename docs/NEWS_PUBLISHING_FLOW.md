# 📰 دليل كامل: رحلة الخبر من البداية للنشر

## 🎯 الفكرة الأساسية

```
الخبر يمر بـ 3 مراحل رئيسية:
1️⃣ السحب والتصنيف (Fetching & Classification)
2️⃣ قسم التحرير (Editorial Queue)
3️⃣ النشر (Publishing)
```

---

## 🔄 رحلة الخبر الكاملة

### المرحلة 1️⃣: السحب والتصنيف

```
مصادر الأخبار (RSS/API)
         ↓
    raw_data (fetch_status = 'fetched')
         ↓
   تصنيف AI (إذا لم يكن له تصنيف)
         ↓
   فحص اكتمال المحتوى
```

**شروط الاكتمال**:
- ✅ المحتوى ≥ 100 حرف
- ✅ الصورة موجودة (image_url ليس NULL أو فارغ)

---

### المرحلة 2️⃣: التوجيه (Flow Routing)

بناءً على **التصنيف** يتم تحديد المسار:

#### 🔵 مسار تحريري (Editorial Flow)

**التصنيفات**: سياسي، محلي، دولي

```
الخبر → editorial_queue (status = 'pending')
     ↓
المحرر يراجع ويوافق
     ↓
status = 'approved'
     ↓
published_items
```

**الشروط للوصول لقسم النشر**:
1. ✅ المحتوى مكتمل (≥ 100 حرف + صورة)
2. ✅ المحرر وافق عليه (`status = 'approved'`)
3. ✅ تم نقله إلى `published_items`

#### ⚡ مسار آلي (Automated Flow)

**التصنيفات**: اقتصاد، رياضة، صحة، علوم وتكنولوجيا، فن وثقافة، بيئة، غذاء

```
الخبر → editorial_queue (status = 'pending')
     ↓
النظام يوافق تلقائياً (status = 'approved')
     ↓
published_items (فوراً بدون انتظار المحرر)
```

**الشروط للنشر التلقائي**:
1. ✅ المحتوى مكتمل (≥ 100 حرف + صورة)
2. ✅ التصنيف = automated (مثل: رياضة، اقتصاد، إلخ)
3. ✅ النظام يوافق تلقائياً

---

## 📊 مخطط التدفق الكامل

```
┌─────────────────────────────────────────────────────────────┐
│                    1. سحب الأخبار                           │
│              من RSS feeds أو NewsDesk API                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
          ┌──────────────────────┐
          │   raw_data           │
          │ fetch_status='fetched'│
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │  2. تصنيف AI        │
          │  (إذا لم يكن مصنف) │
          └──────────┬───────────┘
                     ↓
          ┌──────────────────────┐
          │ 3. فحص الاكتمال     │
          │ (100 حرف + صورة)    │
          └──────────┬───────────┘
                     ↓
        ┌────────────┴────────────┐
        │                         │
    ❌ غير مكتمل            ✅ مكتمل
        │                         │
        ↓                         ↓
┌──────────────┐      ┌───────────────────────┐
│ incomplete   │      │ 4. تحديد نوع الفلو   │
│ (ينتظر      │      │ حسب التصنيف          │
│  المحرر)     │      └──────────┬────────────┘
└──────────────┘                 │
                    ┌────────────┴────────────┐
                    │                         │
              🔵 editorial              ⚡ automated
              (سياسي/محلي/دولي)        (رياضة/اقتصاد...)
                    │                         │
                    ↓                         ↓
        ┌───────────────────┐     ┌──────────────────┐
        │ editorial_queue   │     │ editorial_queue  │
        │ status='pending'  │     │ status='pending' │
        └────────┬──────────┘     └────────┬─────────┘
                 │                         │
        المحرر يراجع              النظام ينشر تلقائياً
        ويوافق عليه                    (كل 10 دقائق)
                 │                         │
                 ↓                         ↓
        ┌───────────────────┐     ┌──────────────────┐
        │ status='approved' │     │ status='approved'│
        └────────┬──────────┘     └────────┬─────────┘
                 │                         │
                 └──────────┬──────────────┘
                            ↓
                 ┌──────────────────┐
                 │ published_items  │
                 │ (قسم النشر)      │
                 │ is_active=true   │
                 └──────────────────┘
                            ↓
                 ┌──────────────────┐
                 │ 5. النشر الخارجي │
                 │ على الموقع       │
                 │ (auto_publish)   │
                 └──────────────────┘
```

---

## ✅ شروط النشر (للوصول إلى `published_items`)

### 📝 للأخبار التحريرية (Editorial):

| الشرط | التفاصيل | إلزامي؟ |
|-------|---------|---------|
| **1. اكتمال المحتوى** | ≥ 100 حرف + صورة | ✅ نعم |
| **2. في قسم التحرير** | `editorial_queue.status = 'pending'` | ✅ نعم |
| **3. موافقة المحرر** | المحرر يضغط "موافقة" | ✅ نعم |
| **4. عدم الرفض** | `status ≠ 'rejected'` | ✅ نعم |

### ⚡ للأخبار الآلية (Automated):

| الشرط | التفاصيل | إلزامي؟ |
|-------|---------|---------|
| **1. اكتمال المحتوى** | ≥ 100 حرف + صورة | ✅ نعم |
| **2. التصنيف آلي** | `categories.flow = 'automated'` | ✅ نعم |
| **3. موافقة تلقائية** | النظام يوافق تلقائياً (كل 10 دقائق) | ✅ نعم |

---

## 🔍 حالات الأخبار (Status)

| الحالة | المعنى | الخطوة التالية |
|--------|--------|----------------|
| **incomplete** | ❌ ناقص (محتوى قصير أو بدون صورة) | المحرر يكمله |
| **pending** | ⏳ في انتظار المراجعة | المحرر يراجعه |
| **in_review** | 👁️ قيد المراجعة | المحرر يقرر |
| **approved** | ✅ تمت الموافقة | يُنشر في `published_items` |
| **rejected** | ❌ تم الرفض | لا يُنشر (ينتهي هنا) |

---

## 📍 أين يوجد الخبر في كل مرحلة؟

### 1️⃣ بعد السحب:
```sql
SELECT * FROM raw_data WHERE fetch_status = 'fetched';
```

### 2️⃣ الأخبار غير المكتملة:
```sql
SELECT * FROM raw_data 
WHERE is_incomplete = true 
AND fetch_status = 'processed';
```

أو من قائمة التحرير:
```sql
SELECT * FROM editorial_queue WHERE status = 'incomplete';
```

### 3️⃣ في انتظار المحرر:
```sql
SELECT * FROM editorial_queue WHERE status = 'pending';
```

### 4️⃣ تمت الموافقة:
```sql
SELECT * FROM editorial_queue WHERE status = 'approved';
```

### 5️⃣ في قسم النشر (جاهز للنشر الخارجي):
```sql
SELECT * FROM published_items WHERE is_active = true;
```

---

## 🎯 كيف يصل الخبر لقسم النشر؟

### للمحرر (يدوي):

#### 1. الخبر مكتمل في قسم التحرير

```typescript
// المحرر يفتح الخبر من قائمة "قسم التحرير"
// ويضغط زر "موافقة" ✅
```

**ماذا يحدث بالضبط؟**

```typescript
// 1. تحديث الحالة إلى 'approved'
UPDATE editorial_queue 
SET status = 'approved', updated_at = NOW() 
WHERE id = QUEUE_ID;

// 2. إضافة للنشر
INSERT INTO published_items (
  media_unit_id,
  raw_data_id,
  queue_id,
  content_type_id,
  title,
  content,
  image_url,
  tags,
  is_active,
  published_at
) VALUES (
  ...,
  true,  -- is_active = true
  NOW()
);
```

#### 2. الخبر غير مكتمل

```typescript
// المحرر يفتح الخبر من "أخبار غير مكتملة"
// يكمل المحتوى (> 100 حرف)
// يضيف صورة
// يضغط "حفظ وإرسال"
```

**ماذا يحدث؟**

```typescript
// 1. تحديث المحتوى
UPDATE raw_data 
SET 
  content = NEW_CONTENT,
  title = NEW_TITLE,
  image_url = NEW_IMAGE,
  is_incomplete = false
WHERE id = ARTICLE_ID;

// 2. تحديث الحالة في القائمة
UPDATE editorial_queue 
SET status = 'pending'  -- أو 'approved' للآلي
WHERE raw_data_id = ARTICLE_ID;

// 3. إذا كان آلي → ينشر فوراً
// إذا كان تحريري → ينتظر موافقة المحرر
```

### للنظام (تلقائي):

**كل 10 دقائق** يعمل النظام:

```typescript
// 1. البحث عن أخبار آلية مكتملة لم تُنشر
SELECT eq.id, eq.media_unit_id, eq.raw_data_id, rd.title, rd.content
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
WHERE c.flow = 'automated'          -- تصنيف آلي ⚡
  AND eq.status = 'pending'         -- لم تتم الموافقة عليه بعد
  AND LENGTH(rd.content) >= 100     -- محتوى كافٍ
  AND NOT EXISTS (
    SELECT 1 FROM published_items 
    WHERE raw_data_id = eq.raw_data_id
  );                                -- لم يُنشر من قبل

// 2. لكل خبر:
UPDATE editorial_queue SET status = 'approved' WHERE id = QUEUE_ID;

// 3. نشر
INSERT INTO published_items (...) VALUES (...);
```

---

## 💡 أمثلة عملية

### مثال 1: خبر رياضي (آلي) ⚡

```
1. يتم سحبه من مصدر رياضي
   ↓
2. التصنيف: رياضة → flow = 'automated'
   ↓
3. فحص: محتوى 250 حرف ✅ + صورة ✅
   ↓
4. يذهب إلى editorial_queue (status = 'pending')
   ↓
5. النظام يكتشفه تلقائياً (خلال 10 دقائق)
   ↓
6. status = 'approved'
   ↓
7. published_items ✅ (يظهر في قسم النشر)
```

### مثال 2: خبر سياسي (تحريري) 🔵

```
1. يتم سحبه من مصدر سياسي
   ↓
2. التصنيف: سياسي → flow = 'editorial'
   ↓
3. فحص: محتوى 300 حرف ✅ + صورة ✅
   ↓
4. يذهب إلى editorial_queue (status = 'pending')
   ↓
5. المحرر يراجع الخبر
   ↓
6. المحرر يضغط "موافقة" ✅
   ↓
7. status = 'approved'
   ↓
8. published_items ✅ (يظهر في قسم النشر)
```

### مثال 3: خبر ناقص ❌

```
1. يتم سحبه من مصدر
   ↓
2. فحص: محتوى 50 حرف ❌ (أقل من 100)
   ↓
3. is_incomplete = true
   ↓
4. يذهب إلى editorial_queue (status = 'incomplete')
   ↓
5. يظهر في قائمة "أخبار غير مكتملة"
   ↓
6. المحرر يكمله:
   - يضيف محتوى (> 100 حرف)
   - يضيف صورة
   - يضغط "حفظ وإرسال"
   ↓
7. status = 'pending' (أو 'approved' للآلي)
   ↓
8. يتبع المسار العادي (تحريري أو آلي)
```

---

## 🔑 نقاط مهمة

### ✅ الخبر يصل لقسم النشر (`published_items`) عندما:

1. **يكون مكتمل** (≥ 100 حرف + صورة)
2. **تتم الموافقة عليه**:
   - يدوياً: المحرر يوافق
   - آلياً: النظام يوافق (كل 10 دقائق)
3. **لم يُرفض** (`status ≠ 'rejected'`)
4. **لم يُنشر من قبل** (لا يوجد في `published_items`)

### ⚠️ الخبر لا يصل لقسم النشر إذا:

1. ❌ غير مكتمل (< 100 حرف أو بدون صورة)
2. ❌ تم رفضه (`status = 'rejected'`)
3. ❌ لا يزال في انتظار المراجعة (`status = 'pending'`)
4. ❌ تم نشره مسبقاً

---

## 📊 ملخص الحالات

```
┌─────────────────────────────────────────────────────────┐
│              حالات الخبر في النظام                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  raw_data.fetch_status:                                │
│    • fetched    → تم سحبه للتو                        │
│    • processed  → تم معالجته وتوزيعه                  │
│                                                         │
│  raw_data.is_incomplete:                               │
│    • true   → ناقص (< 100 حرف أو بدون صورة)          │
│    • false  → مكتمل                                    │
│                                                         │
│  editorial_queue.status:                               │
│    • incomplete  → ناقص (ينتظر الإكمال)              │
│    • pending     → في انتظار المراجعة                │
│    • in_review   → قيد المراجعة                       │
│    • approved    → تمت الموافقة (يُنشر)               │
│    • rejected    → تم الرفض (لا يُنشر)                │
│                                                         │
│  published_items.is_active:                            │
│    • true   → منشور ونشط (يظهر في قسم النشر)         │
│    • false  → تم إلغاء تفعيله                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 أسئلة شائعة

### س1: لماذا لا يظهر الخبر في قسم النشر؟

**الأسباب المحتملة**:
1. لم تتم الموافقة عليه بعد (`status ≠ 'approved'`)
2. غير مكتمل (`is_incomplete = true`)
3. تم رفضه (`status = 'rejected'`)
4. خطأ في النشر

**الحل**:
```sql
-- تحقق من حالة الخبر
SELECT 
  rd.id,
  rd.title,
  rd.is_incomplete,
  eq.status,
  EXISTS(SELECT 1 FROM published_items WHERE raw_data_id = rd.id) as is_published
FROM raw_data rd
LEFT JOIN editorial_queue eq ON rd.id = eq.raw_data_id
WHERE rd.id = YOUR_ARTICLE_ID;
```

### س2: كيف أنشر خبر تحريري فوراً؟

**الجواب**: يجب على المحرر:
1. فتح الخبر من "قسم التحرير"
2. مراجعته
3. الضغط على "موافقة" ✅

### س3: متى ينشر النظام الأخبار الآلية؟

**الجواب**: كل **10 دقائق** يعمل Scheduler ويبحث عن أخبار آلية مكتملة ويوافق عليها تلقائياً.

---

📅 **تاريخ الإنشاء**: يونيو 2026  
👤 **المطور**: Kiro AI Assistant  
🎯 **الحالة**: جاهز للاستخدام
