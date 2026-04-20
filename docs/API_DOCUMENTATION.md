# 📚 API Documentation - توثيق شامل لجميع الـ APIs

## Base URL
```
Local: http://localhost:3000/api
Production: https://manual-reporter-input-backend.onrender.com/api
```

---

## 📋 Table of Contents
1. [Health Check APIs](#health-check-apis)
2. [Manual Input APIs](#manual-input-apis)
   - [GET APIs](#get-apis)
   - [POST APIs](#post-apis)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Authentication](#authentication)

---

## 🏥 Health Check APIs

### 1. Server Health Check
**Endpoint:** `GET /health`

**Description:** التحقق من حالة السيرفر

**Request:**
```bash
curl http://localhost:3000/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

---

### 2. API Health Check
**Endpoint:** `GET /api/health`

**Description:** التحقق من حالة الـ API

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "message": "API is healthy"
}
```

---

## 📝 Manual Input APIs

### GET APIs

#### 1. Get Active Categories
**Endpoint:** `GET /api/manual-input/categories`

**Description:** جلب جميع التصنيفات النشطة

**Request:**
```bash
curl http://localhost:3000/api/manual-input/categories
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "سياسة",
      "slug": "politics",
      "flow": "automated",
      "is_active": true
    },
    {
      "id": 2,
      "name": "اقتصاد",
      "slug": "economy",
      "flow": "editorial",
      "is_active": true
    }
  ]
}
```

**Response Fields:**
- `id` (number): معرف التصنيف
- `name` (string): اسم التصنيف
- `slug` (string): الاسم المختصر
- `flow` (string): نوع الفلو (`automated` أو `editorial`)
- `is_active` (boolean): حالة التصنيف

**Error Response:** `500 Internal Server Error`
```json
{
  "success": false,
  "message": "فشل في جلب التصنيفات",
  "error": "Error message"
}
```

---

#### 2. Get All Manual Input Sources
**Endpoint:** `GET /api/manual-input/sources`

**Description:** جلب جميع مصادر الإدخال اليدوي (نص، صوت، فيديو)

**Request:**
```bash
curl http://localhost:3000/api/manual-input/sources
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "text": {
      "id": 14,
      "name": "Manual Input - Text",
      "source_type_id": 6,
      "is_active": true,
      "source_type_name": "user_input_text"
    },
    "audio": {
      "id": 15,
      "name": "Manual Input - Audio",
      "source_type_id": 7,
      "is_active": true,
      "source_type_name": "user_input_audio"
    },
    "video": {
      "id": 16,
      "name": "Manual Input - Video",
      "source_type_id": 8,
      "is_active": true,
      "source_type_name": "user_input_video"
    }
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "مصادر الإدخال اليدوي غير موجودة"
}
```

---

#### 3. Get Text Input Source
**Endpoint:** `GET /api/manual-input/source/text`

**Description:** جلب معلومات مصدر الإدخال النصي فقط

**Request:**
```bash
curl http://localhost:3000/api/manual-input/source/text
```

**Response:** `200 OK`
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

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "message": "مصدر الإدخال النصي غير موجود"
}
```

---

#### 4. Get Media Units
**Endpoint:** `GET /api/manual-input/media-units`

**Description:** جلب قائمة الوحدات الإعلامية النشطة

**Request:**
```bash
curl http://localhost:3000/api/manual-input/media-units
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "تلفزيون النجاح",
      "slug": "najah-tv",
      "is_active": true
    },
    {
      "id": 2,
      "name": "راديو النجاح",
      "slug": "najah-radio",
      "is_active": true
    }
  ]
}
```

**Response Fields:**
- `id` (number): معرف الوحدة الإعلامية
- `name` (string): اسم الوحدة
- `slug` (string): الاسم المختصر
- `is_active` (boolean): حالة الوحدة

---

#### 5. Get All Users
**Endpoint:** `GET /api/manual-input/users`

**Description:** جلب قائمة جميع المستخدمين (المراسلين)

**Request:**
```bash
curl http://localhost:3000/api/manual-input/users
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 50,
      "name": "أحمد ترياقي",
      "email": "a.turyaqi@najah.edu"
    },
    {
      "id": 71,
      "name": "رغد محمود",
      "email": "raghadzmahmoud@gmail.com"
    }
  ]
}
```

**Response Fields:**
- `id` (number): معرف المستخدم
- `name` (string): اسم المستخدم
- `email` (string): البريد الإلكتروني

---

#### 6. Get Pending Files
**Endpoint:** `GET /api/manual-input/pending-files`

**Description:** جلب الملفات المعلقة التي في انتظار المعالجة

**Request:**
```bash
curl http://localhost:3000/api/manual-input/pending-files
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 11,
      "source_id": 14,
      "source_type_id": 6,
      "file_type": "image",
      "original_filename": "photo.jpg",
      "file_size": 158792,
      "mime_type": "image/jpeg",
      "s3_bucket": "media-center-management-system",
      "s3_key": "manual-input-image/image-test-1776675392380-4c5vn8.jpeg",
      "s3_url": "https://s3.eu-north-1.amazonaws.com/...",
      "processing_status": "pending",
      "uploaded_by": 71,
      "uploaded_at": "2026-04-20T08:56:36.437Z",
      "processed_at": null,
      "media_unit_id": 1
    }
  ],
  "count": 1
}
```

**Response Fields:**
- `id` (number): معرف الملف
- `file_type` (string): نوع الملف (`audio`, `video`, `image`)
- `original_filename` (string): اسم الملف الأصلي
- `file_size` (number): حجم الملف بالبايت
- `s3_url` (string): رابط الملف على S3
- `processing_status` (string): حالة المعالجة (`pending`, `processing`, `completed`, `failed`)
- `uploaded_by` (number): معرف المستخدم الذي رفع الملف
- `media_unit_id` (number): معرف الوحدة الإعلامية

---

### POST APIs

#### 1. Submit Text News
**Endpoint:** `POST /api/manual-input/submit`

**Description:** إرسال خبر نصي جديد

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "source_id": 14,
  "source_type_id": 6,
  "category_id": 1,
  "url": null,
  "title": "عنوان الخبر (20 حرف كحد أدنى)",
  "content": "محتوى الخبر (100 حرف كحد أدنى)...",
  "image_url": "https://s3.amazonaws.com/...",
  "tags": [],
  "fetch_status": "fetched",
  "created_by": 50,
  "media_unit_id": 1,
  "uploaded_file_id": 11
}
```

**Request Fields:**
- `source_id` (number, required): معرف المصدر (14 للنص)
- `source_type_id` (number, required): معرف نوع المصدر (6 للنص)
- `category_id` (number, required): معرف التصنيف
- `url` (null, required): دائماً null للإدخال اليدوي
- `title` (string, required): عنوان الخبر (20 حرف كحد أدنى)
- `content` (string, required): محتوى الخبر (100 حرف كحد أدنى)
- `image_url` (string, optional): رابط الصورة
- `tags` (array, optional): الوسوم
- `fetch_status` (string, required): دائماً "fetched"
- `created_by` (number, required): معرف المستخدم
- `media_unit_id` (number, required): معرف الوحدة الإعلامية
- `uploaded_file_id` (number, optional): معرف الملف المرفوع (للصور)

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/manual-input/submit \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "url": null,
    "title": "عنوان الخبر الجديد",
    "content": "محتوى الخبر...",
    "tags": [],
    "fetch_status": "fetched",
    "created_by": 50,
    "media_unit_id": 1
  }'
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 467,
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "title": "عنوان الخبر الجديد",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-20T09:00:00.000Z"
  },
  "message": "تم إضافة الخبر بنجاح"
}
```

**Validation Errors:** `400 Bad Request`
```json
{
  "success": false,
  "message": "بيانات غير صالحة",
  "errors": [
    "العنوان مطلوب ولا يقل عن 20 حرف",
    "المحتوى مطلوب ولا يقل عن 100 حرف"
  ]
}
```

---

#### 2. Upload Audio File
**Endpoint:** `POST /api/manual-input/upload-audio`

**Description:** رفع ملف صوتي

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (file, required): الملف الصوتي
- `uploaded_by` (number, required): معرف المستخدم
- `media_unit_id` (number, required): معرف الوحدة الإعلامية
- `title` (string, optional): عنوان الملف

**Allowed File Types:**
- MP3 (audio/mpeg)
- M4A (audio/mp4)
- WAV (audio/wav)
- WebM (audio/webm)
- OGG (audio/ogg)

**Max File Size:** 50 MB

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-audio \
  -F "file=@audio.mp3" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Breaking News Audio"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 12,
    "file_url": "https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-audio/audio-breaking-news-1776675500000-abc123.mp3",
    "file_size": 2048576,
    "original_filename": "audio.mp3",
    "processing_status": "pending",
    "uploaded_at": "2026-04-20T09:05:00.000Z"
  },
  "message": "تم رفع الملف الصوتي بنجاح"
}
```

**Error Responses:**

`400 Bad Request` - Missing file:
```json
{
  "success": false,
  "message": "الملف الصوتي مطلوب"
}
```

`400 Bad Request` - Invalid file type:
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم. الأنواع المسموحة: MP3, M4A, WAV, WebM, OGG"
}
```

`400 Bad Request` - File too large:
```json
{
  "success": false,
  "message": "حجم الملف كبير جداً. الحد الأقصى: 50 MB"
}
```

---

#### 3. Upload Video File
**Endpoint:** `POST /api/manual-input/upload-video`

**Description:** رفع ملف فيديو

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (file, required): ملف الفيديو
- `uploaded_by` (number, required): معرف المستخدم
- `media_unit_id` (number, required): معرف الوحدة الإعلامية
- `title` (string, optional): عنوان الملف

**Allowed File Types:**
- MP4 (video/mp4)
- WebM (video/webm)
- MOV (video/quicktime)
- AVI (video/x-msvideo)

**Max File Size:** 500 MB

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-video \
  -F "file=@video.mp4" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Breaking News Video"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 13,
    "file_url": "https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-video/video-breaking-news-1776675600000-xyz789.mp4",
    "file_size": 10485760,
    "original_filename": "video.mp4",
    "processing_status": "pending",
    "uploaded_at": "2026-04-20T09:10:00.000Z"
  },
  "message": "تم رفع ملف الفيديو بنجاح"
}
```

**Error Responses:**

`400 Bad Request` - Missing file:
```json
{
  "success": false,
  "message": "ملف الفيديو مطلوب"
}
```

`400 Bad Request` - Invalid file type:
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم. الأنواع المسموحة: MP4, WebM, MOV, AVI"
}
```

`400 Bad Request` - File too large:
```json
{
  "success": false,
  "message": "حجم الملف كبير جداً. الحد الأقصى: 500 MB"
}
```

---

#### 4. Upload Image File
**Endpoint:** `POST /api/manual-input/upload-image`

**Description:** رفع صورة

**Content-Type:** `multipart/form-data`

**Request Body:**
- `file` (file, required): ملف الصورة
- `uploaded_by` (number, required): معرف المستخدم
- `media_unit_id` (number, required): معرف الوحدة الإعلامية
- `title` (string, optional): عنوان الصورة

**Allowed File Types:**
- JPG/JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

**Max File Size:** 10 MB

**Request Example:**
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-image \
  -F "file=@photo.jpg" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Breaking News Photo"
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 11,
    "file_url": "https://media-center-management-system.s3.eu-north-1.amazonaws.com/manual-input-image/image-breaking-news-1776675392380-4c5vn8.jpeg",
    "file_size": 158792,
    "original_filename": "photo.jpg",
    "uploaded_at": "2026-04-20T08:56:36.437Z"
  },
  "message": "تم رفع الصورة بنجاح"
}
```

**Error Responses:**

`400 Bad Request` - Missing file:
```json
{
  "success": false,
  "message": "ملف الصورة مطلوب"
}
```

`400 Bad Request` - Invalid file type:
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, GIF, WebP"
}
```

`400 Bad Request` - File too large:
```json
{
  "success": false,
  "message": "حجم الملف كبير جداً. الحد الأقصى: 10 MB"
}
```

---

## 📊 Response Format

### Success Response
جميع الاستجابات الناجحة تتبع هذا الشكل:
```json
{
  "success": true,
  "data": { ... },
  "message": "رسالة نجاح (اختياري)"
}
```

### Error Response
جميع الاستجابات الخاطئة تتبع هذا الشكل:
```json
{
  "success": false,
  "message": "رسالة الخطأ",
  "error": "تفاصيل الخطأ (اختياري)",
  "errors": ["قائمة الأخطاء (للتحقق من البيانات)"]
}
```

---

## ⚠️ Error Handling

### HTTP Status Codes

| Code | Description | متى يحدث |
|------|-------------|----------|
| 200 | OK | طلب ناجح (GET) |
| 201 | Created | تم إنشاء مورد جديد (POST) |
| 400 | Bad Request | بيانات غير صالحة أو ناقصة |
| 404 | Not Found | المورد غير موجود |
| 500 | Internal Server Error | خطأ في السيرفر |

### Common Error Messages

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "بيانات غير صالحة",
  "errors": [
    "العنوان مطلوب ولا يقل عن 20 حرف",
    "المحتوى مطلوب ولا يقل عن 100 حرف",
    "التصنيف مطلوب",
    "معرف المستخدم مطلوب"
  ]
}
```

#### Not Found Errors (404)
```json
{
  "success": false,
  "message": "مصدر الإدخال النصي غير موجود"
}
```

#### Server Errors (500)
```json
{
  "success": false,
  "message": "فشل في جلب البيانات",
  "error": "Database connection error"
}
```

---

## 🔐 Authentication

**Current Status:** لا يوجد authentication حالياً

**Future Implementation:** سيتم إضافة JWT authentication في المستقبل

---

## 📝 Notes

### File Upload Notes
1. **S3 Storage:** جميع الملفات تُخزن على AWS S3
2. **File Naming:** الملفات تُسمى بالشكل: `{type}-{title}-{timestamp}-{random}.{ext}`
3. **Database Records:** معلومات الملفات تُحفظ في جدول `uploaded_files`
4. **Processing Status:** الملفات تبدأ بحالة `pending` وتتغير حسب المعالجة

### Validation Rules
1. **Title:** 20 حرف كحد أدنى
2. **Content:** 100 حرف كحد أدنى
3. **Audio Files:** حد أقصى 50 MB
4. **Video Files:** حد أقصى 500 MB
5. **Image Files:** حد أقصى 10 MB

### Database Tables
- `raw_data`: تخزين الأخبار النصية
- `uploaded_files`: تخزين معلومات الملفات المرفوعة
- `categories`: التصنيفات
- `sources`: المصادر
- `source_types`: أنواع المصادر
- `users`: المستخدمين (المراسلين)
- `media_units`: الوحدات الإعلامية

---

## 🧪 Testing

### Using cURL

**Test Health:**
```bash
curl http://localhost:3000/api/health
```

**Test Get Categories:**
```bash
curl http://localhost:3000/api/manual-input/categories
```

**Test Submit News:**
```bash
curl -X POST http://localhost:3000/api/manual-input/submit \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "url": null,
    "title": "عنوان الخبر للاختبار",
    "content": "محتوى الخبر للاختبار يجب أن يكون 100 حرف على الأقل لذلك نكتب نص طويل هنا للتأكد من أن التحقق يعمل بشكل صحيح",
    "tags": [],
    "fetch_status": "fetched",
    "created_by": 50,
    "media_unit_id": 1
  }'
```

**Test Upload Image:**
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-image \
  -F "file=@test.jpg" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Test Image"
```

### Using Postman

1. Import collection من الملف: `postman_collection.json` (سيتم إنشاؤه)
2. Set environment variables:
   - `base_url`: `http://localhost:3000`
   - `api_base_url`: `http://localhost:3000/api`
3. Run tests

---

## 📞 Support

للمساعدة أو الإبلاغ عن مشاكل:
- Email: support@najah.edu
- GitHub Issues: [Repository URL]

---

**Last Updated:** April 20, 2026
**Version:** 1.0.0
