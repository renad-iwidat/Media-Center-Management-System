# ✅ قائمة التحقق من نشر ميزة رفع الصور
# Image Upload Feature Deployment Checklist

## 📋 قبل النشر (Pre-Deployment)

### ✅ 1. التحقق من الكود
- [x] جميع الملفات بدون أخطاء TypeScript
- [x] Backend Controller يحتوي على `uploadImage` method
- [x] Frontend يحتوي على واجهة رفع الصور
- [x] Routes تحتوي على `/api/manual-input/upload-image`
- [x] S3 Configuration يحتوي على إعدادات الصور

### ✅ 2. قاعدة البيانات المحلية
- [x] تشغيل migration: `npx ts-node src/utils/manual-input/add-image-support.ts`
- [x] التحقق من CHECK constraint الجديد
- [x] اختبار إدخال صورة في `uploaded_files`

### ✅ 3. الاختبار المحلي
- [ ] تشغيل Backend: `npm run dev`
- [ ] تشغيل Frontend: `cd manual-input-frontend && npm run dev`
- [ ] اختبار رفع صورة من الواجهة
- [ ] التحقق من رفع الصورة على S3
- [ ] التحقق من حفظ البيانات في قاعدة البيانات
- [ ] اختبار رسائل الخطأ (حجم كبير، نوع خاطئ)

---

## 🚀 النشر (Deployment)

### 1. تحديث قاعدة البيانات على Production

```bash
# الاتصال بقاعدة البيانات على Render
# Option 1: من خلال Render Dashboard
# - افتح Database → Connect
# - استخدم External Connection String

# Option 2: تشغيل migration محلياً مع production database
# تحديث .env مؤقتاً:
DATABASE_URL="postgresql://user:pass@host:port/database?sslmode=require"

# تشغيل migration
npx ts-node src/utils/manual-input/add-image-support.ts

# إعادة .env للإعدادات المحلية
```

**✅ تم:** [ ]

---

### 2. رفع التغييرات على Git

```bash
# التحقق من الملفات المعدلة
git status

# إضافة جميع التغييرات
git add .

# Commit
git commit -m "feat: Add image upload feature to manual text input

Changes:
- Database: Update uploaded_files table to support image file type
- Backend: Add POST /api/manual-input/upload-image endpoint
- Backend: Add S3 configuration for images (manual-input-image/ folder)
- Backend: Add image validation (type, size)
- Frontend: Add image upload UI with preview
- Frontend: Add image validation and error messages
- Docs: Add comprehensive documentation
- Tests: Add image upload test script

Files modified:
Backend (7 files):
- src/config/s3.ts
- src/services/manual-input/S3UploadService.ts
- src/middleware/upload.ts
- src/controllers/manual-input/ManualInputController.ts
- src/routes/manual-input/index.ts
- src/utils/manual-input/create-uploaded-files-table.ts
- src/utils/manual-input/add-image-support.ts (new)

Frontend (1 file):
- manual-input-frontend/src/pages/ManualInputText.tsx

Documentation (3 files):
- docs/IMAGE_UPLOAD_FEATURE.md (new)
- docs/IMAGE_UPLOAD_IMPLEMENTATION_SUMMARY.md (new)
- src/utils/manual-input/test-image-upload.ts (new)
- IMAGE_UPLOAD_DEPLOYMENT_CHECKLIST.md (new)"

# Push
git push origin main
```

**✅ تم:** [ ]

---

### 3. نشر Backend على Render

#### الخطوات:
1. افتح Render Dashboard
2. اذهب إلى Backend Service: `manual-reporter-input-backend`
3. انتظر Auto-Deploy (أو اضغط "Manual Deploy")
4. راقب Logs للتأكد من نجاح البناء

#### التحقق من Logs:
```
✅ Server is running on port 3000
✅ تم الاتصال بقاعدة البيانات بنجاح
```

#### اختبار Backend:
```bash
# Health Check
curl https://manual-reporter-input-backend.onrender.com/api/health

# Test Image Upload Endpoint
curl -X POST https://manual-reporter-input-backend.onrender.com/api/manual-input/upload-image \
  -F "file=@test-image.jpg" \
  -F "uploaded_by=50" \
  -F "media_unit_id=1" \
  -F "title=Test Production"
```

**✅ تم:** [ ]

---

### 4. نشر Frontend على Render

#### الخطوات:
1. افتح Render Dashboard
2. اذهب إلى Frontend Service: `manual-reporter-input-frontend`
3. انتظر Auto-Deploy (أو اضغط "Manual Deploy")
4. راقب Logs للتأكد من نجاح البناء

#### التحقق من Logs:
```
✅ vite v5.x.x building for production...
✅ ✓ built in Xs
✅ nginx started
```

**✅ تم:** [ ]

---

## 🧪 الاختبار على Production

### 1. اختبار الواجهة
- [ ] افتح: https://manual-reporter-input-frontend.onrender.com/text
- [ ] اختر مراسل ووحدة إعلامية
- [ ] أدخل عنوان ومحتوى
- [ ] اضغط على منطقة رفع الصورة
- [ ] اختر صورة (JPG, PNG, GIF, WebP)
- [ ] تحقق من معاينة الصورة
- [ ] تحقق من عرض حجم الملف
- [ ] اضغط "إرسال الخبر"
- [ ] تحقق من رسالة النجاح

### 2. اختبار التحقق من الأخطاء
- [ ] حاول رفع ملف كبير جداً (> 10 MB)
- [ ] حاول رفع نوع ملف غير مدعوم (PDF, TXT)
- [ ] تحقق من رسائل الخطأ بالعربية

### 3. التحقق من S3
```bash
# عرض الصور المرفوعة
aws s3 ls s3://media-center-management-system/manual-input-image/

# يجب أن ترى:
# image-[title]-[timestamp]-[random].[ext]
```

**✅ تم:** [ ]

### 4. التحقق من قاعدة البيانات
```sql
-- الاتصال بقاعدة البيانات
-- عرض الصور المرفوعة
SELECT 
  id,
  file_type,
  original_filename,
  file_size,
  s3_url,
  uploaded_by,
  media_unit_id,
  uploaded_at
FROM uploaded_files 
WHERE file_type = 'image'
ORDER BY uploaded_at DESC
LIMIT 5;

-- عرض الأخبار مع الصور
SELECT 
  r.id,
  r.title,
  r.image_url,
  u.name as correspondent_name,
  m.name as media_unit_name
FROM raw_data r
LEFT JOIN users u ON r.created_by = u.id
LEFT JOIN media_units m ON r.media_unit_id = m.id
WHERE r.image_url IS NOT NULL
  AND r.image_url LIKE '%manual-input-image%'
ORDER BY r.created_at DESC
LIMIT 5;
```

**✅ تم:** [ ]

---

## 📊 مراقبة الأداء

### بعد النشر، راقب:
- [ ] استخدام S3 Storage
- [ ] حجم الصور المرفوعة
- [ ] عدد الصور المرفوعة يومياً
- [ ] أخطاء رفع الصور (Logs)
- [ ] سرعة رفع الصور

---

## 🐛 استكشاف الأخطاء

### إذا فشل رفع الصورة:

#### 1. تحقق من AWS Credentials
```bash
# في Render Dashboard → Environment Variables
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=eu-north-1
AWS_S3_BUCKET=media-center-management-system
```

#### 2. تحقق من S3 Permissions
- Bucket Policy يسمح بـ PutObject
- IAM User له صلاحيات الكتابة

#### 3. تحقق من Database
```sql
-- التحقق من CHECK constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'uploaded_files_file_type_check';

-- يجب أن يحتوي على: 'image'
```

#### 4. تحقق من Logs
```bash
# Backend Logs على Render
# ابحث عن:
❌ خطأ في رفع الصورة
❌ AWS S3 Error
❌ Database Error
```

---

## ✅ النشر مكتمل!

عند إكمال جميع الخطوات أعلاه:
- ✅ قاعدة البيانات محدثة
- ✅ Backend منشور
- ✅ Frontend منشور
- ✅ الميزة تعمل على Production
- ✅ الاختبارات نجحت

---

## 📝 ملاحظات إضافية

### الأمان:
- الصور تُخزن في S3 بشكل خاص (private)
- التحقق من نوع الملف على Backend
- التحقق من حجم الملف على Backend و Frontend
- تسمية آمنة للملفات (timestamp + random)

### الأداء:
- الصور تُرفع بشكل منفصل قبل إرسال النموذج
- معاينة محلية باستخدام `URL.createObjectURL()`
- يمكن إضافة ضغط الصور في المستقبل

### الصيانة:
- مراقبة استخدام S3 Storage
- حذف الصور القديمة غير المستخدمة (optional)
- إضافة CDN للصور (optional)

---

**تاريخ النشر:** _______________
**نشر بواسطة:** _______________
**الحالة:** [ ] مكتمل
