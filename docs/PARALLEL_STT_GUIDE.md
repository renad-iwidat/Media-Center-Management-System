# Parallel STT Processing Guide
# دليل المعالجة المتوازية للتفريغ الصوتي

## المفهوم الأساسي (Core Concept)

بدلاً من إرسال ملف صوتي كبير واحد إلى STT API، نقوم بـ:

### 1. **تقسيم الصوت** (Audio Splitting)
```
الملف الأصلي (5 دقائق)
├── جزء 1: 0-30 ثانية
├── جزء 2: 28-58 ثانية (تداخل 2 ثانية)
├── جزء 3: 56-86 ثانية
└── جزء 4: 84-114 ثانية
```

### 2. **معالجة متوازية** (Parallel Processing)
```
Request 1 ──► STT API ──► "النص الأول"
Request 2 ──► STT API ──► "النص الثاني"  
Request 3 ──► STT API ──► "النص الثالث"
```

### 3. **دمج النتائج** (Result Combination)
```
"النص الأول" + "النص الثاني" + "النص الثالث" = "النص النهائي"
```

## المزايا (Benefits)

### ⚡ **تسريع المعالجة**
- **قبل:** ملف 5 دقائق = 45 ثانية معالجة
- **بعد:** 3 أجزاء متوازية = 15 ثانية معالجة
- **تحسن:** 3x أسرع!

### 🔄 **موثوقية أعلى**
- إذا فشل جزء واحد، باقي الأجزاء تكمل
- إعادة محاولة للأجزاء الفاشلة فقط
- تقليل فقدان البيانات

### 📊 **استغلال أفضل للموارد**
- استخدام عدة connections متوازية
- تقليل idle time
- تحسين throughput

## الإعدادات (Configuration)

### متغيرات البيئة (Environment Variables)
```bash
# تفعيل/إلغاء المعالجة المتوازية
ENABLE_PARALLEL_STT=true

# مدة كل جزء (بالثواني)
STT_CHUNK_DURATION_SECONDS=30

# عدد الطلبات المتوازية القصوى
STT_MAX_CONCURRENT_REQUESTS=3

# التداخل بين الأجزاء (بالثواني)
STT_OVERLAP_SECONDS=2

# الحد الأدنى لحجم الملف للمعالجة المتوازية (بالميجابايت)
STT_PARALLEL_THRESHOLD_MB=2
```

### التحكم البرمجي (Programmatic Control)
```typescript
const transcript = await transcribeAudioBufferParallel(audioBuffer, {
  language: 'ar',
  chunkDurationSeconds: 30,    // مدة كل جزء
  maxConcurrentRequests: 3,    // عدد الطلبات المتوازية
  overlapSeconds: 2,           // التداخل
  timeout: 60000              // مهلة زمنية لكل طلب
});
```

## كيفية العمل (How It Works)

### 1. **التحقق من الحجم** (Size Check)
```typescript
const shouldUseParallel = audioBuffer.length > 2 * 1024 * 1024; // > 2MB
```

### 2. **تقسيم الصوت** (Audio Splitting)
```typescript
// حفظ الصوت كملف مؤقت
fs.writeFileSync(tempPath, audioBuffer);

// تقسيم باستخدام FFmpeg
ffmpeg(tempPath)
  .seekInput(startTime)
  .duration(chunkDuration)
  .output(chunkPath)
  .run();
```

### 3. **معالجة متوازية** (Parallel Processing)
```typescript
// معالجة الأجزاء في batches
for (let i = 0; i < chunks.length; i += maxConcurrent) {
  const batch = chunks.slice(i, i + maxConcurrent);
  const promises = batch.map(chunk => processChunk(chunk));
  const results = await Promise.all(promises);
}
```

### 4. **دمج النتائج** (Result Merging)
```typescript
// إزالة التداخل ودمج النصوص
let combined = results[0].transcript;
for (let i = 1; i < results.length; i++) {
  const cleaned = removeOverlap(results[i].transcript, combined);
  combined += ' ' + cleaned;
}
```

## أمثلة عملية (Practical Examples)

### مثال 1: ملف صغير (< 2MB)
```
📊 Audio Buffer Size: 1171685 bytes
📝 Using single request...
⏱️  Processing time: 8 seconds
```

### مثال 2: ملف كبير (> 2MB)
```
📊 Audio Buffer Size: 5242880 bytes
🚀 Using parallel processing for large audio file...
📦 Audio split into 4 chunks
⚡ Processing 4 chunks with max 3 concurrent requests
📦 Processing batch 1: chunks 1-3
📦 Processing batch 2: chunks 4-4
✅ Parallel processing completed
⏱️  Total processing time: 12 seconds (vs 35 seconds single)
```

## الأداء المتوقع (Expected Performance)

### حسب حجم الملف (By File Size)
| حجم الملف | طريقة واحدة | متوازي | تحسن |
|-----------|-------------|--------|------|
| 1MB       | 8s          | 8s     | 0%   |
| 3MB       | 25s         | 12s    | 52%  |
| 5MB       | 40s         | 15s    | 62%  |
| 10MB      | 80s         | 25s    | 69%  |

### حسب عدد الطلبات المتوازية (By Concurrent Requests)
| متوازي | وقت المعالجة | استخدام الشبكة |
|--------|-------------|----------------|
| 1       | 40s         | منخفض          |
| 2       | 22s         | متوسط          |
| 3       | 15s         | عالي           |
| 4       | 14s         | عالي جداً       |

**التوصية:** 3 طلبات متوازية للتوازن الأمثل

## استكشاف الأخطاء (Troubleshooting)

### مشاكل شائعة (Common Issues)

#### 1. فشل في تقسيم الصوت
```
❌ Error: FFmpeg failed to split audio
```
**الحل:**
- تأكد من تثبيت FFmpeg
- تحقق من صحة الملف الصوتي
- تأكد من وجود مساحة كافية في /tmp

#### 2. فشل في الطلبات المتوازية
```
❌ STT API error: 429 Too Many Requests
```
**الحل:**
```bash
# تقليل عدد الطلبات المتوازية
STT_MAX_CONCURRENT_REQUESTS=2

# زيادة التأخير بين الـ batches
```

#### 3. مشاكل في دمج النتائج
```
⚠️  Overlapping text detected
```
**الحل:**
```bash
# زيادة التداخل
STT_OVERLAP_SECONDS=3

# أو تقليل مدة الأجزاء
STT_CHUNK_DURATION_SECONDS=20
```

### تشخيص الأداء (Performance Diagnostics)

#### تفعيل السجلات المفصلة
```bash
LOG_LEVEL=debug
```

#### مراقبة الإحصائيات
```typescript
📊 Parallel processing stats:
   - Total chunks: 4
   - Avg processing time: 3500ms
   - Total processing time: 14000ms
   - Successful chunks: 4
```

## أفضل الممارسات (Best Practices)

### 1. **اختيار مدة الجزء المناسبة**
- **قصيرة جداً (< 15s):** overhead كبير
- **طويلة جداً (> 60s):** فوائد قليلة
- **الأمثل:** 20-40 ثانية

### 2. **التحكم في التزامن**
- **بيئة محلية:** 3-4 طلبات متوازية
- **بيئة سحابية:** 2-3 طلبات متوازية
- **API محدود:** 1-2 طلبات متوازية

### 3. **إدارة الذاكرة**
- تنظيف الملفات المؤقتة فوراً
- معالجة الأجزاء في batches
- مراقبة استخدام الذاكرة

### 4. **معالجة الأخطاء**
- إعادة محاولة للأجزاء الفاشلة
- fallback للطريقة التقليدية
- تسجيل مفصل للأخطاء

## الخلاصة (Summary)

المعالجة المتوازية للـ STT توفر:
- ✅ **تسريع 2-3x** للملفات الكبيرة
- ✅ **موثوقية أعلى** مع إعادة المحاولة
- ✅ **استغلال أفضل للموارد**
- ✅ **تحكم مرن** في الإعدادات
- ✅ **fallback تلقائي** للطريقة التقليدية

**متى تستخدمها:**
- ملفات صوتية > 2MB
- STT API يدعم طلبات متوازية
- شبكة مستقرة وسريعة

**متى لا تستخدمها:**
- ملفات صغيرة < 1MB
- API محدود بـ rate limiting
- موارد محدودة (ذاكرة/معالج)