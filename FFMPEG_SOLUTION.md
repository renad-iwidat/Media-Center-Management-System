# حل مشكلة FFmpeg - Audio Extraction Service Fix

## المشكلة الأصلية
النظام كان يتطلب تثبيت FFmpeg يدوياً على النظام، مما يسبب خطأ عند عدم وجوده:
```
FFmpeg is not installed. Please install FFmpeg to extract audio from videos.
```

## الحل المطبق
تم استبدال الاعتماد على FFmpeg المثبت على النظام بمكتبات Node.js تحتوي على FFmpeg مدمج.

### المكتبات المستخدمة:
1. **fluent-ffmpeg**: واجهة سهلة الاستخدام لـ FFmpeg
2. **@ffmpeg-installer/ffmpeg**: FFmpeg مدمج مع Node.js

### التثبيت:
```bash
npm install fluent-ffmpeg @ffmpeg-installer/ffmpeg
```

## التغييرات المطبقة

### 1. إضافة المكتبات المطلوبة:
```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegPath.path);
```

### 2. استبدال استدعاءات FFmpeg المباشرة:

#### قبل الإصلاح:
```typescript
const command = `ffmpeg -i "${videoFilePath}" -q:a 0 -map a -acodec libmp3lame -ab ${bitrate} "${tempAudioPath}" -y`;
await execAsync(command, { timeout });
```

#### بعد الإصلاح:
```typescript
await new Promise<void>((resolve, reject) => {
  const command = ffmpeg(videoFilePath)
    .audioCodec('libmp3lame')
    .audioBitrate(bitrate)
    .format(outputFormat)
    .output(tempAudioPath)
    .on('start', (commandLine) => {
      console.log('🎬 FFmpeg command:', commandLine);
    })
    .on('progress', (progress) => {
      if (progress.percent) {
        console.log(`📊 Progress: ${Math.round(progress.percent)}%`);
      }
    })
    .on('end', () => {
      console.log('✅ Audio extraction completed');
      resolve();
    })
    .on('error', (err) => {
      console.error('❌ FFmpeg error:', err);
      reject(err);
    });

  // Set timeout
  setTimeout(() => {
    command.kill('SIGKILL');
    reject(new Error(`Audio extraction timeout after ${timeout}ms`));
  }, timeout);

  command.run();
});
```

### 3. تحسين معالجة الأخطاء:
- إضافة progress tracking
- معالجة أفضل للـ timeout
- رسائل خطأ أكثر وضوحاً
- تنظيف الملفات المؤقتة بشكل أفضل

### 4. تحسين تحميل الملفات:
```typescript
const response = await fetch(videoUrl, { 
  signal: controller.signal,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});
```

## الميزات الجديدة

### 1. تتبع التقدم:
```typescript
.on('progress', (progress) => {
  if (progress.percent) {
    console.log(`📊 Progress: ${Math.round(progress.percent)}%`);
  }
})
```

### 2. معلومات مفصلة عن الأوامر:
```typescript
.on('start', (commandLine) => {
  console.log('🎬 FFmpeg command:', commandLine);
})
```

### 3. معالجة أفضل للـ timeout:
```typescript
setTimeout(() => {
  command.kill('SIGKILL');
  reject(new Error(`Audio extraction timeout after ${timeout}ms`));
}, timeout);
```

## الوظائف المحدثة

### 1. `extractAudioFromFile()`:
- استخراج الصوت من ملف فيديو محلي
- دعم تتبع التقدم
- معالجة أفضل للأخطاء

### 2. `extractAudioFromVideoUrl()`:
- تحميل الفيديو من URL
- استخراج الصوت
- تنظيف الملفات المؤقتة

### 3. `extractAudioAndSave()`:
- استخراج الصوت وحفظه في ملف
- دعم مسارات مخصصة

### 4. `getVideoInfo()`:
- الحصول على معلومات الفيديو
- استخدام ffprobe المدمج

## الصيغ المدعومة

### فيديو (إدخال):
- MP4, AVI, MOV, MKV, FLV, WMV, WebM, OGV, 3GP, TS, MTS, M2TS

### صوت (إخراج):
- MP3, WAV, AAC, FLAC, OGG

## كيفية الاستخدام

### استخراج من URL:
```typescript
import { extractAudioFromVideoUrl } from './audio-extraction.service';

const audioBuffer = await extractAudioFromVideoUrl(
  'https://example.com/video.mp4',
  { 
    outputFormat: 'mp3',
    bitrate: '128k',
    timeout: 300000
  }
);
```

### استخراج من ملف محلي:
```typescript
import { extractAudioFromFile } from './audio-extraction.service';

const audioBuffer = await extractAudioFromFile(
  '/path/to/video.mp4',
  { 
    outputFormat: 'mp3',
    bitrate: '128k'
  }
);
```

### الحصول على معلومات الفيديو:
```typescript
import { getVideoInfo } from './audio-extraction.service';

const info = await getVideoInfo('/path/to/video.mp4');
console.log('Duration:', info.duration);
console.log('Has Audio:', info.hasAudio);
console.log('Has Video:', info.hasVideo);
```

## اختبار الخدمة

يمكنك اختبار الخدمة باستخدام:
```bash
curl -X POST http://localhost:4000/api/ai-hub/audio/extract-from-s3 \
  -H "Content-Type: application/json" \
  -d '{"s3Url": "https://example.com/video.mp4", "outputFormat": "mp3"}'
```

## المزايا الجديدة

1. **لا حاجة لتثبيت FFmpeg يدوياً**: FFmpeg مدمج مع التطبيق
2. **تتبع التقدم**: عرض نسبة إنجاز العملية
3. **معالجة أفضل للأخطاء**: رسائل خطأ أكثر وضوحاً
4. **أداء محسن**: استخدام أفضل للذاكرة والموارد
5. **سهولة النشر**: لا حاجة لإعداد إضافي على الخادم

## ملاحظات مهمة

- FFmpeg الآن مدمج مع التطبيق ولا يحتاج تثبيت منفصل
- حجم التطبيق سيزيد قليلاً بسبب FFmpeg المدمج (~50MB)
- الأداء مماثل لـ FFmpeg المثبت على النظام
- يعمل على جميع أنظمة التشغيل (Windows, macOS, Linux)