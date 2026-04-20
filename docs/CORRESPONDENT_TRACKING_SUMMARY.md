# ملخص نظام تتبع المراسلين والوحدات الإعلامية

## التاريخ: 2026-04-19

---

## 📋 نظرة عامة

تم تطوير نظام متكامل لتتبع المراسلين والوحدات الإعلامية في ميزة الإدخال اليدوي. النظام يسمح بمعرفة:
- من أدخل كل محتوى (نص/صوت/فيديو)
- لأي وحدة إعلامية ينتمي المحتوى
- تتبع دقيق لكل عملية إدخال

---

## 🎯 الأهداف المحققة

### 1. ربط المراسلين بالوحدات الإعلامية
- كل مراسل يختار اسمه والوحدة الإعلامية عند كل عملية إدخال
- مرونة كاملة: المراسل يقدر يشتغل لأكثر من وحدة إعلامية
- لا حاجة لنظام login معقد

### 2. تتبع شامل للمحتوى
- كل محتوى نصي يُخزن مباشرة مع معلومات المراسل والوحدة
- الصوت والفيديو يُخزنوا أولاً في `uploaded_files` ثم في `raw_data` بعد المعالجة
- سهولة استرجاع البيانات حسب المراسل أو الوحدة

### 3. واجهة مستخدم بسيطة
- قوائم منسدلة لاختيار المراسل والوحدة في كل صفحة
- تصميم موحد عبر صفحات النص والصوت والفيديو
- رسائل خطأ واضحة إذا لم يتم الاختيار

---

## 🗄️ التغييرات في قاعدة البيانات

### 1. جدول `raw_data`
```sql
ALTER TABLE raw_data 
ADD COLUMN media_unit_id BIGINT REFERENCES media_units(id);
```

**الأعمدة المهمة:**
- `created_by` → معرف المراسل (user_id)
- `media_unit_id` → معرف الوحدة الإعلامية
- `source_type_id` → نوع المصدر (6=نص، 7=صوت، 8=فيديو)

**الفائدة:**
- كل محتوى (نص/صوت/فيديو) بيوصل في النهاية لـ `raw_data`
- نقدر نعرف مين أدخله ولأي وحدة ينتمي

---

### 2. جدول `uploaded_files`
```sql
ALTER TABLE uploaded_files 
ADD COLUMN media_unit_id BIGINT REFERENCES media_units(id);
```

**الأعمدة المهمة:**
- `uploaded_by` → معرف المراسل (user_id)
- `media_unit_id` → معرف الوحدة الإعلامية
- `file_type` → نوع الملف (audio/video)
- `processing_status` → حالة المعالجة (pending/processing/completed/failed)

**الفائدة:**
- الصوت والفيديو يُرفعوا أولاً على S3
- نحتفظ بمعلومات المراسل والوحدة من البداية
- نقدر نتتبع حالة معالجة كل ملف

---

### 3. جدول `users`
```sql
ALTER TABLE users 
DROP COLUMN media_unit_id;
```

**السبب:**
- المراسل ممكن يشتغل لأكثر من وحدة إعلامية
- الأفضل تخزين `media_unit_id` مع كل محتوى بدل ربطه بالمستخدم
- هيك نقدر نتتبع كل محتوى لأي وحدة بشكل دقيق ومرن

---

## 🔄 سير العمل (Workflow)

### إدخال نص:
```
1. المراسل يفتح صفحة إدخال النص
2. يختار اسمه من القائمة المنسدلة
3. يختار الوحدة الإعلامية من القائمة المنسدلة
4. يدخل عنوان الخبر والمحتوى
5. يضغط "إرسال الخبر"
6. يُخزن في raw_data مع:
   - created_by = user_id
   - media_unit_id = الوحدة المختارة
   - source_type_id = 6 (نص)
```

### إدخال صوت:
```
1. المراسل يفتح صفحة إدخال الصوت
2. يسجل صوت أو يرفع ملف صوتي
3. يختار اسمه من القائمة المنسدلة
4. يختار الوحدة الإعلامية من القائمة المنسدلة
5. يدخل عنوان التسجيل
6. يضغط "رفع الملف"
7. يُخزن في uploaded_files مع:
   - uploaded_by = user_id
   - media_unit_id = الوحدة المختارة
   - file_type = 'audio'
   - processing_status = 'pending'
8. بعد المعالجة (تحويل لنص):
   - يُخزن في raw_data مع نفس البيانات
   - source_type_id = 7 (صوت)
```

### إدخال فيديو:
```
1. المراسل يفتح صفحة إدخال الفيديو
2. يسجل فيديو أو يرفع ملف فيديو
3. يختار اسمه من القائمة المنسدلة
4. يختار الوحدة الإعلامية من القائمة المنسدلة
5. يدخل عنوان الفيديو
6. يضغط "رفع الفيديو"
7. يُخزن في uploaded_files مع:
   - uploaded_by = user_id
   - media_unit_id = الوحدة المختارة
   - file_type = 'video'
   - processing_status = 'pending'
8. بعد المعالجة (تحويل لنص):
   - يُخزن في raw_data مع نفس البيانات
   - source_type_id = 8 (فيديو)
```

---

## 🔌 API Endpoints

### GET Endpoints

#### `/api/manual-input/users`
جلب قائمة كل المستخدمين (للاختيار في الفرونت)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "name": "قيس زهران",
      "email": "qais@example.com",
      "media_unit_id": null,
      "media_unit_name": null
    }
  ]
}
```

---

#### `/api/manual-input/media-units`
جلب قائمة الوحدات الإعلامية النشطة

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "هنا غزة",
      "slug": "hona-gaza",
      "is_active": true
    },
    {
      "id": 2,
      "name": "النجاح",
      "slug": "al-najah",
      "is_active": true
    }
  ]
}
```

---

#### `/api/manual-input/categories`
جلب التصنيفات النشطة

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "سياسة",
      "slug": "politics",
      "flow": "flow_name",
      "is_active": true
    }
  ]
}
```

---

### POST Endpoints

#### `/api/manual-input/submit`
إرسال خبر نصي جديد

**Request Body:**
```json
{
  "title": "عنوان الخبر",
  "content": "محتوى الخبر الكامل...",
  "category_id": 1,
  "created_by": 42,
  "media_unit_id": 1,
  "source_id": 14,
  "source_type_id": 6,
  "fetch_status": "fetched"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 12345,
    "title": "عنوان الخبر",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-19T10:30:00Z"
  },
  "message": "تم إضافة الخبر بنجاح"
}
```

---

#### `/api/manual-input/upload-audio`
رفع ملف صوتي

**Request:** `multipart/form-data`
- `file`: الملف الصوتي (required)
- `uploaded_by`: معرف المستخدم (required)
- `media_unit_id`: معرف الوحدة الإعلامية (required)
- `title`: عنوان التسجيل (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "file_url": "https://s3.amazonaws.com/bucket/manual-input-audio/...",
    "file_size": 2048576,
    "original_filename": "recording.mp3",
    "processing_status": "pending",
    "uploaded_at": "2026-04-19T10:30:00Z"
  },
  "message": "تم رفع الملف الصوتي بنجاح"
}
```

---

#### `/api/manual-input/upload-video`
رفع ملف فيديو

**Request:** `multipart/form-data`
- `file`: ملف الفيديو (required)
- `uploaded_by`: معرف المستخدم (required)
- `media_unit_id`: معرف الوحدة الإعلامية (required)
- `title`: عنوان الفيديو (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "file_url": "https://s3.amazonaws.com/bucket/manual-input-video/...",
    "file_size": 52428800,
    "original_filename": "video.mp4",
    "processing_status": "pending",
    "uploaded_at": "2026-04-19T10:30:00Z"
  },
  "message": "تم رفع ملف الفيديو بنجاح"
}
```

---

## 📊 استعلامات قاعدة البيانات المهمة

### 1. جلب كل المحتوى مع معلومات المراسل والوحدة
```sql
SELECT 
  rd.id,
  rd.title,
  rd.content,
  rd.source_type_id,
  u.name as correspondent_name,
  u.email as correspondent_email,
  mu.name as media_unit_name,
  mu.slug as media_unit_slug,
  rd.fetched_at,
  rd.created_at
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.source_type_id IN (6, 7, 8)  -- نص، صوت، فيديو
ORDER BY rd.fetched_at DESC;
```

---

### 2. جلب محتوى وحدة إعلامية معينة
```sql
SELECT 
  rd.id,
  rd.title,
  rd.content,
  u.name as correspondent_name,
  CASE 
    WHEN rd.source_type_id = 6 THEN 'نص'
    WHEN rd.source_type_id = 7 THEN 'صوت'
    WHEN rd.source_type_id = 8 THEN 'فيديو'
  END as content_type,
  rd.fetched_at
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
WHERE rd.media_unit_id = 1  -- هنا غزة
  AND rd.source_type_id IN (6, 7, 8)
ORDER BY rd.fetched_at DESC;
```

---

### 3. جلب محتوى مراسل معين
```sql
SELECT 
  rd.id,
  rd.title,
  rd.content,
  mu.name as media_unit_name,
  CASE 
    WHEN rd.source_type_id = 6 THEN 'نص'
    WHEN rd.source_type_id = 7 THEN 'صوت'
    WHEN rd.source_type_id = 8 THEN 'فيديو'
  END as content_type,
  rd.fetched_at
FROM raw_data rd
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.created_by = 42  -- قيس زهران
  AND rd.source_type_id IN (6, 7, 8)
ORDER BY rd.fetched_at DESC;
```

---

### 4. إحصائيات المراسلين
```sql
SELECT 
  u.name as correspondent_name,
  mu.name as media_unit_name,
  COUNT(*) as total_submissions,
  SUM(CASE WHEN rd.source_type_id = 6 THEN 1 ELSE 0 END) as text_count,
  SUM(CASE WHEN rd.source_type_id = 7 THEN 1 ELSE 0 END) as audio_count,
  SUM(CASE WHEN rd.source_type_id = 8 THEN 1 ELSE 0 END) as video_count,
  MAX(rd.fetched_at) as last_submission
FROM raw_data rd
JOIN users u ON rd.created_by = u.id
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.source_type_id IN (6, 7, 8)
GROUP BY u.id, u.name, mu.id, mu.name
ORDER BY total_submissions DESC;
```

---

### 5. إحصائيات الوحدات الإعلامية
```sql
SELECT 
  mu.name as media_unit_name,
  COUNT(DISTINCT rd.created_by) as unique_correspondents,
  COUNT(*) as total_submissions,
  SUM(CASE WHEN rd.source_type_id = 6 THEN 1 ELSE 0 END) as text_count,
  SUM(CASE WHEN rd.source_type_id = 7 THEN 1 ELSE 0 END) as audio_count,
  SUM(CASE WHEN rd.source_type_id = 8 THEN 1 ELSE 0 END) as video_count
FROM raw_data rd
JOIN media_units mu ON rd.media_unit_id = mu.id
WHERE rd.source_type_id IN (6, 7, 8)
GROUP BY mu.id, mu.name
ORDER BY total_submissions DESC;
```

---

### 6. جلب الملفات المعلقة للمعالجة
```sql
SELECT 
  uf.id,
  uf.file_type,
  uf.original_filename,
  uf.s3_url,
  u.name as uploaded_by_name,
  mu.name as media_unit_name,
  uf.uploaded_at
FROM uploaded_files uf
JOIN users u ON uf.uploaded_by = u.id
JOIN media_units mu ON uf.media_unit_id = mu.id
WHERE uf.processing_status = 'pending'
ORDER BY uf.uploaded_at ASC;
```

---

## 💻 الملفات المعدلة

### Backend Files

#### 1. Database Schema
- `src/utils/manual-input/move-media-unit-to-raw-data.ts`
  - سكريبت لإضافة `media_unit_id` إلى `raw_data` و `uploaded_files`
  - حذف `media_unit_id` من `users`

#### 2. Models
- `src/models/manual-input/ManualInput.ts`
  - تحديث الـ types لتشمل `media_unit_id`

#### 3. Services
- `src/services/manual-input/ManualInputService.ts`
  - إضافة `getAllUsers()` - جلب كل المستخدمين
  - إضافة `getMediaUnits()` - جلب الوحدات الإعلامية
  - تحديث `saveUploadedFile()` لقبول `media_unit_id`
  - حذف `getCorrespondents()` و `updateUserMediaUnit()` (لم تعد مطلوبة)

#### 4. Controllers
- `src/controllers/manual-input/ManualInputController.ts`
  - إضافة `getAllUsers()` endpoint
  - إضافة `getMediaUnits()` endpoint
  - تحديث `uploadAudio()` لطلب `media_unit_id`
  - تحديث `uploadVideo()` لطلب `media_unit_id`
  - حذف `selectCorrespondent()` (لم يعد مطلوب)

#### 5. Routes
- `src/routes/manual-input/index.ts`
  - إضافة `GET /api/manual-input/users`
  - إضافة `GET /api/manual-input/media-units`
  - حذف `POST /api/manual-input/select-correspondent`

---

### Frontend Files

#### 1. Text Input Page
- `manual-input-frontend/src/pages/ManualInputText.tsx`
  - إضافة قائمة منسدلة لاختيار المراسل
  - إضافة قائمة منسدلة لاختيار الوحدة الإعلامية
  - تحديث validation لطلب الاختيارين
  - إرسال `created_by` و `media_unit_id` مع البيانات

#### 2. Audio Input Page
- `manual-input-frontend/src/pages/ManualInputAudio.tsx`
  - إضافة قائمة منسدلة لاختيار المراسل
  - إضافة قائمة منسدلة لاختيار الوحدة الإعلامية
  - تحديث validation لطلب الاختيارين
  - إرسال `uploaded_by` و `media_unit_id` مع الملف

#### 3. Video Input Page
- `manual-input-frontend/src/pages/ManualInputVideo.tsx`
  - إضافة قائمة منسدلة لاختيار المراسل
  - إضافة قائمة منسدلة لاختيار الوحدة الإعلامية
  - تحديث validation لطلب الاختيارين
  - إرسال `uploaded_by` و `media_unit_id` مع الملف

---

### Documentation Files

#### 1. Schema Changes Documentation
- `docs/MANUAL_INPUT_SCHEMA_CHANGES.md`
  - توثيق شامل للتغييرات في السكيما
  - شرح الأسباب والفوائد
  - أمثلة على الاستعلامات

#### 2. Summary Documentation (هذا الملف)
- `docs/CORRESPONDENT_TRACKING_SUMMARY.md`
  - ملخص شامل للنظام
  - سير العمل الكامل
  - API endpoints
  - استعلامات قاعدة البيانات
  - قائمة الملفات المعدلة

---

## ✅ الفوائد المحققة

### 1. تتبع دقيق
- نعرف بالضبط مين أدخل كل محتوى
- نعرف لأي وحدة إعلامية ينتمي المحتوى
- نقدر نتتبع كل عملية إدخال من البداية للنهاية

### 2. مرونة عالية
- المراسل يقدر يشتغل لأكثر من وحدة إعلامية
- ما في قيود على عدد المراسلين أو الوحدات
- سهولة إضافة مراسلين أو وحدات جديدة

### 3. بساطة الاستخدام
- لا حاجة لنظام login معقد
- المراسل يختار اسمه والوحدة من قوائم بسيطة
- واجهة موحدة عبر كل صفحات الإدخال

### 4. تقارير وإحصائيات
- نقدر نعمل تقارير عن إنتاجية كل مراسل
- نقدر نعمل تقارير عن محتوى كل وحدة إعلامية
- نقدر نحلل أنواع المحتوى (نص/صوت/فيديو)

### 5. تدقيق ومراجعة
- نقدر نراجع كل المحتوى حسب المصدر
- نقدر نتتبع أي مشاكل لمصدرها
- نقدر نحسن الجودة بناءً على البيانات

---

## 🔐 ملاحظات أمنية

### 1. التحقق من البيانات
- كل API endpoint يتحقق من وجود `user_id` و `media_unit_id`
- التحقق من صحة أنواع الملفات وأحجامها
- التحقق من صحة البيانات قبل الحفظ

### 2. حماية الملفات
- الملفات تُرفع على S3 مع أسماء فريدة
- استخدام timestamps و random strings لمنع التضارب
- التحقق من نوع الملف قبل الرفع

### 3. قاعدة البيانات
- استخدام Foreign Keys للحفاظ على سلامة البيانات
- استخدام Prepared Statements لمنع SQL Injection
- التحقق من وجود السجلات قبل الربط

---

## 📈 التطويرات المستقبلية المقترحة

### 1. نظام الصلاحيات
- إضافة صلاحيات مختلفة للمراسلين
- تحديد من يقدر يدخل لأي وحدة إعلامية
- نظام موافقات للمحتوى الحساس

### 2. لوحة تحكم للإحصائيات
- عرض إحصائيات المراسلين في الوقت الفعلي
- رسوم بيانية لأنواع المحتوى
- تقارير شهرية وسنوية

### 3. نظام الإشعارات
- إشعار المراسل عند نجاح/فشل الرفع
- إشعار المحررين عند إدخال محتوى جديد
- إشعارات عند اكتمال معالجة الصوت/الفيديو

### 4. تحسينات الأداء
- Caching لقوائم المستخدمين والوحدات
- Pagination للمحتوى الكبير
- Lazy loading للملفات

### 5. نظام المراجعة
- إضافة حالة "قيد المراجعة" للمحتوى
- نظام تعليقات للمحررين
- سجل التعديلات (audit log)

---

## 🧪 الاختبار

### اختبار النص:
1. افتح `http://localhost:3003/text`
2. اختر مراسل من القائمة
3. اختر وحدة إعلامية
4. أدخل عنوان ومحتوى
5. اضغط "إرسال الخبر"
6. تحقق من حفظ البيانات في `raw_data`

### اختبار الصوت:
1. افتح `http://localhost:3003/audio`
2. سجل صوت أو ارفع ملف
3. اختر مراسل من القائمة
4. اختر وحدة إعلامية
5. أدخل عنوان
6. اضغط "رفع الملف"
7. تحقق من رفع الملف على S3
8. تحقق من حفظ البيانات في `uploaded_files`

### اختبار الفيديو:
1. افتح `http://localhost:3003/video`
2. سجل فيديو أو ارفع ملف
3. اختر مراسل من القائمة
4. اختر وحدة إعلامية
5. أدخل عنوان
6. اضغط "رفع الفيديو"
7. تحقق من رفع الملف على S3
8. تحقق من حفظ البيانات في `uploaded_files`

---

## 📞 الدعم والمساعدة

للأسئلة أو المشاكل:
1. راجع التوثيق في `docs/`
2. تحقق من الـ logs في الـ console
3. استخدم استعلامات SQL للتحقق من البيانات
4. تواصل مع فريق التطوير

---

## 📝 الخلاصة

تم بنجاح تطوير نظام متكامل لتتبع المراسلين والوحدات الإعلامية في ميزة الإدخال اليدوي. النظام يوفر:

✅ تتبع دقيق لكل محتوى ومصدره
✅ مرونة في ربط المراسلين بالوحدات
✅ واجهة بسيطة وسهلة الاستخدام
✅ API endpoints واضحة ومنظمة
✅ استعلامات قوية للتقارير والإحصائيات
✅ توثيق شامل للنظام

النظام جاهز للاستخدام ويمكن تطويره مستقبلاً حسب الحاجة.

---

**تاريخ الإنشاء:** 2026-04-19  
**الإصدار:** 1.0  
**الحالة:** ✅ مكتمل وجاهز للاستخدام
