# Editorial Policies - API Endpoints Mapping

## 📋 ملخص الـ Endpoints الثلاثة

الـ vLLM Gateway يوفر 3 endpoints رئيسية:

| Endpoint | الاستخدام | الوصف |
|----------|----------|-------|
| **POST /generate** | التصنيف والتحليل والفحص | الـ endpoint الافتراضي للمعالجة العامة |
| **POST /rewrite** | إعادة الصياغة الصحفية | متخصص لإعادة صياغة النصوص |
| **POST /summarize** | التلخيص | متخصص لتلخيص النصوص |

---

## 🎯 تعيين السياسات الـ 11 للـ Endpoints

### 1️⃣ Content Validation
- **Endpoint**: `/generate`
- **Task Type**: `content_validation`
- **الوصف**: فحص صلاحية المحتوى للنشر
- **الاستخدام**: التحقق من أن النص خبر حقيقي وليس كود أو خطأ تقني
- **Output**: JSON يحتوي على `is_valid`, `severity`, `issues`

### 2️⃣ Classify
- **Endpoint**: `/generate`
- **Task Type**: `classify`
- **الوصف**: تصنيف نوع المحتوى الصحفي
- **الاستخدام**: تحديد ما إذا كان الخبر `news`, `report`, `explainer`, `analysis`, أو `urgent`
- **Output**: JSON يحتوي على `editorial_type`, `secondary_tag`, `confidence`

### 3️⃣ Replace
- **Endpoint**: `/generate`
- **Task Type**: `replace`
- **الوصف**: استبدال المصطلحات المحظورة
- **الاستخدام**: تطبيق قاموس الاستبدال (مثل "الجيش الإسرائيلي" → "قوات الاحتلال")
- **Output**: JSON يحتوي على `modified_text`, `total_changes`, `changes_made`

### 4️⃣ Remove
- **Endpoint**: `/generate`
- **Task Type**: `remove`
- **الوصف**: حذف المصطلحات الممنوعة
- **الاستخدام**: إزالة كلمات ممنوعة من السرد (لا تحذف من الاقتباسات)
- **Output**: JSON يحتوي على `modified_text`, `removed_terms`, `total_removals`

### 5️⃣ Rewrite ⭐
- **Endpoint**: `/rewrite`
- **Task Type**: `rewrite`
- **الوصف**: إعادة الصياغة الصحفية المهنية
- **الاستخدام**: تحسين الصياغة والأسلوب الصحفي
- **Output**: JSON يحتوي على `modified_text`, `total_changes`, `changes_made`
- **ملاحظة**: هذه السياسة تستخدم الـ endpoint المتخصص `/rewrite`

### 6️⃣ Balance
- **Endpoint**: `/generate`
- **Task Type**: `balance`
- **الوصف**: فحص التوازن وإضافة تنويهات
- **الاستخدام**: التحقق من توازن الخبر وإضافة تنويهات عند الحاجة
- **Output**: JSON يحتوي على `modified_text`, `balance_status`, `disclaimer_text`

### 7️⃣ Disclaimer
- **Endpoint**: `/generate`
- **Task Type**: `disclaimer`
- **الوصف**: إضافة التنويهات المعتمدة
- **الاستخدام**: إضافة تنويهات محددة في نهاية النص
- **Output**: JSON يحتوي على `modified_text`, `disclaimer_added`

### 8️⃣ Terminology Check
- **Endpoint**: `/generate`
- **Task Type**: `terminology_check`
- **الوصف**: فحص المصطلحات المحظورة
- **الاستخدام**: التحقق من عدم استخدام مصطلحات ممنوعة في السرد
- **Output**: JSON يحتوي على `status`, `violations`, `total_violations`

### 9️⃣ Validate
- **Endpoint**: `/generate`
- **Task Type**: `validate`
- **الوصف**: التدقيق الشامل النهائي
- **الاستخدام**: فحص شامل على جميع المحاور (مصطلحات، إسناد، صياغة، إلخ)
- **Output**: JSON يحتوي على `status`, `issues_found`, `suggested_fix`

### 🔟 Cleanup
- **Endpoint**: `/generate`
- **Task Type**: `cleanup`
- **الوصف**: التنظيف التقني
- **الاستخدام**: حذف المعلومات التقنية والروابط
- **Output**: JSON يحتوي على `modified_text`, `total_changes`, `changes_made`

### 1️⃣1️⃣ Formatting
- **Endpoint**: `/generate`
- **Task Type**: `formatting`
- **الوصف**: تنسيق النص للنشر الرقمي
- **الاستخدام**: تنسيق النص بكسور أسطر وفقرات منطقية
- **Output**: JSON يحتوي على `modified_text`, `total_changes`, `paragraph_count`

---

## 📊 إحصائيات الـ Endpoints

| Endpoint | عدد السياسات | النسبة |
|----------|-----------|--------|
| `/generate` | 10 | 91% |
| `/rewrite` | 1 | 9% |
| `/summarize` | 0 | 0% |

---

## 🔄 Pipeline Execution Flow

عند تطبيق Pipeline من السياسات:

```
النص الأصلي
    ↓
[1] content_validation (/generate)
    ↓
[2] classify (/generate)
    ↓
[3] replace (/generate)
    ↓
[4] remove (/generate)
    ↓
[5] rewrite (/rewrite) ⭐
    ↓
[6] balance (/generate)
    ↓
[7] disclaimer (/generate)
    ↓
[8] terminology_check (/generate)
    ↓
[9] validate (/generate)
    ↓
[10] cleanup (/generate)
    ↓
[11] formatting (/generate)
    ↓
النص النهائي المعالج
```

---

## 💡 ملاحظات مهمة

### 1. اختيار الـ Endpoint الصحيح
- **`/generate`**: للمعالجة العامة (التصنيف، الفحص، الاستبدال، إلخ)
- **`/rewrite`**: متخصص لإعادة الصياغة الصحفية فقط
- **`/summarize`**: غير مستخدم حالياً (يمكن إضافته لاحقاً)

### 2. Request Format
```json
{
  "prompt": "البرومت الكامل مع التعليمات والنص",
  "max_tokens": 2048,
  "temperature": 0.3
}
```

### 3. Response Format
```json
{
  "text": "النتيجة",
  "finish_reason": "stop",
  "usage": {
    "prompt_tokens": 100,
    "completion_tokens": 50,
    "total_tokens": 150
  }
}
```

### 4. Pipeline Behavior
- النص المعدّل من سياسة يُستخدم كـ input للسياسة التالية
- إذا فشلت سياسة، يتم تسجيل الخطأ والمتابعة بالنص الأصلي
- الترتيب مهم جداً (مثلاً: `replace` قبل `terminology_check`)

### 5. Timeout
- الـ timeout الحالي: 60 ثانية لكل سياسة
- يمكن تعديله حسب الحاجة

---

## 🧪 أمثلة الاستخدام

### مثال 1: تطبيق سياسة واحدة (Replace)

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

### مثال 2: تطبيق Pipeline كامل

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
  "finalText": "قوات الاحتلال قصفت المدينة بقوة شديدة",
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
      "modifiedText": "قوات الاحتلال قصفت المدينة بقوة شديدة",
      "executionTime": 2345,
      "endpoint": "http://93.127.132.59:8080/rewrite"
    },
    {
      "policyName": "formatting",
      "taskType": "formatting",
      "status": "success",
      "modifiedText": "قوات الاحتلال قصفت المدينة بقوة شديدة",
      "executionTime": 1000,
      "endpoint": "http://93.127.132.59:8080/generate"
    }
  ],
  "totalExecutionTime": 4579
}
```

---

## 🔧 التخصيص والتوسع

### إضافة سياسة جديدة

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom_policy",
    "description": "سياسة مخصصة",
    "taskType": "generate",
    "editorInstructions": "التعليمات الخاصة بك...",
    "injectedVars": {
      "custom_var": "value"
    },
    "outputSchema": {
      "status": "string",
      "result": "string"
    }
  }'
```

### تحديث سياسة موجودة

```bash
curl -X PUT http://localhost:3000/api/news/editorial-policies/replace \
  -H "Content-Type: application/json" \
  -d '{
    "editorInstructions": "التعليمات الجديدة...",
    "injectedVars": {
      "replace_map": {
        "مصطلح قديم": "مصطلح جديد"
      }
    }
  }'
```

---

## ✅ Checklist للتحقق

- [ ] الـ vLLM Gateway متاح على `http://93.127.132.59:8080`
- [ ] الـ endpoints الثلاثة تعمل: `/generate`, `/rewrite`, `/summarize`
- [ ] السياسات الـ 11 مدرجة في الـ database
- [ ] الـ AI Classifier Service يحتوي على الدوال: `applyPolicy`, `applyPoliciesPipeline`
- [ ] الـ Editorial Policy Controller يستدعي الدوال الصحيحة
- [ ] الـ Routes مسجلة في الـ main index

