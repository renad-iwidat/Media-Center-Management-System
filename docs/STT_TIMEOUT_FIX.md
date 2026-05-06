# إصلاح مشكلة STT Timeout

## 🔴 المشكلة المحددة
```
DOMException [TimeoutError]: The operation was aborted due to timeout
```

**السبب:**
- STT API بطيئة للعربي
- Timeout قليل (60 ثانية)
- Parallel requests عم تحمّل السيرفر
- تكرار العملية بدون تغيير الاستراتيجية

## ✅ الإصلاحات المطبقة

### 1. زيادة Timeout للعربي
```typescript
// قبل: 60 ثانية
// بعد: 180 ثانية (3 دقائق)
signal: AbortSignal.timeout(180000)
```

### 2. إضافة Retry Logic ذكي
```typescript
// 3 محاولات مع exponential backoff
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    // STT request
    return transcript;
  } catch (error) {
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 3. تقليل Concurrency
```typescript
// قبل: 5 concurrent requests
// بعد: 1 sequential request (أكثر استقرار)
const maxConcurrent = options.maxConcurrentChunks || 1;
```

### 4. تحسين Chunk Duration
```typescript
// قبل: 60 ثانية
// بعد: 120 ثانية (2 دقيقة) - متوازن للعربي
const chunkDuration = options.chunkDurationSeconds || 120;
```

### 5. إضافة Delay بين Chunks
```typescript
// انتظار ثانيتين بين كل chunk
if (chunk.index < chunks.length - 1) {
  await new Promise(resolve => setTimeout(resolve, 2000));
}
```

## 📊 النتائج المتوقعة

### قبل الإصلاح:
```
433 ثانية فيديو
↓
3 chunks × 180s
↓
3 parallel requests
↓
❌ Timeout بعد 60 ثانية
↓
🔄 إعادة العملية كاملة
↓
❌ نفس الخطأ
```

### بعد الإصلاح:
```
433 ثانية فيديو
↓
~4 chunks × 120s
↓
Sequential processing (واحد تلو الآخر)
↓
180 ثانية timeout لكل chunk
↓
3 محاولات مع retry
↓
✅ نجاح
```

## 🔧 الإعدادات الجديدة

### Default Values:
```typescript
chunkDurationSeconds: 120    // 2 دقيقة
maxConcurrentChunks: 1       // Sequential
timeout: 180000             // 3 دقائق
maxRetries: 3               // 3 محاولات
```

### للاستخدام السريع:
```typescript
{
  "s3Url": "...",
  "language": "ar",
  "chunkDurationSeconds": 90,     // أقصر للسرعة
  "maxConcurrentChunks": 2        // parallel محدود
}
```

### للاستقرار الأقصى:
```typescript
{
  "s3Url": "...", 
  "language": "ar",
  "chunkDurationSeconds": 180,    // أطول للاستقرار
  "maxConcurrentChunks": 1        // sequential كامل
}
```

## 📝 Log Output الجديد

```
🎙️ Starting STT Transcription from Buffer
📊 Audio Buffer Size: 2881138 bytes
🗣️ Language: ar
⏱️ Timeout: 180000ms
📝 Using single request with retry logic...

🔄 Processing Chunk 1/4 sequentially...
🔄 Attempt 1/3
📤 Sending to STT API...
⏱️ Response Time: 45000ms
✅ Chunk 1 completed in 00:00:45 (2500 chars)
📊 Progress: 25% | Elapsed: 00:00:47 | Remaining: 00:02:21
⏳ Waiting 2s before next chunk...

🔄 Processing Chunk 2/4 sequentially...
🔄 Attempt 1/3
📤 Sending to STT API...
⏱️ Response Time: 52000ms
✅ Chunk 2 completed in 00:00:52 (2400 chars)
📊 Progress: 50% | Elapsed: 00:01:41 | Remaining: 00:01:41
```

## 🧪 اختبار الإصلاح

### Test 1: Single Chunk
```bash
curl -X POST http://localhost:3000/api/ai-hub/stt/test \
  -F "file=@test-60s.mp3" \
  -F "language=ar"
```

### Test 2: Small Video
```bash
curl -X POST http://localhost:3000/api/ai-hub/audio-extraction/extract-and-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "s3Url": "https://...",
    "language": "ar",
    "chunkDurationSeconds": 120,
    "maxConcurrentChunks": 1
  }'
```

## 🔄 Rollback إذا لزم الأمر

```typescript
// إرجاع للإعدادات السابقة
const chunkDuration = 60;
const maxConcurrent = 5;
const timeout = 60000;

// وإزالة retry logic
```

## 📈 مراقبة الأداء

### مؤشرات النجاح:
- ✅ لا توجد timeout errors
- ✅ كل chunk يكمل بنجاح
- ✅ وقت معقول (5-8 دقائق للفيديو 7 دقائق)

### مؤشرات المشاكل:
- ❌ لا يزال timeout
- ❌ retry كثيرة
- ❌ وقت طويل جداً (>15 دقيقة)

## 🎯 الخلاصة

**المشكلة:** STT API بطيئة + timeout قليل + parallel overload
**الحل:** timeout أطول + retry logic + sequential processing + chunks أكبر

**النتيجة المتوقعة:** 
- من ❌ فشل كامل
- إلى ✅ نجاح مستقر في 5-8 دقائق