# 🔧 إصلاح مشكلة الأخبار غير المكتملة

## 📋 المشكلة

الأخبار غير المكتملة لا تظهر في القائمة المخصصة لها، على الرغم من وجود معايير واضحة لتحديدها.

## ✅ المعايير الصحيحة للأخبار غير المكتملة

الخبر يعتبر **غير مكتمل** إذا كان:

```typescript
isIncomplete = (contentLength < 100 حرف) OR (بدون صورة)
```

### تفصيل المعايير:

| المعيار | القيمة المطلوبة | الملاحظات |
|---------|-----------------|-----------|
| **طول المحتوى** | ≥ 100 حرف | يجب أن يكون المحتوى مفصلاً وكافياً |
| **الصورة** | يجب أن تكون موجودة | `image_url` ليس `NULL` أو فارغ |
| **كلا الشرطين** | يجب تحققهما معاً | إذا فشل أي شرط، الخبر يعتبر غير مكتمل |

## 🔍 التشخيص

### 1. فحص حالة قاعدة البيانات

استخدم هذا الـ SQL للتحقق من حالة الأخبار:

```sql
-- تشغيل سكريبت الفحص
\i sql/check_incomplete_articles.sql
```

أو باستخدام psql:

```bash
psql "postgresql://media_center_db_user:r7Xdw8zqsFnNwauT2UDppnbQU9k4ZR41@dpg-d7bg2jqa214c73edlb10-a.oregon-postgres.render.com/media_center_db?sslmode=require" -f sql/check_incomplete_articles.sql
```

### 2. الأسباب المحتملة

1. **عدم مزامنة `is_incomplete` في جدول `raw_data`**
   - الأخبار القديمة قد لا تحتوي على القيمة الصحيحة
   - التحديثات لم تطبق بشكل صحيح

2. **عدم مزامنة `status` في جدول `editorial_queue`**
   - الأخبار الناقصة قد تكون في حالة `pending` بدلاً من `incomplete`

3. **اختلاف المعايير في أجزاء مختلفة من الكود**
   - بعض الملفات القديمة تستخدم 300 حرف بدلاً من 100

## 🛠️ الحل

### الخطوة 1: تطبيق سكريبت الإصلاح

```bash
# اتصل بقاعدة البيانات وطبق السكريبت
psql "postgresql://media_center_db_user:r7Xdw8zqsFnNwauT2UDppnbQU9k4ZR41@dpg-d7bg2jqa214c73edlb10-a.oregon-postgres.render.com/media_center_db?sslmode=require" -f sql/fix_incomplete_articles.sql
```

أو من داخل psql:

```sql
\i sql/fix_incomplete_articles.sql
```

### الخطوة 2: التحقق من النتائج

بعد تطبيق السكريبت، تحقق من:

1. **عدد الأخبار غير المكتملة:**
```sql
SELECT COUNT(*) FROM raw_data WHERE is_incomplete = true;
```

2. **عدد الأخبار في قائمة incomplete:**
```sql
SELECT COUNT(*) FROM editorial_queue WHERE status = 'incomplete';
```

3. **عينة من الأخبار غير المكتملة:**
```sql
SELECT 
  id,
  SUBSTRING(title, 1, 60) AS title,
  LENGTH(content) AS content_length,
  CASE 
    WHEN image_url IS NULL OR TRIM(image_url) = '' THEN 'مفقودة'
    ELSE 'موجودة'
  END AS image_status
FROM raw_data
WHERE is_incomplete = true
LIMIT 10;
```

### الخطوة 3: إعادة تشغيل الخادم

```bash
# أوقف الخادم
# Ctrl + C

# أعد تشغيل الخادم
npm run dev
```

## 🔄 التحقق من عمل النظام

### 1. من الواجهة الأمامية (Frontend)

1. افتح المتصفح وانتقل إلى: `http://localhost:5173`
2. اذهب إلى قسم **"أخبار غير مكتملة"**
3. يجب أن تظهر قائمة بالأخبار التي:
   - المحتوى أقل من 100 حرف
   - أو لا تحتوي على صورة

### 2. من الـ API

اختبر الـ endpoint:

```bash
# بدون فلترة
curl http://localhost:7845/api/news/data/articles/incomplete

# مع فلترة حسب الوحدة الإعلامية
curl http://localhost:7845/api/news/data/articles/incomplete?media_unit_id=1
```

### 3. من الكود

في ملف `flow-router.service.ts`، الكود التالي يتولى تحديد الأخبار غير المكتملة:

```typescript
// الحد الأدنى لطول المحتوى
private readonly MIN_CONTENT_LENGTH = 100;

// فحص اكتمال المحتوى
const contentLength = (article.content || '').length;
const hasImage = !!(article.image_url && article.image_url.trim());
const isComplete = contentLength >= this.MIN_CONTENT_LENGTH && hasImage;

// تحديث is_incomplete في raw_data
await this.markAsIncomplete(article.id, !isComplete);

// توزيع على editorial_queue بحالة 'incomplete'
if (!isComplete) {
  await this.distributeToQueue(article, targetMediaUnits, 'incomplete');
  result.incompleteCount++;
}
```

## 📊 الإحصائيات المتوقعة

بعد تطبيق الإصلاح، يجب أن ترى:

- **raw_data**: عدد السجلات مع `is_incomplete = true`
- **editorial_queue**: نفس العدد تقريباً مع `status = 'incomplete'`
- **Frontend**: نفس الأخبار تظهر في قسم "أخبار غير مكتملة"

## ⚠️ ملاحظات مهمة

1. **المعيار الثابت**: الكود الحالي يستخدم **100 حرف** كحد أدنى
2. **الصورة إلزامية**: جميع الأخبار يجب أن تحتوي على صورة
3. **التحديث التلقائي**: عند سحب أخبار جديدة، يتم فحصها تلقائياً
4. **إعادة المعالجة**: إذا أكمل المحرر الخبر وأرسله، يتم نقله من قائمة incomplete

## 🔐 أمان قاعدة البيانات

السكريبتات المرفقة تستخدم transaction (`BEGIN...COMMIT`) لضمان:
- تطبيق كل التحديثات معاً
- إمكانية التراجع في حالة حدوث خطأ
- عدم ترك البيانات في حالة غير متناسقة

## 📞 المساعدة

إذا استمرت المشكلة بعد تطبيق الحل:

1. تحقق من logs الخادم (Backend):
```bash
npm run dev
# ابحث عن رسائل مثل:
# "⚠️ الخبر X — ناقص (Y حرف) → incomplete"
```

2. تحقق من console المتصفح (Frontend):
```javascript
// في DevTools Console
// تحقق من الـ API response
fetch('/api/news/data/articles/incomplete')
  .then(r => r.json())
  .then(console.log);
```

3. راجع الجداول في قاعدة البيانات مباشرة

## 🎯 الخلاصة

### الشروط الصحيحة لظهور خبر في قائمة "أخبار غير مكتملة":

✅ **يجب أن يكون الخبر:**
1. طول المحتوى < 100 حرف **أو**
2. الصورة مفقودة (`image_url` فارغ أو `NULL`)
3. `fetch_status = 'processed'`
4. `is_incomplete = true` في `raw_data`
5. `status = 'incomplete'` في `editorial_queue`

❌ **لن يظهر الخبر إذا:**
- المحتوى ≥ 100 حرف **و** الصورة موجودة
- تم نشره بالفعل (`published_items`)
- تم حذفه

---

📅 **تاريخ الإنشاء**: يونيو 2026  
👤 **المؤلف**: فريق تطوير نظام إدارة المركز الإعلامي
