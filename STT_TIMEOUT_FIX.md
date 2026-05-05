# حل مشكلة Headers Timeout في خدمة STT
# STT Headers Timeout Fix

## المشكلة / Problem

### الخطأ الأساسي / Main Error
```
HeadersTimeoutError: Headers Timeout Error
code: 'UND_ERR_HEADERS_TIMEOUT'
```

### السبب / Root Cause
طلبات النسخ الصوتي (STT) إلى خدمة الذكاء الاصطناعي تستغرق وقتًا طويلاً (أكثر من دقيقة واحدة) وتنتهي مهلتها قبل الحصول على رد من الخادم.

The transcription requests to the AI service take too long (more than 1 minute) and timeout before receiving a response from the server.

### الأخطاء الإضافية / Additional Errors
1. **FFmpeg لا يستطيع فتح ملفات S3 / FFmpeg Cannot Open S3 Files**
   ```
   Error opening input file https://...
   Error opening input files: Input/output error
   ```
   - المشكلة: الأحرف العربية في أسماء الملفات
   - Problem: Arabic characters in file names

## الحل / Solution

### 1. زيادة Timeout في طلبات STT
**Increase Timeout in STT Requests**

تم تعديل جميع طلبات `fetch` في الملفات التالية:
Modified all `fetch` requests in the following files:

#### `src/services/ai-hub/stt.service.ts`
```typescript
const response = await fetch(`${sttApiUrl}/stt`, {
  method: 'POST',
  body: formData,
  // Increase timeout to 5 minutes for large audio files
  signal: AbortSignal.timeout(300000), // 5 minutes
});
```

#### `src/services/ai-hub/parallel-stt.service.ts`
```typescript
const response = await fetch(`${sttApiUrl}/stt`, {
  method: 'POST',
  body: formData,
  // Increase timeout to 5 minutes for large audio files
  signal: AbortSignal.timeout(Math.max(timeout, 300000)), // At least 5 minutes
});
```

### 2. التغييرات المطبقة / Applied Changes

#### قبل / Before
- Timeout الافتراضي: 60 ثانية (دقيقة واحدة)
- Default timeout: 60 seconds (1 minute)
- كان يسبب Headers Timeout Error للملفات الكبيرة
- Was causing Headers Timeout Error for large files

#### بعد / After
- Timeout الجديد: 300 ثانية (5 دقائق)
- New timeout: 300 seconds (5 minutes)
- يسمح بمعالجة الملفات الصوتية الكبيرة
- Allows processing of large audio files

### 3. الملفات المعدلة / Modified Files

1. ✅ `src/services/ai-hub/stt.service.ts`
   - `transcribeAudioFromUrl()` - Added 5-minute timeout
   - `transcribeAudioFromFile()` - Added 5-minute timeout
   - `transcribeAudioBufferSingle()` - Added 5-minute timeout

2. ✅ `src/services/ai-hub/parallel-stt.service.ts`
   - `transcribeAudioBufferSingle()` - Added 5-minute timeout with minimum guarantee

## الفوائد / Benefits

### 1. معالجة أفضل للملفات الكبيرة
**Better Handling of Large Files**
- يمكن الآن معالجة ملفات صوتية تصل إلى 5 دقائق دون timeout
- Can now process audio files up to 5 minutes without timeout

### 2. تقليل الأخطاء
**Reduced Errors**
- تقليل حالات فشل النسخ بسبب timeout
- Fewer transcription failures due to timeout

### 3. تجربة مستخدم أفضل
**Better User Experience**
- معالجة أكثر موثوقية للفيديوهات الطويلة
- More reliable processing of long videos

## التوصيات الإضافية / Additional Recommendations

### 1. مراقبة الأداء / Performance Monitoring
```typescript
// Add performance logging
console.log(`⏱️  STT Processing Time: ${duration}ms`);
console.log(`📊 Audio Size: ${audioBuffer.length} bytes`);
```

### 2. معالجة متوازية للملفات الكبيرة جدًا
**Parallel Processing for Very Large Files**
- استخدام `parallel-stt.service.ts` للملفات أكبر من 2MB
- Use `parallel-stt.service.ts` for files larger than 2MB
- تقسيم الملف إلى أجزاء أصغر
- Split file into smaller chunks

### 3. إعدادات بيئية مرنة / Flexible Environment Settings
```bash
# .env
STT_TIMEOUT_MS=300000  # 5 minutes
STT_CHUNK_DURATION_SECONDS=30
STT_MAX_CONCURRENT_REQUESTS=3
```

## الاختبار / Testing

### اختبار الحل / Test the Solution
```bash
# 1. Build the project
npm run build

# 2. Test with a long video
curl -X POST http://localhost:3000/api/ai-hub/extract-and-transcribe \
  -H "Content-Type: application/json" \
  -d '{
    "videoUrl": "https://your-s3-url.com/video.mp4",
    "enableChunking": true,
    "chunkDuration": 180,
    "maxConcurrent": 3
  }'
```

### النتائج المتوقعة / Expected Results
- ✅ لا مزيد من Headers Timeout Error
- ✅ No more Headers Timeout Error
- ✅ معالجة ناجحة للملفات الكبيرة
- ✅ Successful processing of large files
- ✅ نسخ كامل للصوت
- ✅ Complete audio transcription

## الخطوات التالية / Next Steps

1. ✅ **تطبيق التغييرات** - Applied Changes
2. 🔄 **إعادة البناء والنشر** - Rebuild and Deploy
   ```bash
   npm run build
   docker-compose up -d --build
   ```
3. 🧪 **اختبار مع فيديوهات حقيقية** - Test with Real Videos
4. 📊 **مراقبة الأداء** - Monitor Performance
5. 🔧 **ضبط Timeout حسب الحاجة** - Adjust Timeout as Needed

## ملاحظات / Notes

- Timeout الحالي (5 دقائق) مناسب لمعظم الحالات
- Current timeout (5 minutes) is suitable for most cases
- يمكن زيادته إذا لزم الأمر للفيديوهات الطويلة جدًا
- Can be increased if needed for very long videos
- المعالجة المتوازية تساعد في تقليل الوقت الإجمالي
- Parallel processing helps reduce overall time

## التاريخ / History
- **2026-05-05**: تطبيق الحل وزيادة timeout إلى 5 دقائق
- **2026-05-05**: Applied fix and increased timeout to 5 minutes
