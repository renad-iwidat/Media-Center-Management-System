# تغييرات السكيما - نظام الإدخال اليدوي للمراسلين

## التاريخ: 2026-04-19

## الهدف
ربط المراسلين بالوحدات الإعلامية وتتبع من أدخل كل محتوى (نص/صوت/فيديو) ولأي وحدة إعلامية ينتمي.

---

## التغييرات في قاعدة البيانات

### 1. جدول `raw_data`
**تم إضافة:**
```sql
ALTER TABLE raw_data 
ADD COLUMN media_unit_id BIGINT REFERENCES media_units(id);
```

**السبب:**
- كل محتوى نصي يُدخل مباشرة في `raw_data`
- الصوت والفيديو بعد معالجتهم يتحولوا لنص ويُخزنوا في `raw_data`
- بإضافة `media_unit_id` هنا، نقدر نعرف لأي وحدة إعلامية ينتمي المحتوى

**الأعمدة المهمة:**
- `created_by` → معرف المراسل (user_id)
- `media_unit_id` → معرف الوحدة الإعلامية (هنا غزة أو النجاح)

---

### 2. جدول `uploaded_files`
**تم إضافة:**
```sql
ALTER TABLE uploaded_files 
ADD COLUMN media_unit_id BIGINT REFERENCES media_units(id);
```

**السبب:**
- الصوت والفيديو يُرفعوا أولاً على S3
- معلوماتهم تُخزن في `uploaded_files`
- بإضافة `media_unit_id` هنا، نحتفظ بمعلومات الوحدة الإعلامية من البداية

**الأعمدة المهمة:**
- `uploaded_by` → معرف المراسل (user_id)
- `media_unit_id` → معرف الوحدة الإعلامية

---

### 3. جدول `users`
**تم حذف:**
```sql
ALTER TABLE users 
DROP COLUMN media_unit_id;
```

**السبب:**
- المراسل ممكن يشتغل لأكثر من وحدة إعلامية
- الأفضل تخزين `media_unit_id` مع كل محتوى بدل ربطه بالمستخدم
- هيك نقدر نتتبع كل محتوى لأي وحدة بشكل دقيق

---

## كيف يعمل النظام

### 1. إدخال نص:
```
المراسل → يختار اسمه + الوحدة الإعلامية
       → يدخل النص
       → يُخزن في raw_data مع:
          - created_by = user_id
          - media_unit_id = الوحدة المختارة
```

### 2. إدخال صوت/فيديو:
```
المراسل → يختار اسمه + الوحدة الإعلامية
       → يرفع الملف
       → يُخزن في uploaded_files مع:
          - uploaded_by = user_id
          - media_unit_id = الوحدة المختارة
       → بعد المعالجة (تحويل لنص)
       → يُخزن في raw_data مع نفس البيانات
```

---

## الاستعلامات المهمة

### جلب كل المحتوى مع معلومات المراسل والوحدة:
```sql
SELECT 
  rd.id,
  rd.title,
  rd.content,
  rd.source_type_id,
  u.name as correspondent_name,
  mu.name as media_unit_name,
  rd.fetched_at
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.source_type_id IN (6, 7, 8)  -- نص، صوت، فيديو
ORDER BY rd.fetched_at DESC;
```

### جلب محتوى وحدة إعلامية معينة:
```sql
SELECT 
  rd.*,
  u.name as correspondent_name
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
WHERE rd.media_unit_id = 1  -- هنا غزة
  AND rd.source_type_id IN (6, 7, 8)
ORDER BY rd.fetched_at DESC;
```

### جلب محتوى مراسل معين:
```sql
SELECT 
  rd.*,
  mu.name as media_unit_name
FROM raw_data rd
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.created_by = 42  -- قيس زهران
  AND rd.source_type_id IN (6, 7, 8)
ORDER BY rd.fetched_at DESC;
```

---

## API Endpoints

### GET /api/manual-input/users
جلب قائمة كل المستخدمين (للاختيار في الفرونت)

### GET /api/manual-input/media-units
جلب قائمة الوحدات الإعلامية (هنا غزة، النجاح)

### POST /api/manual-input/submit
إرسال نص جديد
```json
{
  "title": "عنوان الخبر",
  "content": "محتوى الخبر",
  "category_id": 1,
  "created_by": 42,
  "media_unit_id": 1
}
```

### POST /api/manual-input/upload-audio
رفع ملف صوتي
```
FormData:
- file: الملف
- uploaded_by: 42
- media_unit_id: 1
- title: "عنوان التسجيل"
```

### POST /api/manual-input/upload-video
رفع ملف فيديو
```
FormData:
- file: الملف
- uploaded_by: 42
- media_unit_id: 1
- title: "عنوان الفيديو"
```

---

## الفوائد

1. **تتبع دقيق:** نعرف مين أدخل كل محتوى ولأي وحدة
2. **مرونة:** المراسل يقدر يشتغل لأكثر من وحدة
3. **بساطة:** ما في حاجة لنظام login معقد
4. **تقارير:** نقدر نعمل تقارير عن إنتاجية كل مراسل ووحدة
5. **تدقيق:** نقدر نراجع كل المحتوى حسب المصدر

---

## ملاحظات مهمة

- `source_type_id = 6` → نص يدوي (user_input_text)
- `source_type_id = 7` → صوت يدوي (user_input_audio)
- `source_type_id = 8` → فيديو يدوي (user_input_video)

- `media_unit_id = 1` → هنا غزة
- `media_unit_id = 2` → النجاح

- كل المحتوى اليدوي بيمر عبر `raw_data` في النهاية
- الصوت والفيديو بيمروا أولاً عبر `uploaded_files` ثم `raw_data`
