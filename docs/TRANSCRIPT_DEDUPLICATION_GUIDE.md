# 📋 دليل إزالة التكرار من الترانسكريبت

## 🎯 المشكلة

عند تحويل الملفات الصوتية والفيديو إلى نصوص باستخدام OpenAI Whisper، قد يحدث تكرار في:
1. **النصوص من الـ chunks المختلفة** - عند تقسيم الملفات الكبيرة
2. **الجمل المكررة** - نفس الجملة تظهر مرتين
3. **الكلمات المكررة** - كلمات متتالية متطابقة
4. **الـ segments المكررة** - segments بنفس النص

## ✅ الحل المطبق

### 1. **خدمة إزالة التكرار** (`src/utils/deduplication.service.ts`)

تحتوي على عدة دوال:

#### أ) `removeChunkOverlap(texts, threshold)`
```typescript
// إزالة النصوص المتداخلة بين الـ chunks
const cleanedText = removeChunkOverlap([
  "النص من الـ chunk الأول...",
  "النص من الـ chunk الثاني..."
], 0.8);
```

**كيف تعمل:**
- تبحث عن تشابه بين نهاية chunk وبداية الـ chunk التالي
- تستخدم Levenshtein distance لحساب التشابه
- تزيل الجزء المتداخل من الـ chunk الثاني

#### ب) `deduplicateSegments(segments)`
```typescript
// إزالة الـ segments المكررة
const uniqueSegments = deduplicateSegments(segments);
```

**كيف تعمل:**
- تتحقق من تطابق النص في كل segment
- تحتفظ بأول ظهور فقط
- تسجل الـ segments المكررة في الـ logs

#### ج) `validateTranscriptQuality(transcript)`
```typescript
// التحقق من جودة الترانسكريبت
const quality = validateTranscriptQuality(transcript);
console.log(`Duplicate %: ${quality.duplicatePercentage}`);
```

**المقاييس:**
- `duplicatePercentage` - نسبة الأسطر المكررة
- `averageLineLength` - متوسط طول السطر
- `totalLines` - عدد الأسطر الكلي
- `warnings` - تحذيرات الجودة

### 2. **التكامل مع الـ Controllers**

#### في `extractAndTranscribe`:
```typescript
// 1. جمع نصوص الـ chunks
let chunkTexts: string[] = [];

// 2. معالجة كل chunk
const transcriptionFunction = async (buffer: Buffer) => {
  const result = await transcribeAudioWithOpenAI(buffer, { language, includeTimestamps });
  chunkTexts.push(result.text); // حفظ النص
  return result.text;
};

// 3. تنظيف النصوص
const cleanedTranscript = processChunkedTranscript(chunkTexts, {
  removeOverlap: true,
  cleanDuplicates: true,
  overlapThreshold: 0.8
});

// 4. التحقق من الجودة
const quality = validateTranscriptQuality(cleanedTranscript);

// 5. إزالة تكرار الـ segments
const deduplicatedSegments = deduplicateSegments(adjustedSegments);
```

## 📊 مثال عملي

### قبل التنظيف:
```
Chunk 1: "مرحبا بك في البرنامج. هذا هو الحلقة الأولى من السلسلة."
Chunk 2: "هذا هو الحلقة الأولى من السلسلة. نتحدث اليوم عن..."
```

### بعد التنظيف:
```
"مرحبا بك في البرنامج. هذا هو الحلقة الأولى من السلسلة. نتحدث اليوم عن..."
```

## 🔧 الإعدادات

### في API Request:
```json
{
  "videoUrl": "https://...",
  "language": "ar",
  "enableChunking": true,
  "chunkDurationSeconds": 180,
  "maxConcurrentChunks": 3,
  "includeTimestamps": true
}
```

### في Response:
```json
{
  "success": true,
  "data": {
    "transcript": "النص النظيف بدون تكرار",
    "segments": [
      {
        "start": 0.0,
        "end": 5.2,
        "text": "أول جملة",
        "startFormatted": "00:00",
        "endFormatted": "00:05"
      }
    ],
    "quality": {
      "duplicatePercentage": 2.5,
      "totalLines": 45,
      "isValid": true
    },
    "segmentCount": 42
  }
}
```

## 📈 مقاييس الجودة

| المقياس | الحد الأدنى | الحد الأقصى | الوصف |
|--------|-----------|-----------|-------|
| Duplicate % | 0% | 10% | نسبة الأسطر المكررة |
| Avg Line Length | 10 | 500 | متوسط طول السطر بالأحرف |
| Total Lines | 1 | ∞ | عدد الأسطر الكلي |

## 🎯 الخطوات التي تتم تلقائياً

### 1. **جمع البيانات**
```
✅ جمع نصوص كل chunk
✅ جمع segments مع timestamps
```

### 2. **معالجة التداخل**
```
✅ كشف التشابه بين الـ chunks
✅ إزالة الأجزاء المتداخلة
```

### 3. **تنظيف النصوص**
```
✅ إزالة الأسطر المكررة
✅ إزالة الجمل المكررة (اختياري)
✅ إزالة الكلمات المكررة (اختياري)
```

### 4. **معالجة الـ Segments**
```
✅ تعديل timestamps بناءً على موقع الـ chunk
✅ إزالة الـ segments المكررة
✅ ترتيب الـ segments حسب الوقت
```

### 5. **التحقق من الجودة**
```
✅ حساب نسبة التكرار
✅ التحقق من طول الأسطر
✅ إصدار تحذيرات إذا لزم الأمر
```

## 🔍 الـ Logs

عند معالجة ملف، ستجد logs مثل:

```
🧹 Cleaning transcript from duplicates...
📊 Transcript Quality Report:
   - Total Lines: 45
   - Duplicate Percentage: 2.50%
   - Average Line Length: 85 characters
✅ Segments deduplicated: 50 → 48
```

## 🚀 الاستخدام من الفرونت

```typescript
// في AudioProcessing.tsx
const extractRes = await api.extractAndTranscribeProduction(file.s3_url, {
  language: 'ar',
  enableChunking: true,
  chunkDurationSeconds: 180,
  includeTimestamps: true
});

// النص النظيف بدون تكرار
const cleanTranscript = extractRes.data.transcript;

// الـ segments المنظفة
const segments = extractRes.data.segments;

// معلومات الجودة
const quality = extractRes.data.quality;
console.log(`Duplicate %: ${quality.duplicatePercentage}%`);
```

## ⚙️ الخوارزميات المستخدمة

### 1. **Levenshtein Distance**
لحساب التشابه بين نصين:
```
مثال: "مرحبا" و "مرحبا" = 0 (متطابق)
مثال: "مرحبا" و "مرحبب" = 1 (فرق واحد)
```

### 2. **Overlap Detection**
البحث عن تداخل بين نهاية نص وبداية نص آخر:
```
النص 1: "...هذا هو الحلقة الأولى"
النص 2: "الحلقة الأولى من السلسلة..."
التداخل: "الحلقة الأولى" (يتم حذفه من النص 2)
```

### 3. **Normalization**
تحويل النصوص إلى صيغة موحدة للمقارنة:
```
"مرحبا" → "مرحبا" (lowercase)
"  مرحبا  " → "مرحبا" (trim)
```

## 📝 ملاحظات مهمة

1. **الكلمات القصيرة**: لا يتم حذف الكلمات القصيرة جداً (أدوات، حروف جر) حتى لو تكررت
2. **الـ Threshold**: يمكن تعديل `overlapThreshold` (0.8 افتراضي) لزيادة أو تقليل حساسية الكشف
3. **الأداء**: معالجة الـ chunks الكبيرة قد تستغرق وقتاً أطول
4. **الدقة**: الخوارزمية تعمل بشكل أفضل مع النصوص الطويلة

## 🐛 استكشاف الأخطاء

### مشكلة: نسبة تكرار عالية
```
الحل: تقليل chunkDurationSeconds أو زيادة overlapThreshold
```

### مشكلة: حذف نصوص مهمة
```
الحل: تقليل overlapThreshold أو تعطيل removeOverlap
```

### مشكلة: segments مفقودة
```
الحل: التأكد من أن includeTimestamps = true
```

## 📞 الدعم

للمزيد من المعلومات، راجع:
- `src/utils/deduplication.service.ts` - الخدمة الكاملة
- `src/controllers/ai-hub/streaming-extraction.controller.ts` - التكامل
- `frontend/src/components/ai/TranscriptWithTimestamps.tsx` - العرض
