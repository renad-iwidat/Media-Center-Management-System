# ميزة رفع الصور - Image Upload Feature

## نظرة عامة
تم إضافة ميزة رفع الصور إلى صفحة الإدخال النصي، حيث يمكن للمراسلين رفع صورة اختيارية مع الخبر النصي.

## التغييرات التقنية

### 1. قاعدة البيانات (Database)

#### تحديث جدول `uploaded_files`
```sql
-- تم تحديث CHECK constraint لدعم الصور
ALTER TABLE uploaded_files 
DROP CONSTRAINT IF EXISTS uploaded_files_file_type_check;

ALTER TABLE uploaded_files 
ADD CONSTRAINT uploaded_files_file_type_check 
CHECK (file_type IN ('audio', 'video', 'image'));
```

الآن الجدول يدعم ثلاثة أنواع من الملفات:
- `audio` - ملفات صوتية
- `video` - ملفات فيديو
- `image` - صور

### 2. Backend API

#### Endpoint جديد: `POST /api/manual-input/upload-image`

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `file` (required): ملف الصورة
  - `uploaded_by` (required): معرف المستخدم
  - `media_unit_id` (required): معرف الوحدة الإعلامية
  - `title` (optional): عنوان الصورة

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "file_url": "https://s3.eu-north-1.amazonaws.com/bucket/manual-input-image/...",
    "file_size": 2048576,
    "original_filename": "photo.jpg",
    "uploaded_at": "2026-04-20T10:30:00.000Z"
  },
  "message": "تم رفع الصورة بنجاح"
}
```

#### التحقق من الملفات (Validation)
- **الأنواع المسموحة:** JPG, PNG, GIF, WebP
- **الحد الأقصى للحجم:** 10 MB
- **MIME Types:**
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`

### 3. AWS S3 Storage

#### المجلد الجديد
```
manual-input-image/
```

#### تسمية الملفات
```
image-{title}-{timestamp}-{random}.{ext}
```

مثال:
```
image-breaking-news-1713604800000-abc123.jpg
```

### 4. Frontend (React)

#### الميزات الجديدة في `ManualInputText.tsx`

1. **اختيار الصورة:**
   - واجهة سحب وإفلات (Drag & Drop UI)
   - معاينة الصورة قبل الرفع
   - عرض حجم الملف

2. **رفع الصورة:**
   - رفع تلقائي عند إرسال النموذج
   - مؤشر تقدم أثناء الرفع
   - رسائل خطأ واضحة

3. **التحقق من الصورة:**
   - التحقق من نوع الملف
   - التحقق من حجم الملف
   - رسائل خطأ بالعربية

## سير العمل (Workflow)

### 1. المستخدم يختار صورة
```
المستخدم → اختيار ملف → معاينة الصورة
```

### 2. إرسال النموذج
```
1. التحقق من البيانات
2. رفع الصورة إلى S3 (إذا كانت موجودة)
3. الحصول على رابط S3
4. إرسال بيانات الخبر مع رابط الصورة
5. حفظ في raw_data مع image_url
```

### 3. تخزين البيانات

#### في `uploaded_files`:
```sql
INSERT INTO uploaded_files (
  source_id,
  source_type_id,
  file_type,
  original_filename,
  file_size,
  mime_type,
  s3_bucket,
  s3_key,
  s3_url,
  uploaded_by,
  media_unit_id
) VALUES (
  14,                    -- Manual Input - Text
  6,                     -- user_input_text
  'image',
  'photo.jpg',
  2048576,
  'image/jpeg',
  'media-center-management-system',
  'manual-input-image/image-news-1713604800000-abc123.jpg',
  'https://s3.eu-north-1.amazonaws.com/...',
  50,                    -- user_id
  1                      -- media_unit_id
);
```

#### في `raw_data`:
```sql
INSERT INTO raw_data (
  source_id,
  category_id,
  title,
  content,
  image_url,              -- رابط الصورة من S3
  created_by,
  media_unit_id
) VALUES (...);
```

## الملفات المعدلة

### Backend
1. `src/config/s3.ts` - إضافة تكوين الصور
2. `src/services/manual-input/S3UploadService.ts` - دعم رفع الصور
3. `src/middleware/upload.ts` - middleware للصور
4. `src/controllers/manual-input/ManualInputController.ts` - controller للصور
5. `src/routes/manual-input/index.ts` - route للصور
6. `src/utils/manual-input/create-uploaded-files-table.ts` - تحديث schema
7. `src/utils/manual-input/add-image-support.ts` - migration جديد

### Frontend
1. `manual-input-frontend/src/pages/ManualInputText.tsx` - واجهة رفع الصور

### Database
1. `uploaded_files` table - تحديث CHECK constraint

## الاختبار (Testing)

### 1. اختبار رفع صورة
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-image \
  -F "file=@photo.jpg" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Breaking News"
```

### 2. التحقق من S3
```bash
# التحقق من وجود المجلد
aws s3 ls s3://media-center-management-system/manual-input-image/
```

### 3. التحقق من قاعدة البيانات
```sql
-- التحقق من الصور المرفوعة
SELECT * FROM uploaded_files WHERE file_type = 'image';

-- التحقق من الأخبار مع الصور
SELECT id, title, image_url FROM raw_data WHERE image_url IS NOT NULL;
```

## الأمان (Security)

1. **التحقق من نوع الملف:** فقط الصور المسموحة
2. **التحقق من الحجم:** حد أقصى 10 MB
3. **تسمية آمنة:** استخدام timestamp و random string
4. **S3 Permissions:** الملفات خاصة بشكل افتراضي

## الأداء (Performance)

- **رفع متوازي:** الصورة تُرفع بشكل منفصل قبل إرسال النموذج
- **معاينة محلية:** استخدام `URL.createObjectURL()` للمعاينة السريعة
- **تحسين الحجم:** يمكن إضافة ضغط الصور في المستقبل

## التطوير المستقبلي

1. **ضغط الصور:** تقليل حجم الصور تلقائياً
2. **تحرير الصور:** قص، تدوير، فلاتر
3. **صور متعددة:** رفع أكثر من صورة واحدة
4. **معرض الصور:** عرض الصور المرفوعة سابقاً
5. **CDN:** استخدام CloudFront لتسريع تحميل الصور

## الملاحظات

- الصورة اختيارية، ليست إلزامية
- يمكن إرسال خبر بدون صورة
- الصورة تُخزن في S3 وليس في قاعدة البيانات
- رابط الصورة يُحفظ في `raw_data.image_url`
- معلومات الملف تُحفظ في `uploaded_files`
