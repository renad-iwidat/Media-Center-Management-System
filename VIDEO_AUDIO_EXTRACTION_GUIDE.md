# دليل استخراج الصوت من الفيديو وتحويله لنص
# Video Audio Extraction & Transcription Guide

## 📋 نظرة عامة | Overview

هذا النظام يوفر حلاً متكاملاً لاستخراج الصوت من ملفات الفيديو وتحويله إلى نص مكتوب، مع دعم:
- ✅ رفع الفيديو من S3 أو أي رابط
- ✅ استخراج الصوت بجودة عالية
- ✅ تحويل الصوت إلى نص (STT) بدعم اللغة العربية
- ✅ معالجة متوازية للملفات الكبيرة
- ✅ 3 طرق احتياطية للتعامل مع جميع الحالات

---

## 🏗️ البنية المعمارية | Architecture

### 1. **Frontend (React + TypeScript)**
```
frontend/src/components/ai/AudioProcessing.tsx
frontend/src/services/api.ts
```

**الوظائف:**
- واجهة المستخدم لرفع واختيار الفيديو
- عرض قائمة الملفات المرفوعة (صوت + فيديو)
- بدء عملية التفريغ الصوتي
- عرض النتائج النهائية

### 2. **Backend Services**

#### أ) **Streaming Audio Extractor** (الطريقة الأولى - الأسرع)
```
src/services/ai-hub/streaming-audio-extractor.service.ts
```

**المميزات:**
- ✅ استخراج مباشر بدون تحميل الفيديو كاملاً
- ✅ توفير الذاكرة والوقت
- ✅ مناسب للفيديوهات الصغيرة والمتوسطة
- ⚠️ قد يفشل مع بعض روابط S3 المشكلة

**كيف يعمل:**
```typescript
const extractor = new StreamingAudioExtractor();
const audioStream = await extractor.extractAsStream(videoUrl, {
  outputFormat: 'mp3',
  bitrate: '128k',
  timeout: 300000
});
```

#### ب) **Audio Extraction Service** (الطريقة الثانية - المتكاملة)
```
src/services/ai-hub/audio-extraction.service.ts
```

**المميزات:**
- ✅ يحاول 3 طرق مختلفة تلقائياً
- ✅ معالجة مقسمة للملفات الكبيرة
- ✅ دعم التفريغ المتوازي

**الطرق الثلاثة:**
1. **Direct FFmpeg**: استخراج مباشر من الرابط
2. **Streaming Download**: تحميل كـ stream واستخراج مباشر
3. **Download-First**: تحميل كامل ثم استخراج (احتياطي)

```typescript
const audioBuffer = await extractAudioFromVideoUrl(videoUrl, {
  outputFormat: 'mp3',
  bitrate: '128k'
});
```

#### ج) **Download-First Extractor** (الطريقة الثالثة - الأكثر موثوقية)
```
src/services/ai-hub/download-first-extractor.service.ts
```

**المميزات:**
- ✅ يحمل الفيديو كاملاً أولاً
- ✅ يتحقق من صحة الملف
- ✅ يعمل مع جميع أنواع الروابط
- ⚠️ يستهلك مساحة تخزين مؤقتة
- ⚠️ أبطأ من الطرق الأخرى

**كيف يعمل:**
```typescript
const result = await processVideoWithDownloadFirst(
  videoUrl,
  transcriptionFunction,
  {
    outputFormat: 'mp3',
    bitrate: '128k',
    maxFileSize: 1024 * 1024 * 1024 // 1GB
  }
);
```

#### د) **Chunked Audio Processor** (معالج التقسيم)
```
src/services/ai-hub/chunked-audio-processor.service.ts
```

**الوظائف:**
- تقسيم الصوت الطويل إلى أجزاء صغيرة
- معالجة متوازية (3 أجزاء في نفس الوقت)
- دمج النصوص النهائية

```typescript
const chunks = await splitAudioIntoChunks(audioPath, {
  chunkDurationSeconds: 180, // 3 دقائق لكل جزء
  maxConcurrentChunks: 3
});

const processedChunks = await processAudioChunksInParallel(
  chunks,
  transcriptionFunction,
  { maxConcurrentChunks: 3 }
);

const finalTranscript = combineTranscripts(processedChunks);
```

#### هـ) **Speech-to-Text Service** (خدمة التفريغ)
```
src/services/ai-hub/stt.service.ts
```

**الوظائف:**
- إرسال الصوت إلى موديل الذكاء الاصطناعي
- دعم اللغات المتعددة (عربي، إنجليزي، إلخ)
- معالجة متوازية للأجزاء الكبيرة

```typescript
const transcript = await transcribeAudioFromBuffer(audioBuffer, {
  language: 'ar'
});
```

### 3. **Controllers & Routes**

#### أ) **Streaming Extraction Controller**
```
src/controllers/ai-hub/streaming-extraction.controller.ts
src/routes/ai-hub/streaming-extraction.routes.ts
```

**Endpoints:**

1. **POST `/api/ai-hub/streaming-extraction/extract-and-transcribe`**
   - الطريقة الرئيسية للإنتاج
   - يحاول الطريقة المتكاملة أولاً
   - يتراجع تلقائياً للطريقة الاحتياطية

2. **POST `/api/ai-hub/streaming-extraction/download-first`**
   - طريقة التحميل أولاً (للروابط المشكلة)
   - الأكثر موثوقية

3. **POST `/api/ai-hub/streaming-extraction/video-info`**
   - الحصول على معلومات الفيديو

4. **POST `/api/ai-hub/streaming-extraction/diagnose`**
   - تشخيص مشاكل الروابط

#### ب) **Audio Extraction Controller**
```
src/controllers/ai-hub/audio-extraction.controller.ts
```

**Endpoints:**

1. **POST `/api/ai-hub/audio-extraction/extract-and-transcribe`**
   - الطريقة القديمة (Legacy)
   - لا تزال تعمل للتوافق

---

## 🔄 تدفق العمل | Workflow

### السيناريو 1: المستخدم يرفع فيديو ويريد تفريغه

```
1. المستخدم يختار فيديو من القائمة
   ↓
2. Frontend يرسل طلب إلى:
   POST /api/ai-hub/streaming-extraction/extract-and-transcribe
   Body: { videoUrl, language: 'ar', enableChunking: true }
   ↓
3. Backend يحاول الطريقة المتكاملة:
   a) Direct FFmpeg (سريع)
   b) Streaming Download (متوسط)
   c) Download-First (بطيء لكن موثوق)
   ↓
4. استخراج الصوت بنجاح
   ↓
5. تحديد إذا كان الملف كبير:
   - صغير (<2 دقيقة): تفريغ مباشر
   - كبير (>2 دقيقة): تقسيم ومعالجة متوازية
   ↓
6. إرسال الصوت لموديل STT
   ↓
7. إرجاع النص النهائي للمستخدم
```

### السيناريو 2: فشل الطريقة الأولى

```
1. Streaming Extraction تفشل
   ↓
2. النظام يحاول Download-First تلقائياً
   ↓
3. تحميل الفيديو كاملاً
   ↓
4. التحقق من صحة الملف
   ↓
5. استخراج الصوت
   ↓
6. تفريغ الصوت
   ↓
7. حذف الملفات المؤقتة
   ↓
8. إرجاع النتيجة
```

---

## 🛠️ المشاكل التي تم حلها

### 1. ✅ **متغيرات غير مستخدمة**
**المشكلة:**
```typescript
const timeout = options.timeout || 300000; // ❌ غير مستخدم
```

**الحل:**
```typescript
// ✅ تم حذف المتغيرات غير المستخدمة
```

### 2. ✅ **Imports غير مستخدمة**
**المشكلة:**
```typescript
import https from 'https'; // ❌ غير مستخدم
import http from 'http';   // ❌ غير مستخدم
```

**الحل:**
```typescript
// ✅ تم حذف الـ imports غير المستخدمة
```

### 3. ✅ **منطق معقد في Controller**
**المشكلة:**
- كان الـ controller يحاول streaming يدوياً
- كود مكرر ومعقد
- صعب الصيانة

**الحل:**
```typescript
// ✅ استخدام الطريقة المتكاملة التي تتعامل مع كل شيء
const extractionResult = await extractAudioWithChunkedProcessing(
  videoUrl,
  transcriptionFunction,
  options
);
```

### 4. ✅ **عدم وجود fallback واضح**
**المشكلة:**
- إذا فشلت طريقة، النظام يتوقف

**الحل:**
```typescript
try {
  // ✅ محاولة الطريقة المتكاملة
  result = await extractAudioWithChunkedProcessing(...);
} catch (error) {
  // ✅ fallback تلقائي للطريقة الاحتياطية
  result = await processVideoWithDownloadFirst(...);
}
```

---

## 📊 مقارنة الطرق الثلاثة

| الميزة | Streaming | Integrated | Download-First |
|--------|-----------|------------|----------------|
| السرعة | ⚡⚡⚡ سريع جداً | ⚡⚡ سريع | ⚡ بطيء |
| استهلاك الذاكرة | 💾 قليل | 💾💾 متوسط | 💾💾💾 كثير |
| الموثوقية | ⭐⭐ متوسط | ⭐⭐⭐ عالي | ⭐⭐⭐⭐ عالي جداً |
| دعم الملفات الكبيرة | ❌ محدود | ✅ جيد | ✅ ممتاز |
| التعامل مع S3 المشكل | ❌ قد يفشل | ✅ يحاول fallback | ✅ يعمل دائماً |

---

## 🔧 الإعدادات والمتغيرات

### Environment Variables

```bash
# AI Model URL (STT Service)
AI_MODEL=https://your-ai-model-url.com

# Parallel Processing Settings
ENABLE_PARALLEL_STT=true
STT_PARALLEL_THRESHOLD_MB=2
STT_CHUNK_DURATION_SECONDS=30
STT_MAX_CONCURRENT_REQUESTS=3
STT_OVERLAP_SECONDS=2

# Download-First Settings
MAX_VIDEO_DOWNLOAD_SIZE_MB=1024
MAX_FFMPEG_PROCESSES=3
```

### Frontend Configuration

```typescript
// frontend/.env
VITE_API_URL=https://your-backend-url.com
```

---

## 🧪 اختبار النظام

### 1. اختبار الطريقة المتكاملة

```bash
curl -X POST http://localhost:3000/api/ai-hub/streaming-extraction/extract-and-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://your-s3-bucket.s3.amazonaws.com/video.mp4",
    "language": "ar",
    "enableChunking": true,
    "chunkDurationSeconds": 180,
    "maxConcurrentChunks": 3
  }'
```

### 2. اختبار طريقة Download-First

```bash
curl -X POST http://localhost:3000/api/ai-hub/streaming-extraction/download-first \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://your-s3-bucket.s3.amazonaws.com/video.mp4",
    "language": "ar",
    "maxFileSize": 1073741824
  }'
```

### 3. تشخيص رابط S3

```bash
curl -X POST http://localhost:3000/api/ai-hub/streaming-extraction/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://your-s3-bucket.s3.amazonaws.com/video.mp4"
  }'
```

---

## 📝 أمثلة الاستخدام

### مثال 1: استخراج وتفريغ فيديو صغير

```typescript
// Frontend
const result = await api.extractAndTranscribeProduction(videoUrl, {
  language: 'ar',
  enableChunking: false // فيديو صغير، لا حاجة للتقسيم
});

console.log(result.data.transcript);
```

### مثال 2: استخراج وتفريغ فيديو كبير

```typescript
// Frontend
const result = await api.extractAndTranscribeProduction(videoUrl, {
  language: 'ar',
  enableChunking: true,
  chunkDurationSeconds: 180, // 3 دقائق لكل جزء
  maxConcurrentChunks: 3     // 3 أجزاء في نفس الوقت
});

console.log(`تم معالجة ${result.data.chunksProcessed} أجزاء`);
console.log(result.data.transcript);
```

### مثال 3: استخدام Download-First للروابط المشكلة

```typescript
// Frontend
const result = await api.extractWithDownloadFirst(videoUrl, {
  language: 'ar',
  maxFileSize: 1024 * 1024 * 1024 // 1GB
});

console.log(`حجم الفيديو: ${result.data.videoSize} bytes`);
console.log(`وقت المعالجة: ${result.data.processingTime}ms`);
console.log(result.data.transcript);
```

---

## 🐛 استكشاف الأخطاء

### المشكلة 1: "Failed to extract audio"

**الأسباب المحتملة:**
- رابط S3 غير صحيح أو منتهي الصلاحية
- الفيديو لا يحتوي على صوت
- الفيديو تالف

**الحل:**
1. تحقق من الرابط باستخدام `/diagnose`
2. جرب طريقة Download-First
3. تحقق من صلاحيات S3

### المشكلة 2: "Timeout"

**الأسباب المحتملة:**
- الفيديو كبير جداً
- الاتصال بطيء
- الموديل بطيء

**الحل:**
1. زيادة الـ timeout
2. تفعيل التقسيم (chunking)
3. تقليل حجم الأجزاء

### المشكلة 3: "Out of memory"

**الأسباب المحتملة:**
- الفيديو كبير جداً
- عدم تفعيل التقسيم

**الحل:**
1. تفعيل `enableChunking: true`
2. تقليل `chunkDurationSeconds`
3. استخدام Download-First

---

## 🚀 التحسينات المستقبلية

### 1. **Redis للـ Job Management**
حالياً: in-memory
مستقبلاً: Redis للتوزيع على عدة servers

### 2. **WebSocket للتحديثات الفورية**
حالياً: polling
مستقبلاً: WebSocket للتحديثات الفورية

### 3. **S3 Direct Upload للنتائج**
حالياً: إرجاع النص في الـ response
مستقبلاً: رفع النص والصوت على S3

### 4. **Queue System**
حالياً: معالجة فورية
مستقبلاً: نظام طوابير (Bull/BullMQ)

---

## 📚 المراجع

- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Node.js Streams](https://nodejs.org/api/stream.html)
- [AWS S3 Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/optimizing-performance.html)

---

## 👥 الدعم

إذا واجهت أي مشاكل:
1. تحقق من الـ logs في الـ console
2. استخدم `/diagnose` لتشخيص الرابط
3. جرب طريقة Download-First
4. تواصل مع فريق الدعم

---

**آخر تحديث:** 2025-01-XX
**الإصدار:** 2.0.0
