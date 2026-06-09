# ✅ إصلاح قسم النشر - مشكلة عدم ظهور الأخبار المرشحة للنشر

## 🔴 المشكلة

قسم النشر (Publishing View) كان **لا يعرض الأخبار المرشحة للنشر** (الأخبار التحريرية التي وافق عليها المحرر). بدلاً من ذلك، كان يجلب الأخبار **المنشورة بالفعل** من جدول `published_items`.

### الخطأ المنطقي:

```
❌ الوضع القديم:
قسم النشر → api.getPublished(unitId) 
         → جدول published_items
         → الأخبار المنشورة بالفعل ✗
```

## ✅ الحل

### الوضع الجديد:

```
✅ الوضع الصحيح:
قسم النشر → api.getReadyToPublish(unitId)
         → جدول editorial_queue (status = 'approved')
         → الأخبار المرشحة للنشر ✓
```

---

## 📝 التعديلات المنفذة

### 1️⃣ Backend - Endpoint جديد

**الملف**: `src/controllers/news/flow.controller.ts`

```typescript
/**
 * GET /api/flow/ready-to-publish
 * جلب الأخبار المرشحة للنشر (المعتمدة من المحرر - approved)
 */
static async getReadyToPublish(req: Request, res: Response): Promise<void>
```

**الشروط**:
- تأخذ `media_unit_id` (إلزامي)
- تُرجع أخبار من `editorial_queue` مع `status = 'approved'`
- تصفية حسب `flow_type = 'editorial'`

---

### 2️⃣ Backend - Datalayer

**الملف**: `src/services/news/published-items.service.ts`

```typescript
async getReadyToPublish(
  mediaUnitId: number,
  limit: number = 50
): Promise<PublishedItemWithDetails[]>
```

**الـ Query**:
```sql
SELECT ... 
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
LEFT JOIN categories c ON rd.category_id = c.id
WHERE eq.status = 'approved'
  AND eq.media_unit_id = $1
  AND c.flow = 'editorial'
  AND publish_status != 'archived'
```

**الفرق عن `getPublishedByMediaUnit`**:
- `getReadyToPublish`: يجلب من `editorial_queue` (المعتمدة بانتظار النشر)
- `getPublishedByMediaUnit`: يجلب من `published_items` (المنشورة بالفعل)

---

### 3️⃣ Routes - إضافة Route جديد

**الملف**: `src/routes/news/flow.routes.ts`

```typescript
// المحتوى المرشح للنشر (معتمد من المحرر - approved)
router.get('/ready-to-publish', FlowController.getReadyToPublish);

// المحتوى المنشور (المنشور بالفعل)
router.get('/published', FlowController.getPublished);
```

---

### 4️⃣ Frontend - API Client

**الملف**: `frontend/src/services/api.ts`

```typescript
getReadyToPublish: (mediaUnitId?: number | null) =>
  request<any>(`/flow/ready-to-publish${mediaUnitId ? `?media_unit_id=${mediaUnitId}` : ""}`),
```

---

### 5️⃣ Frontend - Component

**الملف**: `frontend/src/components/news/PublishedView.tsx`

#### قبل:
```typescript
const loadData = useCallback(() => {
  api.getPublished(unitId)  // ❌ خطأ - يجلب المنشورة
    .then((res) => {
      const editorialOnlyItems = allItems.filter((item: any) => {
        return item.flow_type === 'editorial';  // تصفية يدوية ❌
      });
      setItems(editorialOnlyItems);
    })
}, [unitId]);
```

#### بعد:
```typescript
const loadData = useCallback(() => {
  api.getReadyToPublish(unitId)  // ✅ يجلب المرشحة للنشر مباشرة
    .then((res) => {
      const allItems = res.data || [];
      // الأخبار هنا بالفعل مصفاة من الـ Backend ✓
      setItems(allItems);
    })
}, [unitId]);
```

---

## 🎯 تدفق العمل الصحيح

```
1️⃣ مصدر الخبر (Source)
   ↓
2️⃣ تحميل الخبر (raw_data)
   ↓
3️⃣ توزيع على وحدات الإعلام (editorial_queue)
   ↓
4️⃣ مراجعة المحرر
   ↓
   ├─ ❌ رفض → status = 'rejected'
   └─ ✅ موافقة → status = 'approved'
      ↓
5️⃣ قسم النشر (PublishedView)
   ← جلب الأخبار (status = 'approved')
   ← عرض مرشحة للنشر ✓
   ↓
6️⃣ نشر يدوي على المواقع الخارجية
   ↓
7️⃣ أرشيف (published_items)
   ← تسجيل الأخبار المنشورة ✓
```

---

## 🔄 الفرق بين الـ Views

### Editorial Studio (ستوديو التحرير)
- يجلب: `editorial_queue` مع `status IN ('pending', 'in_review', 'incomplete')`
- الغرض: مراجعة الأخبار وتحريرها وموافقة/رفض المحرر

### Publishing View (قسم النشر) ⭐
- يجلب: `editorial_queue` مع `status = 'approved'` **فقط**
- الغرض: نشر الأخبار المعتمدة على المواقع الخارجية

### Published Items (الأخبار المنشورة)
- يجلب: `published_items` مع `is_active = true`
- الغرض: عرض الأخبار المنشورة بالفعل على المواقع

---

## 📊 البيانات المُرجعة

```typescript
interface ReadyToPublish {
  id: number;                    // queue_id
  raw_data_id: number;
  title: string;
  content: string;
  image_url: string;
  category_name: string;
  media_unit_name: string;
  flow_type: 'editorial';        // نوع الفلو
  published_platforms: Array<{   // القنوات المنشورة عليها بالفعل
    platform: 'external_website' | 'facebook' | 'instagram' | 'twitter';
    name: string;
    status: 'success' | 'pending' | 'failed';
  }>;
  is_published_external: boolean; // منشور على موقع خارجي؟
  is_published_social: boolean;   // منشور على سوشال؟
}
```

---

## 🧪 الاختبار

### 1️⃣ تشغيل Backend

```bash
npm run dev
```

### 2️⃣ اختبار الـ API

```bash
# جلب الأخبار المرشحة للنشر من وحدة إعلامية
curl -X GET "http://localhost:5000/api/flow/ready-to-publish?media_unit_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3️⃣ الشروط المتوقعة

```
✅ الخبر يظهر في قسم النشر إذا:
  1. status = 'approved' في جدول editorial_queue
  2. flow_type = 'editorial' في categories
  3. publish_status != 'archived' في raw_data
  4. وحدة الإعلام = المحددة في الطلب
  5. content.length >= 300 حرف
  6. image_url موجودة

❌ لا يظهر إذا:
  1. status != 'approved' (مثل pending أو rejected)
  2. flow_type = 'automated'
  3. publish_status = 'archived'
  4. وحدة إعلامية مختلفة
```

---

## 🚀 الفوائد

### ✅ قبل الإصلاح ❌
- عدم ظهور الأخبار المرشحة للنشر
- تصفية يدوية غير موثوقة
- تأخير في عملية النشر

### ✅ بعد الإصلاح ✅
- ظهور صحيح للأخبار المرشحة للنشر
- تصفية من الـ Backend (موثوق)
- عملية نشر سلسة وفعالة

---

## 📋 Checklist

- [x] إضافة `getReadyToPublish` في Service
- [x] إضافة `getReadyToPublish` في Controller
- [x] إضافة Route `/flow/ready-to-publish`
- [x] إضافة دالة API في Frontend
- [x] تحديث `PublishedView.tsx`
- [x] اختبار البناء (build test) ✅

---

## 🔗 الملفات المعدلة

1. `src/services/news/published-items.service.ts` — إضافة دالة Service
2. `src/controllers/news/flow.controller.ts` — إضافة Controller
3. `src/routes/news/flow.routes.ts` — إضافة Route
4. `frontend/src/services/api.ts` — إضافة API client
5. `frontend/src/components/news/PublishedView.tsx` — تحديث Component

---

**تاريخ التعديل**: يونيو 2026  
**الحالة**: ✅ مطبق وتم التحقق  
**ملاحظات**: جميع الاختبارات نجحت، الكود يتم تجميعه بدون أخطاء
