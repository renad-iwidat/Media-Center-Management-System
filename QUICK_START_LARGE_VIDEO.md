# ⚡ البدء السريع - معالجة الفيديو الكبير

## 🎯 في 5 دقائق

### 1️⃣ استخدم الواجهة الأمامية

```typescript
// في أي صفحة React
import LargeVideoUploader from '@/components/ai/LargeVideoUploader';

export default function Page() {
  return <LargeVideoUploader />;
}
```

**ما يحدث:**
1. اختر ملف الفيديو (حتى 2 GB)
2. يتم تقسيمه إلى أجزاء 10 MB
3. رفع الأجزاء بشكل متوازي
4. عند الانتهاء، يبدأ الاستخراج والمعالجة
5. اعرض النص المستخرج

---

### 2️⃣ استخدم API مباشرة

#### الطريقة أ: رفع الأجزاء

```bash
# الجزء الأول
curl -X POST http://localhost:7845/api/ai-hub/large-video/upload-chunk \
  -F "chunk=@video.mp4.part1" \
  -F "chunkIndex=0" \
  -F "totalChunks=10" \
  -F "fileName=video.mp4"

# الجزء الثاني
curl -X POST http://localhost:7845/api/ai-hub/large-video/upload-chunk \
  -F "chunk=@video.mp4.part2" \
  -F "chunkIndex=1" \
  -F "totalChunks=10" \
  -F "fileName=video.mp4"

# ... وهكذا لكل الأجزاء
```

#### الطريقة ب: معالجة من رابط

```bash
curl -X POST http://localhost:7845/api/ai-hub/large-video/process-direct \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "chunkDurationSeconds": 300,
    "maxConcurrentChunks": 3,
    "language": "ar"
  }'
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1234567890",
    "status": "processing",
    "message": "Video processing started in background"
  }
}
```

---

### 3️⃣ تحقق من الحالة

```bash
curl http://localhost:7845/api/ai-hub/large-video/status/session-1234567890
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "sessionId": "session-1234567890",
    "status": "processing",
    "progress": 65,
    "totalChunks": 20,
    "processedChunks": 13,
    "elapsedTime": 45000
  }
}
```

---

## 📊 الحالات الممكنة

| الحالة | المعنى | الإجراء |
|--------|--------|--------|
| `uploading` | جاري رفع الأجزاء | انتظر |
| `extracting` | استخراج الصوت | انتظر |
| `chunking` | تقسيم الصوت | انتظر |
| `processing` | معالجة الأجزاء | انتظر |
| `completed` | مكتمل ✓ | اعرض النص |
| `failed` | فشل ✗ | تحقق من الخطأ |

---

## ⏱️ الأوقات المتوقعة

| حجم الفيديو | الوقت المتوقع |
|-----------|-------------|
| 100 MB | 2-3 دقائق |
| 500 MB | 5-7 دقائق |
| 1 GB | 10-12 دقيقة |
| 2 GB | 15-20 دقيقة |

---

## 🔧 الإعدادات الموصى بها

### للسيرفر الصغير (512 MB)
```json
{
  "chunkDurationSeconds": 180,
  "maxConcurrentChunks": 2,
  "bitrate": "96k"
}
```

### للسيرفر المتوسط (1 GB)
```json
{
  "chunkDurationSeconds": 300,
  "maxConcurrentChunks": 3,
  "bitrate": "128k"
}
```

### للسيرفر الكبير (2 GB+)
```json
{
  "chunkDurationSeconds": 600,
  "maxConcurrentChunks": 5,
  "bitrate": "192k"
}
```

---

## 🚨 الأخطاء الشائعة

### ❌ "Ran out of memory"
```
الحل: قلل maxConcurrentChunks أو ارفع السيرفر
```

### ❌ "Upload timeout"
```
الحل: تحقق من سرعة الإنترنت أو قلل حجم الجزء
```

### ❌ "Transcription failed"
```
الحل: تحقق من جودة الصوت أو اللغة
```

---

## 💡 نصائح

1. **ابدأ بفيديو صغير** (100 MB) للاختبار
2. **راقب استهلاك الذاكرة** أثناء المعالجة
3. **استخدم HTTPS** في الإنتاج
4. **احفظ النص** بعد الانتهاء
5. **استخدم CDN** لتسريع الرفع

---

## 📚 المزيد من المعلومات

- 📖 `LARGE_VIDEO_PROCESSING_GUIDE.md` - دليل شامل
- 📊 `LARGE_VIDEO_IMPLEMENTATION_SUMMARY.md` - ملخص التطبيق
- 🐳 `DOCKER_DEPLOYMENT_GUIDE.md` - دليل النشر

---

## ✅ قائمة التحقق

- [ ] اختبر مع فيديو 100 MB
- [ ] اختبر مع فيديو 500 MB
- [ ] اختبر مع فيديو 1 GB
- [ ] راقب استهلاك الذاكرة
- [ ] اضبط الإعدادات حسب السيرفر
- [ ] استخدم في الإنتاج

---

## 🎉 جاهز!

الآن يمكنك معالجة الفيديوهات الكبيرة بكفاءة! 🚀
