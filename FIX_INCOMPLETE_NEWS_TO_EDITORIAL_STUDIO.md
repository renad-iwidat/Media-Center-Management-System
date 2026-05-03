# إصلاح مشكلة عدم ظهور الأخبار المكتملة في استديو التحرير

## المشكلة
عندما يتم إكمال خبر من الأخبار غير المكتملة (Incomplete) وإرساله لاستديو التحرير، لا يظهر في استديو التحرير (QueueView).

## السبب
1. **الباك إند**: عند إكمال خبر غير مكتمل، يتم تحويل حالته من `incomplete` إلى `in_review` في جدول `editorial_queue`
2. **الفرونت إند**: كان استديو التحرير (QueueView) يستخدم endpoint `/api/flow/queue/pending` الذي يجلب فقط الأخبار بحالة `pending`، ولا يجلب الأخبار بحالة `in_review`

## الحل

### 1. الفرونت إند (Frontend)

#### ملف: `frontend/src/services/api.ts`
- **إضافة endpoint جديد**: `getEditorialStudio` الذي يجلب جميع الأخبار في استديو التحرير (pending + in_review + incomplete)

```typescript
getEditorialStudio: (mediaUnitId?: number | null, status?: string) =>
  request<any>(`/flow/editorial${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}${status ? `${mediaUnitId ? '&' : '?'}status=${status}` : ""}`),
```

#### ملف: `frontend/src/components/news/QueueView.tsx`
- **تغيير**: استبدال `api.getPendingQueue(unitId)` بـ `api.getEditorialStudio(unitId)`

```typescript
// قبل
api.getPendingQueue(unitId).catch(() => ({ data: [] })),

// بعد
api.getEditorialStudio(unitId).catch(() => ({ data: [] })),
```

#### ملف: `frontend/src/components/news/OverviewView.tsx`
- **تغيير**: استبدال `api.getPendingQueue(unitId)` بـ `api.getEditorialStudio(unitId)`

```typescript
// قبل
api.getPendingQueue(unitId).catch(() => null),

// بعد
api.getEditorialStudio(unitId).catch(() => null),
```

### 2. الباك إند (Backend)

#### ملف: `src/controllers/news/data.controller.ts`

**التحسين 1**: عند إنشاء سجلات جديدة في `editorial_queue` (في حالة عدم وجود سجلات incomplete)، يتم إنشاؤها مباشرة بحالة `in_review` بدلاً من `pending`

```typescript
// قبل
INSERT INTO editorial_queue
(media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
VALUES ($1, $2, NULL, 'pending', NOW(), NOW())

// بعد
INSERT INTO editorial_queue
(media_unit_id, raw_data_id, policy_id, status, user_id, task_id, created_at, updated_at)
VALUES ($1, $2, NULL, 'in_review', $3, $4, NOW(), NOW())
```

**التحسين 2**: تحديث جميع السجلات (الموجودة والجديدة) إلى `in_review` بشكل صريح

```typescript
// قبل
UPDATE editorial_queue SET status = 'in_review', user_id = $1, task_id = $2, updated_at = NOW()
WHERE raw_data_id = $3 AND status = 'incomplete'

// بعد
// تحديث كل سجل على حدة من queueRecords
for (const record of queueRecords.rows) {
  await query(
    `UPDATE editorial_queue SET status = 'in_review', user_id = $1, task_id = $2, updated_at = NOW()
     WHERE id = $3`,
    [userId ? parseInt(userId) : null, taskId || null, record.id]
  );
}
```

#### ملف: `src/routes/news/flow.routes.ts`
- **موجود بالفعل**: الـ route `/editorial` موجود ويعمل بشكل صحيح

```typescript
router.get('/editorial', FlowController.getEditorialStudio);
```

#### ملف: `src/controllers/news/flow.controller.ts`
- **موجود بالفعل**: الـ controller `getEditorialStudio` موجود ويعمل بشكل صحيح

```typescript
static async getEditorialStudio(req: Request, res: Response): Promise<void> {
  // يجلب جميع الأخبار في ستوديو التحرير (pending + in_review + incomplete)
  editorialItems = await EditorialQueueService.getAllEditorialItems(mediaUnitId, taskId);
}
```

#### ملف: `src/services/news/editorial-queue.service.ts`
- **موجود بالفعل**: الدالة `getAllEditorialItems` موجودة وتعمل بشكل صحيح

```typescript
async getAllEditorialItems(mediaUnitId?: number, taskId?: number): Promise<QueueItemWithDetails[]> {
  // WHERE eq.status IN ('pending', 'in_review', 'incomplete')
}
```

## النتيجة
الآن عندما يتم إكمال خبر من الأخبار غير المكتملة:
1. يتم تحديث حالته في `editorial_queue` إلى `in_review`
2. يظهر في استديو التحرير (QueueView) لأن الواجهة الأمامية تستخدم `/api/flow/editorial` الذي يجلب جميع الحالات (pending + in_review + incomplete)
3. المحرر يمكنه رؤية الخبر ومراجعته والموافقة عليه أو رفضه

## الفلو الكامل للأخبار غير المكتملة

### الأخبار التحريرية (Editorial Flow)
```
raw_data (is_incomplete=true)
  ↓
[المستخدم يكمل الخبر في IncompleteView]
  ↓
raw_data (is_incomplete=false)
  ↓
editorial_queue (status='in_review')
  ↓
[يظهر في استديو التحرير - QueueView]
  ↓
[المحرر يراجع ويوافق]
  ↓
editorial_queue (status='approved')
  ↓
published_items
```

### الأخبار الأوتوماتيكية (Automated Flow)
```
raw_data (is_incomplete=true)
  ↓
[المستخدم يكمل الخبر في IncompleteView]
  ↓
raw_data (is_incomplete=false)
  ↓
editorial_queue (status='approved') [تلقائياً]
  ↓
published_items [مباشرة]
```

## الملفات المعدلة
1. `frontend/src/services/api.ts` - إضافة `getEditorialStudio`
2. `frontend/src/components/news/QueueView.tsx` - استخدام `getEditorialStudio`
3. `frontend/src/components/news/OverviewView.tsx` - استخدام `getEditorialStudio`
4. `src/controllers/news/data.controller.ts` - تحسين معالجة السجلات في `editorial_queue`

## الاختبار
1. افتح صفحة الأخبار غير المكتملة (Incomplete)
2. اختر خبر وأكمله
3. اضغط "حفظ وإرسال"
4. افتح استديو التحرير (Queue)
5. يجب أن يظهر الخبر المكتمل في القائمة

## ملاحظات
- الـ endpoint القديم `/api/flow/queue/pending` لا يزال موجوداً ويعمل، لكنه يجلب فقط الأخبار بحالة `pending`
- الـ endpoint الجديد `/api/flow/editorial` يجلب جميع الأخبار في استديو التحرير (pending + in_review + incomplete)
- يمكن استخدام parameter `status` لتصفية النتائج حسب الحالة
