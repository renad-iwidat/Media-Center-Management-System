# 🚀 دليل الاختبار الكامل - الـ Flow من السحب للنشر

## 📋 ملخص سريع

هذا الدليل يشرح كيفية اختبار الـ Flow الكامل للأخبار من السحب من المصادر إلى النشر النهائي.

---

## 🎯 الـ Flow الكامل

```
1. السحب من المصادر (RSS Fetcher)
   ↓
2. حفظ في raw_data (fetch_status = 'fetched')
   ↓
3. معالجة وتحديد المسار (Flow Router)
   ├─ أوتوماتيكي → published_items (queue_id = NULL)
   └─ تحريري → editorial_queue (status = 'pending')
   ↓
4. قرار المحرر (Editorial Queue)
   ├─ رفض → بيخلص
   └─ موافقة → published_items (queue_id = X)
   ↓
5. النشر النهائي (Published Items)
```

---

## 📁 الملفات المهمة

### التوثيق
- **`NEWS_FLOW_COMPLETE_GUIDE.md`** - دليل شامل مع شرح تفصيلي
- **`NEWS_FLOW_FILES_SUMMARY.md`** - ملخص الملفات والـ services
- **`TEST_FLOW_CURL_COMMANDS.md`** - أوامر cURL للاختبار

### الاختبارات
- **`TEST_FLOW_COMMANDS.sh`** - Bash script لتشغيل جميع الاختبارات
- **`TEST_FLOW_CURL_COMMANDS.md`** - أوامر cURL منفصلة

### الكود
- `src/services/news/flow-router.service.ts` - توجيه الأخبار
- `src/services/news/editorial-queue.service.ts` - إدارة الطابور
- `src/services/news/published-items.service.ts` - إدارة النشر
- `src/controllers/news/flow.controller.ts` - الـ endpoints
- `src/routes/news/flow.routes.ts` - المسارات

---

## 🧪 كيفية الاختبار

### الطريقة 1: استخدام Bash Script (الأسهل)

```bash
# 1. جعل الـ script قابل للتنفيذ
chmod +x TEST_FLOW_COMMANDS.sh

# 2. تشغيل الاختبارات
./TEST_FLOW_COMMANDS.sh
```

**النتيجة:** سيتم تشغيل جميع الخطوات تلقائياً مع عرض النتائج.

---

### الطريقة 2: استخدام أوامر cURL منفصلة

#### الخطوة 1: سحب الأخبار

```bash
curl -X POST http://localhost:3000/api/rss/fetch \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### الخطوة 2: معالجة الأخبار

```bash
curl -X POST http://localhost:3000/api/flow/process \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### الخطوة 3: جلب الأخبار المعلقة

```bash
curl -X GET http://localhost:3000/api/flow/queue/pending \
  -H "Content-Type: application/json"
```

#### الخطوة 4: موافقة على الخبر

```bash
curl -X POST http://localhost:3000/api/flow/queue/1/approve \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": 1,
    "editorNotes": "تم التحقق"
  }'
```

#### الخطوة 5: جلب الأخبار المنشورة

```bash
curl -X GET http://localhost:3000/api/flow/published \
  -H "Content-Type: application/json"
```

---

## 📊 الـ Endpoints الرئيسية

### معالجة الأخبار

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| POST | `/api/rss/fetch` | سحب الأخبار من المصادر |
| POST | `/api/flow/process` | معالجة الأخبار وتحديد المسار |

### طابور التحرير

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/flow/queue/pending` | جلب الأخبار المعلقة |
| GET | `/api/flow/queue/stats` | إحصائيات الطابور |
| GET | `/api/flow/queue/:id` | جلب خبر واحد |
| POST | `/api/flow/queue/:id/approve` | موافقة على الخبر |
| POST | `/api/flow/queue/:id/reject` | رفض الخبر |

### الأخبار المنشورة

| الطريقة | المسار | الوصف |
|--------|--------|-------|
| GET | `/api/flow/published` | جلب الأخبار المنشورة |
| GET | `/api/flow/published/:id` | جلب خبر منشور واحد |
| GET | `/api/flow/published/category/:category` | جلب حسب الفئة |
| GET | `/api/flow/published/stats` | إحصائيات النشر |

---

## ✅ قائمة التحقق

### قبل الاختبار
- [ ] الـ server يعمل على `http://localhost:3000`
- [ ] الـ database متصل
- [ ] جميع الـ tables موجودة
- [ ] جميع الـ categories لها `flow` محدد
- [ ] جميع الـ media_units نشطة

### أثناء الاختبار
- [ ] الأخبار تُسحب بنجاح
- [ ] الأخبار تُحفظ في `raw_data`
- [ ] الأخبار تُوجّه للمسار الصحيح
- [ ] الأخبار الأوتوماتيكية تنشر مباشرة
- [ ] الأخبار التحريرية تظهر في الطابور
- [ ] المحرر يقدر يوافق أو يرفض
- [ ] الأخبار المعتمدة تنشر
- [ ] الأخبار المرفوضة لا تنشر

### بعد الاختبار
- [ ] الإحصائيات صحيحة
- [ ] جميع الـ endpoints تعمل
- [ ] لا توجد أخطاء في الـ logs

---

## 🔍 استكشاف الأخطاء

### المشكلة: لا توجد أخبار جديدة

**الحل:**
1. تحقق من أن المصادر نشطة: `SELECT * FROM sources WHERE is_active = true`
2. تحقق من أن الـ RSS feeds تحتوي على أخبار جديدة
3. تحقق من أن `fetch_status` في `raw_data` هو `'fetched'`

### المشكلة: الأخبار لا تُوجّه للمسار الصحيح

**الحل:**
1. تحقق من أن الفئات لها `flow` محدد: `SELECT * FROM categories WHERE flow IS NOT NULL`
2. تحقق من أن الأخبار لها `category_id` صحيح
3. تحقق من أن `fetch_status` يتغير إلى `'processed'`

### المشكلة: الأخبار التحريرية لا تظهر في الطابور

**الحل:**
1. تحقق من أن الفئة لها `flow = 'editorial'`
2. تحقق من أن `editorial_queue` يحتوي على السجلات
3. تحقق من أن `status` هو `'pending'`

### المشكلة: الموافقة على الخبر لا تعمل

**الحل:**
1. تحقق من أن `policyId` موجود في `editorial_policies`
2. تحقق من أن `queue_id` صحيح
3. تحقق من أن الخبر ينشر في `published_items`

---

## 📝 ملاحظات مهمة

1. **الـ policyId:** يجب أن يكون موجود في جدول `editorial_policies`
2. **الـ queue_id:** يُستخدم لتتبع الأخبار التي مرت على التحرير
3. **الـ fetch_status:** يتغير من `'fetched'` إلى `'processed'` بعد المعالجة
4. **الـ status:** يتغير من `'pending'` إلى `'in_review'` ثم `'approved'` أو `'rejected'`
5. **الـ flow:** يحدد المسار (`'automated'` أو `'editorial'`)

---

## 🎓 أمثلة عملية

### مثال 1: خبر رياضي (أوتوماتيكي)

```
1. السحب: خبر رياضي جديد
2. الحفظ: raw_data (category_id = 4, fetch_status = 'fetched')
3. المعالجة: categories.flow = 'automated'
4. النتيجة: ينشر مباشرة في published_items (queue_id = NULL)
```

### مثال 2: خبر سياسي (تحريري)

```
1. السحب: خبر سياسي جديد
2. الحفظ: raw_data (category_id = 1, fetch_status = 'fetched')
3. المعالجة: categories.flow = 'editorial'
4. الطابور: editorial_queue (status = 'pending')
5. القرار: المحرر يوافق مع policy_id = 3
6. النتيجة: ينشر في published_items (queue_id = X)
```

---

## 🚀 الخطوات التالية

1. ✅ قراءة هذا الملف
2. ✅ قراءة `NEWS_FLOW_COMPLETE_GUIDE.md`
3. ⏳ تشغيل `TEST_FLOW_COMMANDS.sh`
4. ⏳ اختبار الـ endpoints يدوياً
5. ⏳ التحقق من الـ database
6. ⏳ إضافة error handling أفضل

---

## 📚 المراجع

- **`NEWS_FLOW_COMPLETE_GUIDE.md`** - دليل شامل مع شرح تفصيلي
- **`NEWS_FLOW_FILES_SUMMARY.md`** - ملخص الملفات والـ services
- **`TEST_FLOW_CURL_COMMANDS.md`** - أوامر cURL للاختبار
- **`TEST_FLOW_COMMANDS.sh`** - Bash script للاختبار

---

## 💡 نصائح مفيدة

1. **استخدم `jq` لتنسيق الـ JSON:**
   ```bash
   curl -s http://localhost:3000/api/flow/queue/pending | jq .
   ```

2. **احفظ الـ queue_id للاستخدام لاحقاً:**
   ```bash
   QUEUE_ID=$(curl -s http://localhost:3000/api/flow/queue/pending | jq -r '.data[0].id')
   ```

3. **استخدم `grep` للبحث عن الأخطاء:**
   ```bash
   ./TEST_FLOW_COMMANDS.sh | grep -i error
   ```

4. **استخدم `watch` لمراقبة التغييرات:**
   ```bash
   watch -n 1 'curl -s http://localhost:3000/api/flow/queue/stats | jq .'
   ```

---

## ❓ أسئلة شائعة

**س: كم وقت يستغرق الاختبار الكامل؟**
ج: حوالي 5-10 دقائق حسب عدد الأخبار.

**س: هل يمكن اختبار الـ flow بدون أخبار حقيقية؟**
ج: نعم، يمكنك إدراج أخبار تجريبية في `raw_data` يدوياً.

**س: ماذا لو فشل الاختبار؟**
ج: تحقق من الـ logs وقائمة استكشاف الأخطاء أعلاه.

**س: هل يمكن تشغيل الاختبارات بشكل متكرر؟**
ج: نعم، لكن تأكد من حذف الأخبار القديمة أولاً.

---

## 📞 الدعم

إذا واجهت أي مشاكل:

1. اقرأ `NEWS_FLOW_COMPLETE_GUIDE.md`
2. تحقق من قائمة استكشاف الأخطاء
3. تحقق من الـ logs
4. تحقق من الـ database

---

**آخر تحديث:** 2024-04-14
**الإصدار:** 1.0.0
