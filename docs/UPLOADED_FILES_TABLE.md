# جدول uploaded_files

## 📋 الوصف
جدول لتخزين الملفات الصوتية والفيديو المرفوعة من المراسلين على S3.

## 🏗️ البنية

| العمود | النوع | الوصف |
|--------|------|-------|
| `id` | BIGSERIAL | المعرف الفريد |
| `source_id` | BIGINT | معرف المصدر (من جدول sources) |
| `source_type_id` | BIGINT | معرف نوع المصدر (6=text, 7=audio, 8=video) |
| `file_type` | VARCHAR(20) | نوع الملف: 'audio' أو 'video' |
| `original_filename` | VARCHAR(500) | اسم الملف الأصلي |
| `file_size` | BIGINT | حجم الملف بالـ bytes |
| `mime_type` | VARCHAR(100) | نوع MIME (مثل: audio/mp3, video/mp4) |
| `s3_bucket` | VARCHAR(255) | اسم الـ bucket في S3 |
| `s3_key` | TEXT | المسار الكامل في S3 |
| `s3_url` | TEXT | الرابط الكامل للوصول للملف |
| `processing_status` | VARCHAR(50) | حالة المعالجة: pending, processing, completed, failed |
| `uploaded_by` | BIGINT | معرف المستخدم الذي رفع الملف |
| `uploaded_at` | TIMESTAMP | تاريخ الرفع |
| `processed_at` | TIMESTAMP | تاريخ اكتمال المعالجة |

## 🔗 الربط مع raw_data

تم إضافة عمود `uploaded_file_id` في جدول `raw_data` للربط:

```sql
ALTER TABLE raw_data 
ADD COLUMN uploaded_file_id BIGINT REFERENCES uploaded_files(id);
```

## 🔄 سير العمل (Workflow)

### 1. رفع الملف
```
المراسل يرفع ملف صوتي/فيديو
    ↓
يتخزن في S3
    ↓
يتسجل في uploaded_files (status: pending)
```

### 2. المعالجة
```
النظام يحول الملف لنص (transcription)
    ↓
يحدث status إلى: processing
    ↓
بعد الانتهاء: completed
```

### 3. إنشاء الخبر
```
بعد التحويل لنص
    ↓
يتعمل record في raw_data
    ↓
يتربط مع uploaded_files عبر uploaded_file_id
```

## 📊 Indexes

- `idx_uploaded_files_source` - على source_id
- `idx_uploaded_files_source_type` - على source_type_id
- `idx_uploaded_files_uploaded_by` - على uploaded_by
- `idx_uploaded_files_status` - على processing_status
- `idx_uploaded_files_file_type` - على file_type
- `idx_raw_data_uploaded_file` - على raw_data.uploaded_file_id

## 💡 أمثلة

### إدراج ملف صوتي جديد
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
  uploaded_by
) VALUES (
  15, -- Manual Input - Audio
  7,  -- user_input_audio
  'audio',
  'report-123.mp3',
  2048576, -- 2MB
  'audio/mp3',
  'media-center-files',
  'manual-input/audio/2026/04/report-123.mp3',
  'https://media-center-files.s3.amazonaws.com/manual-input/audio/2026/04/report-123.mp3',
  42 -- user_id
);
```

### تحديث حالة المعالجة
```sql
UPDATE uploaded_files 
SET 
  processing_status = 'completed',
  processed_at = NOW()
WHERE id = 1;
```

### إنشاء raw_data مع ربط الملف
```sql
INSERT INTO raw_data (
  source_id,
  source_type_id,
  category_id,
  title,
  content,
  uploaded_file_id,
  created_by,
  fetch_status
) VALUES (
  15, -- Manual Input - Audio
  7,  -- user_input_audio
  1,  -- محلي
  'تقرير من الميدان',
  'النص المحول من الملف الصوتي...',
  1,  -- uploaded_files.id
  42,
  'fetched'
);
```

### استعلام للحصول على الملفات المعلقة
```sql
SELECT * FROM uploaded_files 
WHERE processing_status = 'pending'
ORDER BY uploaded_at ASC;
```

### استعلام للحصول على خبر مع ملفه الأصلي
```sql
SELECT 
  rd.*,
  uf.s3_url,
  uf.file_type,
  uf.original_filename
FROM raw_data rd
LEFT JOIN uploaded_files uf ON rd.uploaded_file_id = uf.id
WHERE rd.id = 500;
```

## ✅ تم التنفيذ

- [x] إنشاء جدول uploaded_files
- [x] إضافة Indexes للأداء
- [x] إضافة عمود uploaded_file_id في raw_data
- [x] إنشاء Foreign Keys والعلاقات

## 📝 الخطوات التالية

1. إعداد AWS S3 Integration
2. إنشاء API endpoints للرفع
3. بناء واجهة الرفع في الفرونت إند
4. إضافة نظام التحويل لنص (Transcription)
