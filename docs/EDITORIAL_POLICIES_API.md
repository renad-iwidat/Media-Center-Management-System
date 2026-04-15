# Editorial Policies API Documentation

## نظرة عامة

API لتطبيق سياسات التحرير على الأخبار باستخدام vLLM Gateway.

**Base URL:** `http://localhost:3000/api/news/editorial-policies`

**vLLM Gateway:** `http://93.127.132.59:8080/generate`

---

## المتطلبات

### Environment Variables

```env
AI_MODEL=http://93.127.132.59:8080/generate
```

### Database

جدول `editorial_policies` يجب أن يكون موجوداً مع الأعمدة:
- `id` (SERIAL PRIMARY KEY)
- `media_unit_id` (INT)
- `name` (VARCHAR)
- `description` (TEXT)
- `task_type` (VARCHAR)
- `editor_instructions` (TEXT)
- `injected_vars` (JSONB)
- `output_schema` (JSONB)
- `is_active` (BOOLEAN)
- `version` (INT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Endpoints

### 1. جلب جميع السياسات المفعّلة

```http
GET /api/news/editorial-policies
```

**Response:**
```json
{
  "status": "success",
  "count": 11,
  "policies": [
    {
      "id": 1,
      "name": "content_validation",
      "description": "فحص صلاحية المحتوى للنشر",
      "task_type": "content_validation",
      "is_active": true
    },
    ...
  ]
}
```

---

### 2. جلب تفاصيل سياسة واحدة

```http
GET /api/news/editorial-policies/:policyName
```

**Parameters:**
- `policyName` (string): اسم السياسة (مثال: `replace`, `classify`, `rewrite`)

**Response:**
```json
{
  "status": "success",
  "policy": {
    "id": 3,
    "name": "replace",
    "description": "استبدال المصطلحات المحظورة",
    "task_type": "replace",
    "editor_instructions": "طبّق قاموس الاستبدال...",
    "injected_vars": {
      "replace_map": {
        "الجيش الإسرائيلي": "قوات الاحتلال",
        ...
      }
    },
    "output_schema": {
      "modified_text": "string",
      "total_changes": "number",
      "changes_made": "array"
    },
    "is_active": true,
    "version": 1
  }
}
```

---

### 3. تطبيق سياسة واحدة على نص

```http
POST /api/news/editorial-policies/apply
```

**Request Body:**
```json
{
  "policyName": "replace",
  "text": "الجيش الإسرائيلي قصف المدينة"
}
```

**Response:**
```json
{
  "status": "success",
  "policyName": "replace",
  "taskType": "replace",
  "originalText": "الجيش الإسرائيلي قصف المدينة",
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
  "executionTime": 1234
}
```

---

### 4. تطبيق سلسلة من السياسات (Pipeline)

```http
POST /api/news/editorial-policies/pipeline
```

**Request Body:**
```json
{
  "text": "النص الأصلي...",
  "policyNames": [
    "content_validation",
    "classify",
    "replace",
    "remove",
    "rewrite",
    "balance",
    "validate",
    "cleanup",
    "formatting"
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "originalText": "النص الأصلي...",
  "finalText": "النص النهائي بعد تطبيق جميع السياسات",
  "totalExecutionTime": 12345,
  "pipelineResults": [
    {
      "status": "success",
      "policyName": "content_validation",
      "taskType": "content_validation",
      "originalText": "...",
      "modifiedText": "...",
      "result": { ... },
      "executionTime": 1234
    },
    {
      "status": "success",
      "policyName": "classify",
      "taskType": "classify",
      "originalText": "...",
      "modifiedText": "...",
      "result": {
        "editorial_type": "news",
        "secondary_tag": null,
        "confidence": 0.95,
        "reasoning": "خبر قصير عن حدث واحد"
      },
      "executionTime": 1500
    },
    ...
  ]
}
```

---

### 5. إنشاء سياسة جديدة

```http
POST /api/news/editorial-policies
```

**Request Body:**
```json
{
  "name": "my_custom_policy",
  "description": "سياسة مخصصة",
  "taskType": "custom",
  "editorInstructions": "افحص النص وتأكد من...",
  "injectedVars": {
    "custom_var": "value"
  },
  "outputSchema": {
    "status": "string",
    "result": "string"
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "تم إنشاء السياسة بنجاح",
  "policy": {
    "id": 12,
    "name": "my_custom_policy",
    "description": "سياسة مخصصة",
    "task_type": "custom",
    "editor_instructions": "افحص النص وتأكد من...",
    "injected_vars": { ... },
    "output_schema": { ... },
    "is_active": true,
    "version": 1,
    "created_at": "2024-04-14T10:30:00Z",
    "updated_at": "2024-04-14T10:30:00Z"
  }
}
```

---

### 6. تحديث سياسة

```http
PUT /api/news/editorial-policies/:policyName
```

**Parameters:**
- `policyName` (string): اسم السياسة

**Request Body:**
```json
{
  "editorInstructions": "التعليمات الجديدة...",
  "injectedVars": {
    "replace_map": {
      "الجيش الإسرائيلي": "قوات الاحتلال",
      "جديد": "استبدال جديد"
    }
  }
}
```

**Response:**
```json
{
  "status": "success",
  "message": "تم تحديث السياسة بنجاح",
  "policy": {
    "id": 3,
    "name": "replace",
    "editor_instructions": "التعليمات الجديدة...",
    "injected_vars": { ... },
    "version": 2,
    "updated_at": "2024-04-14T10:35:00Z"
  }
}
```

---

## السياسات المتاحة (11 سياسة)

| # | الاسم | Task Type | الوصف |
|---|-------|-----------|-------|
| 1 | `content_validation` | content_validation | فحص صلاحية المحتوى للنشر |
| 2 | `classify` | classify | تصنيف نوع المحتوى الصحفي |
| 3 | `replace` | replace | استبدال المصطلحات المحظورة |
| 4 | `remove` | remove | حذف المصطلحات الممنوعة |
| 5 | `rewrite` | rewrite | إعادة الصياغة الصحفية |
| 6 | `balance` | balance | فحص التوازن وإضافة تنويهات |
| 7 | `disclaimer` | disclaimer | إضافة تنويهات معتمدة |
| 8 | `terminology_check` | terminology_check | فحص المصطلحات المحظورة |
| 9 | `validate` | validate | تدقيق شامل نهائي |
| 10 | `cleanup` | cleanup | التنظيف التقني |
| 11 | `formatting` | formatting | تنسيق النص للنشر الرقمي |

---

## أمثلة الاستخدام

### مثال 1: تطبيق سياسة Replace

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/apply \
  -H "Content-Type: application/json" \
  -d '{
    "policyName": "replace",
    "text": "الجيش الإسرائيلي قصف المدينة"
  }'
```

### مثال 2: تطبيق Pipeline كامل

```bash
curl -X POST http://localhost:3000/api/news/editorial-policies/pipeline \
  -H "Content-Type: application/json" \
  -d '{
    "text": "النص الأصلي...",
    "policyNames": [
      "content_validation",
      "classify",
      "replace",
      "remove",
      "rewrite",
      "balance",
      "validate",
      "cleanup",
      "formatting"
    ]
  }'
```

### مثال 3: جلب تفاصيل سياسة

```bash
curl http://localhost:3000/api/news/editorial-policies/replace
```

### مثال 4: تحديث سياسة

```bash
curl -X PUT http://localhost:3000/api/news/editorial-policies/replace \
  -H "Content-Type: application/json" \
  -d '{
    "editorInstructions": "التعليمات الجديدة...",
    "injectedVars": {
      "replace_map": {
        "الجيش الإسرائيلي": "قوات الاحتلال"
      }
    }
  }'
```

---

## معالجة الأخطاء

### خطأ 400 - طلب غير صحيح

```json
{
  "error": "policyName و text مطلوبة"
}
```

### خطأ 404 - السياسة غير موجودة

```json
{
  "error": "السياسة replace غير موجودة أو غير مفعّلة"
}
```

### خطأ 500 - خطأ في الخادم

```json
{
  "error": "Connection timeout"
}
```

---

## ملاحظات مهمة

1. **vLLM Gateway**: يجب أن يكون الـ gateway متاحاً على `http://93.127.132.59:8080/generate`
2. **Timeout**: الحد الأقصى للانتظار هو 60 ثانية
3. **Pipeline**: السياسات تُطبّق بالترتيب، والنص المعدّل من سياسة يُستخدم للسياسة التالية
4. **JSON Response**: جميع الـ responses من الـ AI يجب أن تكون JSON صحيح
5. **Version Control**: كل تحديث للسياسة يزيد الـ version بـ 1

---

## الملفات ذات الصلة

- `src/services/news/ai-classifier.service.ts` - خدمة تطبيق السياسات
- `src/controllers/news/editorial-policy.controller.ts` - التحكم بالـ API
- `src/routes/news/editorial-policy.routes.ts` - مسارات الـ API
- `EDITORIAL_POLICIES_PROMPTS.md` - شرح البرومتات
- `INSERT_EDITORIAL_POLICIES.sql` - إدراج السياسات الـ 11
