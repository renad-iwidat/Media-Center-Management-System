# تنفيذ ربط نظام الإدارة ونظام الأخبار

## ملخص التعديلات المنجزة

### 1. إضافة المصادقة على جميع routes نظام الأخبار ✅

تم إضافة `router.use(authenticate)` على جميع ملفات routes:

- ✅ `src/routes/news/flow.routes.ts`
- ✅ `src/routes/news/data.routes.ts`
- ✅ `src/routes/news/editorial-policy.routes.ts`
- ✅ `src/routes/news/news.routes.ts`
- ✅ `src/routes/news/scheduler.routes.ts`
- ✅ `src/routes/news/system-settings.routes.ts`
- ✅ `src/routes/ai-hub/chat.routes.ts`
- ✅ `src/routes/ai-hub/ideas.routes.ts`
- ✅ `src/routes/ai-hub/stt.routes.ts`
- ✅ `src/routes/ai-hub/tts.routes.ts`
- ✅ `src/routes/ai-hub/audio-extraction.routes.ts`
- ✅ `src/routes/ai-hub/video-to-text.routes.ts`
- ✅ `src/routes/ai-hub/analytics.routes.ts`

### 2. إضافة أعمدة تتبع المستخدمين ✅

تم إنشاء ملف SQL: `sql/add_user_tracking_columns.sql`

**الأعمدة المضافة:**
- `editorial_queue.task_id` - معرف المهمة من نظام الإدارة
- `editorial_queue.user_id` - معرف المستخدم الذي عدل الخبر
- `published_items.task_id` - معرف المهمة من نظام الإدارة
- `published_items.approved_by` - معرف المستخدم الذي وافق على النشر

**ملاحظة**: يتم استخدام `ai_usage_logs.user_identifier` الموجود أصلاً لحفظ رقم المستخدم مباشرة

### 3. تعديل Controllers لحفظ رقم المستخدم ✅

#### Flow Controller:
- ✅ `approveQueueItem` - يحفظ رقم المستخدم في `published_items.approved_by`
- ✅ `rejectQueueItem` - يحفظ رقم المستخدم في `editorial_queue.user_id`

#### Data Controller:
- ✅ `updateArticleContent` - يحفظ رقم المستخدم عند تحديث المحتوى

#### Editorial Policy Controller:
- ✅ `applyPolicy` - يمرر رقم المستخدم لتسجيل استخدام الذكاء الاصطناعي
- ✅ `applyPoliciesSequential` - يمرر رقم المستخدم لتسجيل استخدام الذكاء الاصطناعي

### 4. تعديل Services لدعم رقم المستخدم ✅

#### Editorial Queue Service:
- ✅ `approveItem` - يحفظ رقم المستخدم والمهمة
- ✅ `rejectItem` - يحفظ رقم المستخدم والمهمة
- ✅ `publishApprovedItem` - يحفظ رقم المستخدم في المنشورات

#### AI Usage Logger Service:
- ✅ تعديل `logAIUsage` لحفظ رقم المستخدم في `user_identifier`

#### Editorial Policy Service:
- ✅ تعديل `applyPolicy` لتسجيل استخدام الذكاء الاصطناعي مع رقم المستخدم

### 5. تعديل Middleware ✅

#### AI Usage Logger Middleware:
- ✅ تعديل لاستخراج رقم المستخدم من التوكن وحفظه مباشرة في `user_identifier`

### 6. إنشاء نقاط وصول للتكامل مع نظام الإدارة ✅

#### Controllers:
- ✅ `src/controllers/management/news-integration.controller.ts` - إحصائيات وتقارير

#### Routes:
- ✅ `src/routes/management/news-integration.routes.ts` - مسارات الإحصائيات

## خطوات التطبيق

### 1. تشغيل ملف SQL

```bash
# تشغيل ملف إضافة الأعمدة الأساسية
psql $DATABASE_URL -f sql/add_user_tracking_columns.sql
```

### 2. إضافة routes الجديدة للتطبيق الرئيسي

في ملف `src/index.ts` أو ملف routes الرئيسي:

```typescript
import newsIntegrationRoutes from './routes/management/news-integration.routes';

// إضافة المسارات
app.use('/api/management/news', newsIntegrationRoutes);
```

### 3. إعادة تشغيل الخادم

```bash
npm run dev
# أو
npm start
```

## نقاط الوصول الجديدة

### التكامل مع نظام الإدارة

#### جلب إحصائيات موظف
```http
GET /api/management/news/stats/user/456?days=30
Authorization: Bearer JWT_TOKEN
```

#### جلب إحصائيات عامة
```http
GET /api/management/news/stats/overview?days=30
Authorization: Bearer JWT_TOKEN
```

#### جلب عناصر مهمة
```http
GET /api/management/news/tasks/123/items
Authorization: Bearer JWT_TOKEN
```

## الوظائف الجديدة

### 1. تتبع المستخدمين في العمليات

- **الموافقة على الأخبار**: يتم حفظ رقم المستخدم الذي وافق
- **رفض الأخبار**: يتم حفظ رقم المستخدم الذي رفض
- **تحديث المحتوى**: يتم حفظ رقم المستخدم الذي عدل
- **استخدام الذكاء الاصطناعي**: يتم حفظ رقم المستخدم مع كل استخدام

### 2. ربط المهام

يمكن الآن تمرير `taskId` في الطلبات لربط العمليات بمهام نظام الإدارة:

```json
{
  "content": "محتوى الخبر المحدث",
  "taskId": 123
}
```

### 3. تسجيل شامل لاستخدام الذكاء الاصطناعي

جميع استخدامات الذكاء الاصطناعي تُسجل الآن مع:
- رقم المستخدم (في `user_identifier` مباشرة)
- نوع العملية
- وقت التنفيذ
- حالة النجاح/الفشل

**ملاحظة**: يتم استخدام حقل `user_identifier` الموجود أصلاً لحفظ رقم المستخدم مباشرة بدلاً من IP address.

## الصلاحيات المطلوبة

يجب إضافة الصلاحيات التالية لنظام الإدارة:

```sql
INSERT INTO permissions (name, description) VALUES
('view_news_stats', 'عرض إحصائيات الأخبار'),
('view_employee_stats', 'عرض إحصائيات الموظفين'),
('view_task_details', 'عرض تفاصيل المهام');
```

## ملاحظات مهمة

1. **التوافق مع الإصدارات السابقة**: جميع الأعمدة الجديدة تقبل `NULL` لضمان عدم كسر البيانات الموجودة

2. **الأمان**: جميع routes محمية الآن بالمصادقة، تأكد من تحديث Frontend لإرسال التوكن

3. **الأداء**: تم إضافة فهارس على الأعمدة الجديدة لتحسين الأداء

4. **التسجيل**: جميع العمليات تُسجل الآن مع معلومات المستخدم للمراجعة والتدقيق

## اختبار التكامل

### 1. اختبار المصادقة
```bash
# بدون توكن - يجب أن يفشل
curl http://localhost:4000/api/news/flow/queue/pending

# مع توكن - يجب أن ينجح
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/news/flow/queue/pending
```

### 2. اختبار تتبع المستخدمين
```bash
# الموافقة على خبر مع تمرير taskId
curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"taskId": 123, "editorNotes": "تم المراجعة"}' \
     http://localhost:4000/api/flow/queue/1/approve
```

### 3. اختبار التكامل
```bash
# جلب إحصائيات موظف
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/management/news/stats/user/123

# جلب إحصائيات عامة
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/management/news/stats/overview

# جلب عناصر مهمة
curl -H "Authorization: Bearer $JWT_TOKEN" \
     http://localhost:4000/api/management/news/tasks/123/items
```

### 4. اختبار تسجيل الذكاء الاصطناعي
```bash
# استخدام الدردشة
curl -X POST \
     -H "Authorization: Bearer $JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"prompt": "اكتب خبر عن التكنولوجيا"}' \
     http://localhost:4000/api/ai-hub/chat/generate
```

## استعلامات مفيدة

### جلب إحصائيات الموظف
```sql
-- إحصائيات الموافقة على الأخبار
SELECT approved_by, COUNT(*) as approved_count
FROM published_items 
WHERE approved_by IS NOT NULL
GROUP BY approved_by;

-- إحصائيات استخدام الذكاء الاصطناعي
SELECT 
  user_identifier,
  feature,
  COUNT(*) as usage_count
FROM ai_usage_logs 
WHERE user_identifier ~ '^[0-9]+$'
GROUP BY user_identifier, feature;
```

### جلب أنشطة مهمة معينة
```sql
-- المنشورات المرتبطة بمهمة
SELECT * FROM published_items WHERE task_id = 123;

-- عناصر الطابور المرتبطة بمهمة
SELECT * FROM editorial_queue WHERE task_id = 123;

-- استخدام الذكاء الاصطناعي للمستخدمين المرتبطين بالمهمة
SELECT ai.* FROM ai_usage_logs ai
WHERE ai.user_identifier IN (
  SELECT DISTINCT CAST(approved_by AS TEXT) FROM published_items WHERE task_id = 123
  UNION
  SELECT DISTINCT CAST(user_id AS TEXT) FROM editorial_queue WHERE task_id = 123
);
```

## الحالة: جاهز للاختبار والتطبيق ✅

تم تنفيذ التعديلات الأساسية بنجاح:

1. ✅ **المصادقة الشاملة** - جميع endpoints محمية
2. ✅ **تتبع المستخدمين** - كل عملية مربوطة بموظف
3. ✅ **ربط المهام** - المنشورات مربوطة بمهام نظام الإدارة
4. ✅ **تسجيل استخدام الذكاء الاصطناعي** - تتبع شامل للاستخدام
5. ✅ **نقاط وصول الإحصائيات** - واجهة برمجية للتقارير والإحصائيات

النظام جاهز الآن للاستخدام مع تتبع شامل للمستخدمين والمهام!