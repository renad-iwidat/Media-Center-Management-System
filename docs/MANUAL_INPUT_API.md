# Manual Input API Documentation

## 📚 نظرة عامة

API للإدخال اليدوي من المراسلين - يدعم النص، الصوت، والفيديو.

**Base URL**: `http://localhost:3000/api/manual-input`

---

## 🔐 Authentication

حالياً: يتم إرسال `user_id` في الـ body.  
مستقبلاً: سيتم استخدام JWT tokens.

---

## 📋 Endpoints

### 1. جلب التصنيفات النشطة

**GET** `/categories`

**الوصف**: جلب قائمة التصنيفات النشطة المتاحة.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "محلي",
      "slug": "local",
      "flow": "editorial",
      "is_active": true
    }
  ]
}
```

---

### 2. جلب مصادر الإدخال اليدوي

**GET** `/sources`

**الوصف**: جلب معلومات المصادر الثلاثة (نص، صوت، فيديو).

**Response**:
```json
{
  "success": true,
  "data": {
    "text": {
      "id": 14,
      "name": "Manual Input - Text",
      "source_type_id": 6,
      "is_active": true
    },
    "audio": {
      "id": 15,
      "name": "Manual Input - Audio",
      "source_type_id": 7,
      "is_active": true
    },
    "video": {
      "id": 16,
      "name": "Manual Input - Video",
      "source_type_id": 8,
      "is_active": true
    }
  }
}
```

---

### 3. جلب مصدر النص فقط

**GET** `/source/text`

**الوصف**: جلب معلومات مصدر الإدخال النصي فقط.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 14,
    "name": "Manual Input - Text",
    "source_type_id": 6,
    "is_active": true
  }
}
```

---

### 4. إرسال خبر نصي

**POST** `/submit`

**الوصف**: إضافة خبر نصي جديد.

**Content-Type**: `application/json`

**Body**:
```json
{
  "source_id": 14,
  "source_type_id": 6,
  "category_id": 1,
  "url": null,
  "title": "عنوان الخبر",
  "content": "محتوى الخبر الكامل...",
  "image_url": "https://example.com/image.jpg",
  "tags": ["سياسة", "محلي"],
  "fetch_status": "fetched",
  "created_by": 42
}
```

**Validation**:
- `title`: مطلوب، 5 أحرف على الأقل
- `content`: مطلوب، 20 حرف على الأقل
- `category_id`: مطلوب
- `created_by`: مطلوب
- `fetch_status`: يجب أن يكون "fetched"

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 500,
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "title": "عنوان الخبر",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-19T12:00:00.000Z"
  },
  "message": "تم إضافة الخبر بنجاح"
}
```

---

### 5. رفع ملف صوتي

**POST** `/upload-audio`

**الوصف**: رفع ملف صوتي على S3 وحفظ معلوماته في قاعدة البيانات.

**Content-Type**: `multipart/form-data`

**Body**:
- `file` (File, required): الملف الصوتي
- `uploaded_by` (number, required): معرف المستخدم

**القيود**:
- الحد الأقصى للحجم: 50 MB
- الأنواع المسموحة: MP3, M4A, WAV, WebM, OGG
- MIME types: `audio/mpeg`, `audio/mp4`, `audio/wav`, `audio/webm`, `audio/ogg`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "file_url": "https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-audio/1713528000000-abc123-report.mp3",
    "file_size": 2048576,
    "original_filename": "report.mp3",
    "processing_status": "pending",
    "uploaded_at": "2026-04-19T12:00:00.000Z"
  },
  "message": "تم رفع الملف الصوتي بنجاح"
}
```

**Errors**:
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم. الأنواع المسموحة: MP3, M4A, WAV, WebM, OGG"
}
```

```json
{
  "success": false,
  "message": "حجم الملف كبير جداً. الحد الأقصى: 50 MB"
}
```

---

### 6. رفع ملف فيديو

**POST** `/upload-video`

**الوصف**: رفع ملف فيديو على S3 وحفظ معلوماته في قاعدة البيانات.

**Content-Type**: `multipart/form-data`

**Body**:
- `file` (File, required): ملف الفيديو
- `uploaded_by` (number, required): معرف المستخدم

**القيود**:
- الحد الأقصى للحجم: 500 MB
- الأنواع المسموحة: MP4, WebM, MOV, AVI
- MIME types: `video/mp4`, `video/webm`, `video/quicktime`, `video/x-msvideo`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 2,
    "file_url": "https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/1713528000000-xyz789-field-report.mp4",
    "file_size": 52428800,
    "original_filename": "field-report.mp4",
    "processing_status": "pending",
    "uploaded_at": "2026-04-19T12:00:00.000Z"
  },
  "message": "تم رفع ملف الفيديو بنجاح"
}
```

**Errors**:
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم. الأنواع المسموحة: MP4, WebM, MOV, AVI"
}
```

```json
{
  "success": false,
  "message": "حجم الملف كبير جداً. الحد الأقصى: 500 MB"
}
```

---

### 7. جلب الملفات المعلقة

**GET** `/pending-files`

**الوصف**: جلب قائمة الملفات التي في انتظار المعالجة (transcription).

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "source_id": 15,
      "source_type_id": 7,
      "file_type": "audio",
      "original_filename": "report.mp3",
      "file_size": 2048576,
      "mime_type": "audio/mpeg",
      "s3_bucket": "media-center-management-system",
      "s3_key": "manual-input-audio/1713528000000-abc123-report.mp3",
      "s3_url": "https://...",
      "processing_status": "pending",
      "uploaded_by": 42,
      "uploaded_at": "2026-04-19T12:00:00.000Z",
      "processed_at": null
    }
  ],
  "count": 1
}
```

---

## 🔄 سير العمل (Workflow)

### للنص:
1. المراسل يدخل النص مع العنوان والتصنيف
2. يرسل POST إلى `/submit`
3. يتم حفظ الخبر في `raw_data`
4. يمر عبر FlowRouter للمراجعة/النشر

### للصوت/فيديو:
1. المراسل يرفع الملف فقط
2. يرسل POST إلى `/upload-audio` أو `/upload-video`
3. الملف يُرفع على S3
4. تُحفظ المعلومات في `uploaded_files` (status: pending)
5. **لاحقاً**: نظام المعالجة يحول الملف لنص
6. بعد التحويل: يُنشأ record في `raw_data` مع ربطه بـ `uploaded_files`
7. يمر عبر FlowRouter للمراجعة/النشر

---

## 📊 حالات المعالجة (Processing Status)

| Status | الوصف |
|--------|-------|
| `pending` | في انتظار المعالجة |
| `processing` | جاري التحويل لنص |
| `completed` | تم التحويل بنجاح |
| `failed` | فشل التحويل |

---

## 🧪 أمثلة باستخدام cURL

### رفع ملف صوتي:
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-audio \
  -F "file=@/path/to/audio.mp3" \
  -F "uploaded_by=42"
```

### رفع ملف فيديو:
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-video \
  -F "file=@/path/to/video.mp4" \
  -F "uploaded_by=42"
```

### إرسال خبر نصي:
```bash
curl -X POST http://localhost:3000/api/manual-input/submit \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "url": null,
    "title": "عنوان الخبر",
    "content": "محتوى الخبر الكامل...",
    "tags": ["سياسة"],
    "fetch_status": "fetched",
    "created_by": 42
  }'
```

---

## ⚠️ ملاحظات مهمة

1. **AWS S3**: تأكد من إعداد credentials في `.env`
2. **User ID**: حالياً يُرسل في الـ body، مستقبلاً سيكون من JWT
3. **File Size**: الحدود القصوى قابلة للتعديل في `src/config/s3.ts`
4. **CORS**: تأكد من إعداد CORS للسماح برفع الملفات من الفرونت إند
5. **Transcription**: نظام التحويل لنص سيُضاف لاحقاً

---

## 🔧 التطوير المستقبلي

- [ ] إضافة JWT authentication
- [ ] نظام التحويل لنص (Speech-to-Text)
- [ ] Progress tracking للرفع
- [ ] Thumbnail generation للفيديو
- [ ] Audio waveform visualization
- [ ] Batch upload support
