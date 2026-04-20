# دليل التجربة - Manual Input Feature

## 🚀 البدء السريع

### 1. تشغيل الباك إند
```bash
npm run dev
```
الباك إند سيعمل على: `http://localhost:3000`

### 2. تشغيل الفرونت إند
```bash
cd manual-input-frontend
npm run dev
```
الفرونت إند سيعمل على: `http://localhost:3001` (أو 3002، 3003 حسب التوفر)

---

## 🧪 اختبار الميزات

### ✅ إدخال النص
1. افتح: `http://localhost:3003/text`
2. املأ النموذج:
   - العنوان (5 أحرف على الأقل)
   - التصنيف
   - المحتوى (20 حرف على الأقل)
   - الوسوم (اختياري)
   - رابط الصورة (اختياري)
3. اضغط "إرسال الخبر"
4. ✅ يجب أن تظهر رسالة نجاح

### 🎤 إدخال الصوت
1. افتح: `http://localhost:3003/audio`
2. **طريقة 1 - رفع ملف**:
   - اضغط على منطقة الرفع
   - اختر ملف صوتي (MP3, WAV, إلخ)
   - استمع للملف في المشغل
   - اضغط "رفع الملف الصوتي"
3. **طريقة 2 - تسجيل مباشر**:
   - اضغط "ابدأ التسجيل"
   - اسمح بالوصول للميكروفون
   - تحدث...
   - اضغط "إيقاف التسجيل"
   - استمع للتسجيل
   - اضغط "رفع الملف الصوتي"
4. ✅ يجب أن يُرفع الملف على S3

### 🎥 إدخال الفيديو
1. افتح: `http://localhost:3003/video`
2. **طريقة 1 - رفع ملف**:
   - اضغط على منطقة الرفع
   - اختر ملف فيديو (MP4, WebM, إلخ)
   - شاهد المعاينة
   - اضغط "رفع ملف الفيديو"
3. **طريقة 2 - تسجيل مباشر**:
   - اضغط "ابدأ تسجيل الفيديو"
   - اسمح بالوصول للكاميرا والميكروفون
   - سجل الفيديو...
   - اضغط "إيقاف التسجيل"
   - شاهد المعاينة
   - اضغط "رفع ملف الفيديو"
4. ✅ يجب أن يُرفع الملف على S3

---

## 🔍 التحقق من الرفع

### في قاعدة البيانات:
```sql
-- عرض الملفات المرفوعة
SELECT * FROM uploaded_files ORDER BY uploaded_at DESC;

-- عرض الأخبار النصية
SELECT * FROM raw_data WHERE source_type_id = 6 ORDER BY fetched_at DESC;
```

### في AWS S3:
1. افتح AWS Console
2. اذهب إلى S3 → `media-center-management-system`
3. تحقق من الفولدرات:
   - `manual-input-audio/` - الملفات الصوتية
   - `manual-input-video/` - ملفات الفيديو
4. يجب أن ترى الملفات بأسماء مثل:
   - `manual-input-audio-1713528000000-abc123-recording.webm`
   - `manual-input-video-1713528000000-xyz789-video.mp4`

---

## 📊 API Endpoints للاختبار

### جلب التصنيفات:
```bash
curl http://localhost:3000/api/manual-input/categories
```

### جلب المصادر:
```bash
curl http://localhost:3000/api/manual-input/sources
```

### رفع صوت:
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-audio \
  -F "file=@/path/to/audio.mp3" \
  -F "uploaded_by=42"
```

### رفع فيديو:
```bash
curl -X POST http://localhost:3000/api/manual-input/upload-video \
  -F "file=@/path/to/video.mp4" \
  -F "uploaded_by=42"
```

### جلب الملفات المعلقة:
```bash
curl http://localhost:3000/api/manual-input/pending-files
```

---

## ⚠️ مشاكل شائعة وحلولها

### 1. "فشل في رفع الملف"
- تأكد من AWS credentials في `.env`
- تأكد من أن الباك إند شغال
- تحقق من حجم الملف (صوت: 50MB، فيديو: 500MB)

### 2. "فشل الوصول إلى الميكروفون/الكاميرا"
- اسمح بالوصول في المتصفح
- استخدم HTTPS أو localhost
- تحقق من إعدادات الخصوصية في النظام

### 3. "نوع الملف غير مدعوم"
- **صوت**: MP3, M4A, WAV, WebM, OGG
- **فيديو**: MP4, WebM, MOV, AVI

### 4. CORS Error
- تأكد من إعدادات CORS في `src/index.ts`
- الباك إند يجب أن يسمح بـ `http://localhost:3001-3003`

---

## 📝 ملاحظات

1. **User ID**: حالياً مثبت على `42` (قيس زهران)
2. **S3 Naming**: الملفات تُحفظ بأسماء واضحة تبدأ بـ `manual-input-audio-` أو `manual-input-video-`
3. **Processing Status**: الملفات تُحفظ بحالة `pending` في انتظار المعالجة
4. **Transcription**: نظام التحويل لنص سيُضاف لاحقاً

---

## ✅ Checklist للتجربة

- [ ] الباك إند شغال على port 3000
- [ ] الفرونت إند شغال على port 3001-3003
- [ ] AWS S3 credentials موجودة في `.env`
- [ ] قاعدة البيانات متصلة
- [ ] جدول `uploaded_files` موجود
- [ ] إدخال النص يعمل
- [ ] رفع ملف صوتي يعمل
- [ ] تسجيل صوتي يعمل
- [ ] رفع ملف فيديو يعمل
- [ ] تسجيل فيديو يعمل
- [ ] الملفات تظهر في S3
- [ ] الملفات تُحفظ في قاعدة البيانات
