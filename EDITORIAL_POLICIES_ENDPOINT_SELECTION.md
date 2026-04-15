# اختيار الـ Endpoint الصحيح لكل سياسة تحرير

## 📌 الملخص السريع

| السياسة | Task Type | الـ Endpoint | الوصف |
|--------|-----------|-----------|-------|
| content_validation | content_validation | `/generate` | فحص صلاحية المحتوى |
| classify | classify | `/generate` | تصنيف نوع المحتوى |
| replace | replace | `/generate` | استبدال المصطلحات |
| remove | remove | `/generate` | حذف المصطلحات |
| **rewrite** | **rewrite** | **`/rewrite`** ⭐ | إعادة الصياغة |
| balance | balance | `/generate` | فحص التوازن |
| disclaimer | disclaimer | `/generate` | إضافة التنويهات |
| terminology_check | terminology_check | `/generate` | فحص المصطلحات |
| validate | validate | `/generate` | التدقيق الشامل |
| cleanup | cleanup | `/generate` | التنظيف التقني |
| formatting | formatting | `/generate` | التنسيق للنشر |

---

## 🎯 القاعدة الذهبية

```
إذا كان task_type = "rewrite" → استخدم /rewrite
وإلا → استخدم /generate
```

---

## 🔍 التفاصيل

### 1️⃣ `/generate` - الـ Endpoint الافتراضي (10 سياسات)

**السياسات:**
- content_validation
- classify
- replace
- remove
- balance
- disclaimer
- terminology_check
- validate
- cleanup
- formatting

**الخصائص:**
- ✅ الأسرع والأكثر استقراراً
- ✅ يدعم معظم السياسات
- ✅ مناسب للعمليات الروتينية
- ✅ يعالج النصوص بسرعة

**مثال:**
```bash
curl -X POST http://93.127.132.59:8080/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "استبدل الجيش الإسرائيلي بقوات الاحتلال في النص التالي: ...",
    "max_tokens": 2048,
    "temperature": 0.3
  }'
```

---

### 2️⃣ `/rewrite` - الـ Endpoint المتخصص (1 سياسة)

**السياسات:**
- rewrite ⭐

**الخصائص:**
- ✅ متخصص لإعادة الصياغة الصحفية فقط
- ✅ نتائج أكثر دقة للصياغة
- ✅ يحافظ على المعنى مع تحسين الجودة
- ⚠️ قد يكون أبطأ قليلاً من `/generate`

**مثال:**
```bash
curl -X POST http://93.127.132.59:8080/rewrite \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "أعد صياغة النص التالي بصياغة صحفية مهنية: ...",
    "max_tokens": 2048,
    "temperature": 0.3
  }'
```

---

### 3️⃣ `/summarize` - الـ Endpoint غير المستخدم (0 سياسات)

**الحالة:** غير مستخدم حالياً

**الاستخدام المستقبلي:**
- يمكن إضافة سياسة `summarize` لاحقاً
- متخصص لتلخيص النصوص

---

## 🔧 كيفية الاختيار في الكود

### في Editorial Policy Controller

```typescript
function getEndpointForPolicy(taskType: string): string {
  // السياسات التي تستخدم /rewrite
  if (taskType === 'rewrite') {
    return 'rewrite';
  }

  // السياسات التي تستخدم /summarize (حالياً لا توجد)
  if (taskType === 'summarize') {
    return 'summarize';
  }

  // باقي السياسات تستخدم /generate (الافتراضي)
  return 'generate';
}
```

### في AI Classifier Service

```typescript
async applyPolicy(
  policyName: string,
  taskType: string,
  editorInstructions: string,
  text: string,
  injectedVars: Record<string, any> | null,
  outputSchema: Record<string, any> | null,
  endpoint: string = 'generate'  // ← يتم تمريره من الـ controller
): Promise<any> {
  const baseUrl = process.env.AI_MODEL || 'http://93.127.132.59:8080';
  const apiUrl = `${baseUrl}/${endpoint}`;  // ← يتم استخدامه هنا
  
  // ... باقي الكود
}
```

---

## 📊 إحصائيات الاستخدام

| Endpoint | عدد السياسات | النسبة | الحالة |
|----------|-----------|--------|--------|
| `/generate` | 10 | 91% | ✅ مستخدم |
| `/rewrite` | 1 | 9% | ✅ مستخدم |
| `/summarize` | 0 | 0% | ⏳ غير مستخدم |

---

## 🔄 مثال على Pipeline

```
النص الأصلي: "الجيش الإسرائيلي قام بقصف المدينة بقوة شديدة جداً"

↓

[1] content_validation → /generate
    ✅ النص صحيح وقابل للنشر

↓

[2] replace → /generate
    ✅ "الجيش الإسرائيلي" → "قوات الاحتلال"
    النص: "قوات الاحتلال قام بقصف المدينة بقوة شديدة جداً"

↓

[3] rewrite → /rewrite ⭐
    ✅ إعادة صياغة صحفية
    النص: "قصفت قوات الاحتلال المدينة بقوة شديدة"

↓

[4] cleanup → /generate
    ✅ تنظيف تقني
    النص: "قصفت قوات الاحتلال المدينة بقوة شديدة"

↓

[5] formatting → /generate
    ✅ تنسيق للنشر الرقمي
    النص: "قصفت قوات الاحتلال المدينة بقوة شديدة"

↓

النص النهائي: "قصفت قوات الاحتلال المدينة بقوة شديدة"
```

---

## ✅ قائمة التحقق

- [ ] السياسات الـ 10 تستخدم `/generate`
- [ ] السياسة `rewrite` تستخدم `/rewrite`
- [ ] الـ Controller يختار الـ endpoint الصحيح تلقائياً
- [ ] الـ Service يستقبل معامل `endpoint`
- [ ] الـ API URL يتم بناؤه بناءً على الـ endpoint
- [ ] Pipeline يعمل بشكل صحيح مع الـ endpoints المختلفة

---

## 🚀 الخطوات التالية

1. ✅ تحديث الـ Controller لاختيار الـ endpoint الصحيح
2. ✅ تحديث الـ Service لاستقبال معامل `endpoint`
3. ✅ اختبار كل سياسة مع الـ endpoint الصحيح
4. ⏳ توثيق الـ API مع أمثلة عملية
5. ⏳ إضافة اختبارات للتأكد من الاختيار الصحيح

---

## 📝 ملاحظات مهمة

1. **الـ Endpoint الصحيح مهم:** استخدام الـ endpoint الخاطئ قد يؤدي لنتائج غير دقيقة
2. **الـ Task Type هو المفتاح:** يتم الاختيار بناءً على `task_type` من الـ database
3. **الـ Default هو `/generate`:** إذا لم يكن `task_type` معروفاً، يتم استخدام `/generate`
4. **الـ Rewrite متخصص:** يجب استخدام `/rewrite` فقط لسياسة `rewrite`
5. **الـ Summarize مستقبلي:** يمكن إضافة سياسات جديدة تستخدم `/summarize` لاحقاً
