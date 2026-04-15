# استخدام Editorial Policies API

## 📋 ملخص الـ Endpoints الثلاثة

الـ vLLM Gateway يوفر 3 endpoints رئيسية:

| Endpoint | الاستخدام | عدد السياسات |
|----------|----------|-----------|
| **POST /generate** | التصنيف والتحليل والفحص | 10 سياسات |
| **POST /rewrite** | إعادة الصياغة الصحفية | 1 سياسة |
| **POST /summarize** | التلخيص | 0 سياسات (غير مستخدم) |

---

## 🎯 تعيين السياسات للـ Endpoints

### ✅ السياسات التي تستخدم `/generate` (10 سياسات)

1. **content_validation** - فحص صلاحية المحتوى للنشر
2. **classify** - تصنيف نوع المحتوى الصحفي
3. **replace** - استبدال المصطلحات المحظورة
4. **remove** - حذف المصطلحات الممنوعة
5. **balance** - فحص التوازن وإضافة تنويهات
6. **disclaimer** - إضافة التنويهات المعتمدة
7. **terminology_check** - فحص المصطلحات المحظورة
8. **validate** - التدقيق الشامل النهائي
9. **cleanup** - التنظيف التقني
10. **formatting** - تنسيق النص للنشر الرقمي

### ⭐ السياسات التي تستخدم `/rewrite` (1 سياسة)

1. **rewrite** - إعادة الصياغة الصحفية المهنية

---

## 🔧 كيفية الاستخدام

### 1. تطبيق سياسة واحدة

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/apply \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "replace",
    "text": "الجيش الإسرائيلي قصف المدينة"
  }'
```

**الاستجابة:**
```json
{
  "policyName": "replace",
  "taskType": "replace",
  "status": "success",
  "modifiedText": "قوات الاحتلال قصفت المدينة",
  "result": {
    "modified_text": "قوات الاحتلال قصفت المدينة",
    "total_changes": 1,
    "changes_made": [
      {
        "original": "الجيش الإسرائيلي",
        "replaced_with": "قوات الاحتلال",
        "occurrence_index": 0
      }
    ]
  },
  "executionTime": 1234,
  "endpoint": "http://93.127.132.59:8080/generate"
}
```

### 2. تطبيق سياسة Rewrite (يستخدم endpoint مختلف)

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/apply \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "rewrite",
    "text": "قوات الاحتلال قصفت المدينة بقوة شديدة جداً"
  }'
```

**الاستجابة:**
```json
{
  "policyName": "rewrite",
  "taskType": "rewrite",
  "status": "success",
  "modifiedText": "قصفت قوات الاحتلال المدينة بقوة شديدة",
  "result": {
    "status": "applied",
    "modified_text": "قصفت قوات الاحتلال المدينة بقوة شديدة",
    "total_changes": 2,
    "changes_made": [
      "إعادة ترتيب الجملة",
      "حذف الصفات الزائدة"
    ]
  },
  "executionTime": 2345,
  "endpoint": "http://93.127.132.59:8080/rewrite"
}
```

### 3. تطبيق Pipeline كامل

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "text": "الجيش الإسرائيلي قصف المدينة بقوة",
    "policyNames": ["replace", "rewrite", "formatting"]
  }'
```

**الاستجابة:**
```json
{
  "status": "success",
  "originalText": "الجيش الإسرائيلي قصف المدينة بقوة",
  "finalText": "قصفت قوات الاحتلال المدينة بقوة",
  "pipelineResults": [
    {
      "policyName": "replace",
      "taskType": "replace",
      "status": "success",
      "modifiedText": "قوات الاحتلال قصف المدينة بقوة",
      "executionTime": 1234,
      "endpoint": "http://93.127.132.59:8080/generate"
    },
    {
      "policyName": "rewrite",
      "taskType": "rewrite",
      "status": "success",
      "modifiedText": "قصفت قوات الاحتلال المدينة بقوة",
      "executionTime": 2345,
      "endpoint": "http://93.127.132.59:8080/rewrite"
    },
    {
      "policyName": "formatting",
      "taskType": "formatting",
      "status": "success",
      "modifiedText": "قصفت قوات الاحتلال المدينة بقوة",
      "executionTime": 1000,
      "endpoint": "http://93.127.132.59:8080/generate"
    }
  ],
  "totalExecutionTime": 4579
}
```

---

## 📊 الفرق بين الـ Endpoints

### `/generate` - الـ Endpoint الافتراضي

**الاستخدام:**
- التصنيف والتحليل
- الفحص والتحقق
- الاستبدال والحذف
- التنسيق والتنظيف

**الخصائص:**
- الأسرع والأكثر استقراراً
- يدعم معظم السياسات
- مناسب للعمليات الروتينية

### `/rewrite` - الـ Endpoint المتخصص

**الاستخدام:**
- إعادة الصياغة الصحفية المهنية فقط
- تحسين الأسلوب والصياغة
- الحفاظ على المعنى مع تحسين الجودة

**الخصائص:**
- متخصص لسياسة واحدة فقط
- قد يكون أبطأ قليلاً
- نتائج أكثر دقة للصياغة

### `/summarize` - الـ Endpoint غير المستخدم

**الاستخدام:**
- التلخيص (غير مستخدم حالياً)
- يمكن إضافته لاحقاً

---

## 🔄 كيفية اختيار الـ Endpoint الصحيح

الـ Controller يختار الـ endpoint تلقائياً بناءً على `task_type`:

```typescript
function getEndpointForPolicy(taskType: string): string {
  if (taskType === 'rewrite') {
    return 'rewrite';  // استخدم /rewrite
  }
  
  if (taskType === 'summarize') {
    return 'summarize';  // استخدم /summarize
  }
  
  return 'generate';  // استخدم /generate (الافتراضي)
}
```

---

## ✅ أمثلة عملية

### مثال 1: استبدال المصطلحات

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/apply \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "replace",
    "text": "الجيش الإسرائيلي قصف المدينة. قال جنود الاحتلال إنهم استهدفوا مواقع عسكرية."
  }'
```

**النتيجة:**
- يستخدم `/generate` endpoint
- يستبدل "الجيش الإسرائيلي" بـ "قوات الاحتلال"
- يستبدل "جنود الاحتلال" بـ "جنود الاحتلال" (بدون تغيير)

### مثال 2: إعادة الصياغة

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/apply \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "rewrite",
    "text": "قوات الاحتلال قامت بقصف المدينة بقوة شديدة جداً"
  }'
```

**النتيجة:**
- يستخدم `/rewrite` endpoint
- يحسّن الصياغة: "قصفت قوات الاحتلال المدينة بقوة شديدة"
- يحافظ على المعنى الأساسي

### مثال 3: Pipeline متكامل

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "text": "الجيش الإسرائيلي قام بقصف المدينة بقوة شديدة جداً",
    "policyNames": [
      "content_validation",
      "replace",
      "rewrite",
      "cleanup",
      "formatting"
    ]
  }'
```

**الخطوات:**
1. `content_validation` → `/generate` - فحص صلاحية المحتوى
2. `replace` → `/generate` - استبدال المصطلحات
3. `rewrite` → `/rewrite` - إعادة الصياغة
4. `cleanup` → `/generate` - التنظيف التقني
5. `formatting` → `/generate` - التنسيق

---

## 🚨 معالجة الأخطاء

### خطأ: السياسة غير موجودة

```json
{
  "error": "السياسة replace غير موجودة أو غير مفعّلة"
}
```

**الحل:** تأكد من أن السياسة مدرجة في الـ database وأنها مفعّلة.

### خطأ: الـ vLLM Gateway غير متاح

```json
{
  "error": "connect ECONNREFUSED 93.127.132.59:8080"
}
```

**الحل:** تأكد من أن الـ vLLM Gateway متاح على `http://93.127.132.59:8080`

### خطأ: Timeout

```json
{
  "error": "timeout of 60000ms exceeded"
}
```

**الحل:** قد يكون النص طويل جداً أو الـ server مشغول. حاول مرة أخرى.

---

## 📝 ملاحظات مهمة

1. **الـ Endpoint الصحيح مهم:** استخدام الـ endpoint الخاطئ قد يؤدي لنتائج غير دقيقة
2. **الترتيب مهم:** في Pipeline، النص المعدّل من سياسة يُستخدم للسياسة التالية
3. **الـ Timeout:** الـ timeout الحالي 60 ثانية لكل سياسة
4. **الأخطاء:** إذا فشلت سياسة، يتم تسجيل الخطأ والمتابعة بالنص الأصلي

---

## 🔗 الـ Endpoints الأخرى

```
GET    /api/news/editorial-policies              - جلب جميع السياسات
GET    /api/news/editorial-policies/:policyName  - جلب تفاصيل سياسة
POST   /api/news/editorial-policies              - إنشاء سياسة جديدة
PUT    /api/news/editorial-policies/:policyName  - تحديث سياسة
POST   /api/news/editorial-policies/apply        - تطبيق سياسة واحدة
POST   /api/news/editorial-policies/pipeline     - تطبيق سلسلة من السياسات
```
