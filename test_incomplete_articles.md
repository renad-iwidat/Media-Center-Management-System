# 🧪 اختبار سريع للأخبار غير المكتملة

## 🎯 الهدف
اختبار النظام من البداية للنهاية

---

## ⚡ الاختبار السريع (5 دقائق)

### 1️⃣ تشغيل السكريبتات (دقيقة واحدة)

```bash
# افتح terminal واتصل بقاعدة البيانات
psql "postgresql://media_center_db_user:r7Xdw8zqsFnNwauT2UDppnbQU9k4ZR41@dpg-d7bg2jqa214c73edlb10-a.oregon-postgres.render.com/media_center_db?sslmode=require"
```

```sql
-- 1. فحص الحالة الحالية
SELECT 
  'قبل الإصلاح' AS stage,
  is_incomplete,
  COUNT(*) as count
FROM raw_data
WHERE fetch_status IN ('fetched', 'processed')
GROUP BY is_incomplete;

-- 2. تطبيق الإصلاح
\i sql/fix_incomplete_articles.sql

-- 3. فحص النتيجة
SELECT 
  'بعد الإصلاح' AS stage,
  is_incomplete,
  COUNT(*) as count
FROM raw_data
WHERE fetch_status IN ('fetched', 'processed')
GROUP BY is_incomplete;

-- 4. عرض عينة من الأخبار غير المكتملة
SELECT 
  id,
  SUBSTRING(title, 1, 40) AS العنوان,
  LENGTH(content) AS الطول,
  CASE 
    WHEN image_url IS NULL OR TRIM(image_url) = '' THEN '❌'
    ELSE '✅'
  END AS الصورة
FROM raw_data
WHERE is_incomplete = true
LIMIT 5;

\q
```

### 2️⃣ تشغيل Backend (دقيقة واحدة)

```bash
# في terminal جديد
cd c:\Users\RaghadZM\Desktop\Media-Center-Management-System
npm run dev
```

انتظر حتى ترى:
```
✅ Connected to PostgreSQL
🚀 Server running on port 7845
```

### 3️⃣ تشغيل Frontend (دقيقة واحدة)

```bash
# في terminal جديد
cd c:\Users\RaghadZM\Desktop\Media-Center-Management-System\frontend
npm run dev
```

انتظر حتى ترى:
```
VITE ready in XXXms
Local: http://localhost:5173
```

### 4️⃣ اختبار من المتصفح (دقيقتان)

1. **افتح المتصفح**: `http://localhost:5173`

2. **سجل الدخول**

3. **افتح Developer Tools (F12)**

4. **اذهب إلى Console واكتب**:

```javascript
// اختبار الـ API مباشرة
fetch('http://localhost:7845/api/data/articles/incomplete')
  .then(r => r.json())
  .then(data => {
    console.log('✅ نجح الاتصال!');
    console.log('📊 عدد الأخبار:', data.count);
    console.log('📰 الأخبار:', data.data);
    
    if (data.count > 0) {
      console.log('\n📝 تفاصيل أول خبر:');
      const first = data.data[0];
      console.log('- العنوان:', first.title);
      console.log('- طول المحتوى:', first.content?.length || 0, 'حرف');
      console.log('- الصورة:', first.image_url ? '✅ موجودة' : '❌ مفقودة');
      console.log('- التصنيف:', first.category_name || 'بدون تصنيف');
    } else {
      console.log('⚠️ لا توجد أخبار غير مكتملة');
    }
  })
  .catch(err => {
    console.error('❌ خطأ:', err);
  });
```

5. **اضغط على قسم "أخبار غير مكتملة" من القائمة**

6. **تحقق من**:
   - ✅ تظهر الأخبار؟
   - ✅ العناوين صحيحة؟
   - ✅ طول المحتوى يظهر؟
   - ✅ يمكنك الضغط على "تكملة"؟

---

## 🔍 النتائج المتوقعة

### ✅ إذا كان كل شيء يعمل:

```
Console Output:
✅ نجح الاتصال!
📊 عدد الأخبار: X
📰 الأخبار: [...]

📝 تفاصيل أول خبر:
- العنوان: ...
- طول المحتوى: YY حرف (أقل من 100)
- الصورة: ❌ مفقودة أو ✅ موجودة
- التصنيف: ...
```

### ❌ إذا لم يعمل:

#### المشكلة 1: `count: 0`

**السبب**: لا توجد أخبار غير مكتملة بعد
**الحل**: 
```sql
-- إنشاء خبر اختباري غير مكتمل
INSERT INTO raw_data (
  source_id, 
  source_type_id,
  title, 
  content, 
  url, 
  image_url,
  fetch_status,
  is_incomplete
) VALUES (
  1,
  1,
  'خبر اختباري قصير',
  'محتوى قصير جداً', -- أقل من 100 حرف
  'https://test.com',
  NULL, -- بدون صورة
  'processed',
  true
);
```

#### المشكلة 2: `404 Not Found`

**السبب**: Backend لا يعمل
**الحل**: تحقق من أن Backend يعمل على المنفذ 7845

#### المشكلة 3: `500 Internal Server Error`

**السبب**: خطأ في قاعدة البيانات
**الحل**: تحقق من logs الخادم

---

## 🧪 اختبار التحرير (دقيقة إضافية)

1. **اضغط "تكملة" على أحد الأخبار**

2. **عدّل المحتوى**:
   - اكتب نص أطول من 100 حرف
   - أضف رابط صورة: `https://via.placeholder.com/800x600`

3. **اختر تصنيف**

4. **اضغط "حفظ وإرسال"**

5. **تحقق**:
   - ✅ اختفى الخبر من قائمة "أخبار غير مكتملة"؟
   - ✅ ظهر في قسم "التحرير"؟

---

## 📊 ملخص الاختبار

| الخطوة | الحالة | الوقت |
|--------|--------|-------|
| 1. إصلاح قاعدة البيانات | ⬜ | 1 دقيقة |
| 2. تشغيل Backend | ⬜ | 1 دقيقة |
| 3. تشغيل Frontend | ⬜ | 1 دقيقة |
| 4. اختبار الواجهة | ⬜ | 2 دقيقة |
| 5. اختبار التحرير | ⬜ | 1 دقيقة (اختياري) |

**المجموع**: 5-6 دقائق

---

## 🎯 الخلاصة

بعد إكمال جميع الخطوات، يجب أن:

✅ تظهر الأخبار غير المكتملة في القائمة
✅ يمكن فلترة وترتيب الأخبار
✅ يمكن تحرير وإكمال الأخبار
✅ تختفي الأخبار المكتملة من القائمة

---

## 🆘 إذا لم يعمل

راجع:
1. `docs/INCOMPLETE_ARTICLES_FIX.md` - شرح تفصيلي كامل
2. `docs/FRONTEND_INCOMPLETE_CHECKLIST.md` - فحص Frontend
3. `INCOMPLETE_FIX_README.md` - دليل سريع

أو اطلب المساعدة! 🙋‍♂️
