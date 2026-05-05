# Download-First Audio Extraction Solution
# حل استخراج الصوت بالتحميل أولاً

## المشكلة (Problem)

كان النظام يحاول استخراج الصوت مباشرة من روابط S3 باستخدام FFmpeg streaming، لكن هذا كان يفشل مع بعض الملفات بسبب:

The system was trying to extract audio directly from S3 URLs using FFmpeg streaming, but this was failing with some files due to:

- مشاكل في الاتصال بـ S3 (S3 connection issues)
- مشاكل في تشفير الروابط العربية (Arabic URL encoding issues)  
- قيود FFmpeg مع الروابط البعيدة (FFmpeg limitations with remote URLs)
- مشاكل في المهلة الزمنية (Timeout issues)

## الحل (Solution)

تم تطوير نهج "التحميل أولاً" الذي يعمل كالتالي:

A "download-first" approach was developed that works as follows:

### 1. تحميل الفيديو كاملاً (Download Complete Video)
```typescript
// Download video file with progress tracking
const downloadResult = await downloadVideoFile(videoUrl, {
  maxFileSize: 500 * 1024 * 1024, // 500MB limit
  timeout: 600000 // 10 minutes
});
```

### 2. استخراج الصوت من الملف المحلي (Extract Audio from Local File)
```typescript
// Extract audio from downloaded video
const audioBuffer = await extractAudioFromDownloadedVideo(videoFilePath, {
  outputFormat: 'mp3',
  bitrate: '128k'
});
```

### 3. معالجة الصوت على شكل أجزاء (Process Audio in Chunks)
```typescript
// Process with chunking for large files
const result = await processVideoWithDownloadFirst(
  videoUrl,
  transcriptionFunction,
  {
    enableChunking: true,
    chunkDurationSeconds: 180, // 3 minutes per chunk
    maxConcurrentChunks: 3     // Process 3 chunks in parallel
  }
);
```

## الميزات الجديدة (New Features)

### 1. خدمة التحميل أولاً (Download-First Service)
- `src/services/ai-hub/download-first-extractor.service.ts`
- تحميل الفيديو مع تتبع التقدم (Video download with progress tracking)
- استخراج الصوت من الملف المحلي (Audio extraction from local file)
- معالجة مقسمة للملفات الكبيرة (Chunked processing for large files)

### 2. نقاط نهاية جديدة (New API Endpoints)

#### `/api/ai-hub/streaming-extraction/download-first`
```json
{
  "videoUrl": "string (required)",
  "language": "string (optional, default: ar)",
  "outputFormat": "mp3|wav|aac (optional, default: mp3)",
  "bitrate": "string (optional, default: 128k)",
  "enableChunking": "boolean (optional, default: true)",
  "chunkDurationSeconds": "number (optional, default: 180)",
  "maxConcurrentChunks": "number (optional, default: 3)",
  "maxFileSize": "number (optional, default: 1GB)"
}
```

#### `/api/ai-hub/streaming-extraction/video-info`
```json
{
  "videoUrl": "string (required)"
}
```

### 3. نظام الاحتياط المتدرج (Cascading Fallback System)

```typescript
try {
  // 1. Try streaming method first
  result = await streamingExtraction(videoUrl);
} catch (streamingError) {
  try {
    // 2. Fallback to download-first method
    result = await downloadFirstExtraction(videoUrl);
  } catch (downloadError) {
    // 3. Final fallback to legacy method
    result = await legacyExtraction(videoUrl);
  }
}
```

## كيفية الاستخدام (How to Use)

### 1. من الواجهة الأمامية (From Frontend)
```typescript
// Direct download-first method
const result = await api.extractWithDownloadFirst(videoUrl, {
  language: 'ar',
  enableChunking: true,
  maxFileSize: 1024 * 1024 * 1024 // 1GB
});

// Or use automatic fallback
const result = await api.extractAndTranscribeProduction(videoUrl, {
  forceDownloadFirst: true // Force download-first method
});
```

### 2. من الخادم مباشرة (Direct Server Call)
```bash
curl -X POST http://localhost:3001/api/ai-hub/streaming-extraction/download-first \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "videoUrl": "https://example.com/video.mp4",
    "language": "ar",
    "enableChunking": true
  }'
```

## الاختبار (Testing)

تم إنشاء سكريبت اختبار شامل:

```bash
node test-download-first.js
```

يختبر السكريبت:
- الحصول على معلومات الفيديو (Video info retrieval)
- الاستخراج بطريقة التحميل أولاً (Download-first extraction)
- نظام الاحتياط (Fallback system)
- إحصائيات النظام (System stats)

## المزايا (Benefits)

### 1. موثوقية أعلى (Higher Reliability)
- يعمل مع جميع أنواع روابط S3 (Works with all S3 URL types)
- لا يتأثر بمشاكل تشفير الروابط (Not affected by URL encoding issues)
- معالجة أفضل للأخطاء (Better error handling)

### 2. أداء محسن للملفات الكبيرة (Optimized Performance for Large Files)
- تحميل متوازي (Parallel downloading)
- معالجة مقسمة (Chunked processing)
- تتبع التقدم (Progress tracking)

### 3. مرونة في الاستخدام (Usage Flexibility)
- يمكن استخدامه كطريقة أساسية أو احتياطية (Can be used as primary or fallback method)
- خيارات قابلة للتخصيص (Customizable options)
- دعم لأحجام ملفات مختلفة (Support for different file sizes)

## الإعدادات (Configuration)

### متغيرات البيئة (Environment Variables)
```bash
# Maximum concurrent FFmpeg processes
MAX_FFMPEG_PROCESSES=3

# Default timeout for downloads (milliseconds)
DOWNLOAD_TIMEOUT=600000

# Maximum file size for download-first method (bytes)
MAX_DOWNLOAD_FILE_SIZE=1073741824
```

### إعدادات الافتراضية (Default Settings)
- حد أقصى لحجم الملف: 1GB (Max file size: 1GB)
- مهلة زمنية: 10 دقائق (Timeout: 10 minutes)
- مدة الجزء: 3 دقائق (Chunk duration: 3 minutes)
- أجزاء متوازية: 3 (Concurrent chunks: 3)

## المراقبة والسجلات (Monitoring & Logging)

### سجلات مفصلة (Detailed Logging)
```
📥 [2026-05-05T10:25:51.829Z] Starting Video Download
🌐 Video URL: https://example.com/video.mp4
📊 Max File Size: 500MB
⏱️  Timeout: 600s
📥 Download Progress: 45MB (23%) - 2.1MB/s
✅ Download completed: 195MB in 93s (avg: 2.1MB/s)
🎵 Extracting audio from downloaded video...
✅ Audio extracted: 8.2MB
🔄 Audio duration (847s) requires chunking...
📦 Audio split into 5 chunks
✅ Chunked processing completed: 15,847 characters
```

### مراقبة الأداء (Performance Monitoring)
- تتبع أوقات التحميل (Download time tracking)
- مراقبة استخدام الذاكرة (Memory usage monitoring)
- إحصائيات المعالجة (Processing statistics)

## استكشاف الأخطاء (Troubleshooting)

### مشاكل شائعة (Common Issues)

#### 1. فشل التحميل (Download Failure)
```
Error: Download timeout after 600s
```
**الحل:** زيادة المهلة الزمنية أو تقليل حجم الملف الأقصى

#### 2. نفاد مساحة القرص (Disk Space)
```
Error: ENOSPC: no space left on device
```
**الحل:** تنظيف الملفات المؤقتة أو زيادة مساحة القرص

#### 3. فشل FFmpeg (FFmpeg Failure)
```
Error: ffmpeg exited with code 1
```
**الحل:** التحقق من تثبيت FFmpeg وصحة الملف

## الأمان (Security)

### التحقق من الروابط (URL Validation)
- فحص النطاقات المسموحة (Whitelist domain checking)
- منع SSRF attacks
- التحقق من حجم الملف (File size validation)

### تنظيف الملفات (File Cleanup)
- حذف تلقائي للملفات المؤقتة (Automatic temp file cleanup)
- مراقبة استخدام القرص (Disk usage monitoring)
- تنظيف دوري للملفات القديمة (Periodic cleanup of old files)

## الخلاصة (Summary)

حل "التحميل أولاً" يوفر:
- موثوقية عالية لمعالجة الفيديوهات
- أداء محسن للملفات الكبيرة  
- نظام احتياط متدرج
- مراقبة وسجلات مفصلة
- أمان محسن

The "download-first" solution provides:
- High reliability for video processing
- Optimized performance for large files
- Cascading fallback system
- Detailed monitoring and logging
- Enhanced security