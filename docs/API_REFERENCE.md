
# API Reference — Media Center Management System

**Base URL:** `http://localhost:3000`  
**Content-Type:** `application/json`

---

## فهرس الـ Endpoints

| # | Method | Endpoint | الوصف |
|---|--------|----------|-------|
| 1 | GET | `/api/sources` | جميع المصادر |
| 2 | GET | `/api/sources/active` | المصادر النشطة |
| 3 | GET | `/api/sources/:id` | مصدر بالـ ID |
| 4 | POST | `/api/sources` | إنشاء مصدر |
| 5 | PUT | `/api/sources/:id` | تحديث مصدر |
| 6 | GET | `/api/news` | جميع الأخبار الخام |
| 7 | GET | `/api/news/:id` | خبر بالـ ID |
| 8 | GET | `/api/news/source/:sourceId` | أخبار مصدر معين |
| 9 | POST | `/api/news` | إنشاء خبر |
| 10 | GET | `/api/news/classifier/unclassified` | أخبار بدون تصنيف |
| 11 | POST | `/api/news/classifier/process` | تشغيل التصنيف الآلي |
| 12 | GET | `/api/data/sources` | جميع المصادر (data) |
| 13 | GET | `/api/data/sources/active` | المصادر النشطة (data) |
| 14 | GET | `/api/data/articles` | جميع الأخبار مع pagination |
| 15 | GET | `/api/data/articles/:id/detail` | خبر واحد بالتفاصيل |
| 16 | GET | `/api/data/articles/source/:sourceId` | أخبار مصدر |
| 17 | GET | `/api/data/articles/category/:categoryId` | أخبار تصنيف |
| 18 | GET | `/api/data/articles/incomplete` | الأخبار الناقصة |
| 19 | PUT | `/api/data/articles/:id/content` | تحديث محتوى خبر |
| 20 | DELETE | `/api/data/articles/:id` | حذف خبر |
| 21 | GET | `/api/data/categories` | جميع التصنيفات |
| 22 | GET | `/api/data/media-units` | وحدات الإعلام |
| 23 | GET | `/api/data/comprehensive` | بيانات شاملة |
| 24 | GET | `/api/data/statistics` | إحصائيات النظام |
| 25 | POST | `/api/flow/process` | تشغيل فلو التوجيه |
| 26 | GET | `/api/flow/queue/pending` | الطابور المعلق |
| 27 | GET | `/api/flow/queue/stats` | إحصائيات الطابور |
| 28 | GET | `/api/flow/queue/:id` | عنصر من الطابور |
| 29 | POST | `/api/flow/queue/:id/approve` | موافقة على خبر |
| 30 | POST | `/api/flow/queue/:id/reject` | رفض خبر |
| 31 | GET | `/api/flow/published` | المحتوى المنشور |
| 32 | GET | `/api/flow/published/stats` | إحصائيات المنشور |
| 33 | GET | `/api/flow/published/:id` | منشور واحد |
| 34 | GET | `/api/flow/published/category/:category` | منشور حسب الفئة |
| 35 | GET | `/api/flow/daily-stats` | إحصائيات يومية |
| 36 | GET | `/api/news/editorial-policies` | جميع السياسات |
| 37 | POST | `/api/news/editorial-policies` | إنشاء سياسة |
| 38 | GET | `/api/news/editorial-policies/:policyName` | تفاصيل سياسة |
| 39 | PUT | `/api/news/editorial-policies/:policyName` | تحديث سياسة |
| 40 | DELETE | `/api/news/editorial-policies/:policyName` | حذف سياسة |
| 41 | POST | `/api/news/editorial-policies/apply` | تطبيق سياسة واحدة |
| 42 | POST | `/api/news/editorial-policies/sequential` | تطبيق متسلسل |
| 43 | POST | `/api/news/editorial-policies/pipeline` | pipeline للفرونت |
| 44 | POST | `/api/news/editorial-policies/save-edited` | حفظ النص المعدّل |
| 45 | GET | `/api/settings` | جميع إعدادات النظام |
| 46 | GET | `/api/settings/toggles` | حالة الـ toggles |
| 47 | PATCH | `/api/settings/:key` | تحديث إعداد واحد |
| 48 | PATCH | `/api/settings/toggles/bulk` | تحديث دفعة |

---

## 1. Sources — المصادر

### GET `/api/sources`
جلب جميع مصادر الأخبار.

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 1,
      "name": "وكالة وفا",
      "url": "https://wafa.ps/ar/rss",
      "source_type_id": 1,
      "is_active": true,
      "default_category_id": 1,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/sources/active`
جلب المصادر النشطة فقط (`is_active = true`).

**Request:** لا يوجد body

**Response 200:** نفس شكل `/api/sources` لكن فلترة للنشطة فقط.

---

### GET `/api/sources/:id`
جلب مصدر واحد بالـ ID.

**Params:** `id` — رقم المصدر

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "وكالة وفا",
    "url": "https://wafa.ps/ar/rss",
    "source_type_id": 1,
    "is_active": true,
    "default_category_id": 1,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Response 404:**
```json
{ "success": false, "error": "Source not found" }
```

---

### POST `/api/sources`
إنشاء مصدر جديد.

**Request Body:**
```json
{
  "source_type_id": 1,
  "url": "https://example.com/rss",
  "name": "اسم المصدر",
  "is_active": true
}
```
> `source_type_id`, `url`, `name` — مطلوبة. `is_active` — اختياري (افتراضي: `true`).

**Response 201:**
```json
{
  "success": true,
  "message": "Source created successfully",
  "data": {
    "id": 10,
    "name": "اسم المصدر",
    "url": "https://example.com/rss",
    "source_type_id": 1,
    "is_active": true,
    "default_category_id": null,
    "created_at": "2024-01-15T10:00:00.000Z"
  }
}
```

**Response 400:**
```json
{ "success": false, "error": "Missing required fields" }
```

---

### PUT `/api/sources/:id`
تحديث بيانات مصدر.

**Params:** `id` — رقم المصدر

**Request Body** (كل الحقول اختيارية):
```json
{
  "name": "اسم جديد",
  "url": "https://new-url.com/rss",
  "is_active": false
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Source updated successfully",
  "data": { "id": 1, "name": "اسم جديد", "is_active": false }
}
```

---

## 2. News — الأخبار الخام

### GET `/api/news`
جلب جميع الأخبار الخام من `raw_data`.

**Request:** لا يوجد

**Response 200:**
```json
{
  "success": true,
  "count": 150,
  "data": [
    {
      "id": 1,
      "source_id": 2,
      "source_type_id": 1,
      "category_id": 3,
      "url": "https://example.com/article/1",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر...",
      "image_url": "https://example.com/img.jpg",
      "tags": ["سياسة", "فلسطين"],
      "fetch_status": "fetched",
      "fetched_at": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### GET `/api/news/:id`
جلب خبر واحد بالـ ID.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "...", "content": "..." }
}
```

**Response 404:**
```json
{ "success": false, "error": "News not found" }
```

---

### GET `/api/news/source/:sourceId`
جلب جميع أخبار مصدر معين.

**Params:** `sourceId`

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [ ... ]
}
```

---

### POST `/api/news`
إضافة خبر يدوياً.

**Request Body:**
```json
{
  "source_id": 1,
  "source_type_id": 1,
  "category_id": 3,
  "url": "https://example.com/article",
  "title": "عنوان الخبر",
  "content": "محتوى الخبر",
  "image_url": "https://example.com/img.jpg",
  "tags": ["tag1"],
  "fetch_status": "fetched"
}
```
> `source_id`, `title`, `content` — مطلوبة.

**Response 201:**
```json
{
  "success": true,
  "message": "News created successfully",
  "data": { "id": 55, "title": "عنوان الخبر", ... }
}
```

---

### GET `/api/news/classifier/unclassified`
جلب الأخبار التي لا تملك `category_id`.

**Response 200:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    { "id": 5, "title": "خبر بدون تصنيف", "content": "..." }
  ]
}
```

---

### POST `/api/news/classifier/process`
تشغيل التصنيف الآلي بالـ AI على الأخبار بدون تصنيف.

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalUnclassified": 12,
    "processedCount": 10,
    "failedCount": 2,
    "details": [
      {
        "id": 5,
        "title": "عنوان الخبر",
        "category": "محلي",
        "categoryId": 1,
        "success": true
      },
      {
        "id": 8,
        "title": "خبر فشل",
        "category": "محلي",
        "categoryId": 1,
        "success": false,
        "error": "timeout"
      }
    ]
  }
}
```

---

## 3. Data — البيانات والإحصائيات

### GET `/api/data/sources`
نفس `/api/sources` — جلب جميع المصادر.

### GET `/api/data/sources/active`
نفس `/api/sources/active` — المصادر النشطة.

---

### GET `/api/data/articles`
جلب الأخبار مع دعم الـ pagination.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `limit` | number | 100 | عدد النتائج |
| `offset` | number | 0 | نقطة البداية |

**Response 200:**
```json
{
  "success": true,
  "total": 500,
  "count": 100,
  "limit": 100,
  "offset": 0,
  "data": [ ... ]
}
```

---

### GET `/api/data/articles/:id/detail`
جلب خبر واحد مع اسم المصدر والفئة.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "عنوان",
    "content": "محتوى",
    "url": "https://...",
    "image_url": "https://...",
    "fetch_status": "fetched",
    "fetched_at": "2024-01-15T10:00:00.000Z",
    "category_id": 3,
    "category_name": "محلي",
    "source_name": "وكالة وفا"
  }
}
```

---

### GET `/api/data/articles/source/:sourceId`
أخبار مصدر معين.

**Params:** `sourceId`

**Response 200:**
```json
{ "success": true, "count": 30, "data": [ ... ] }
```

---

### GET `/api/data/articles/category/:categoryId`
أخبار تصنيف معين.

**Params:** `categoryId`

**Response 200:**
```json
{ "success": true, "count": 45, "data": [ ... ] }
```

---

### GET `/api/data/articles/incomplete`
الأخبار ذات المحتوى الناقص (أقل من 300 حرف).

**ملاحظة مهمة:**
- الأخبار الناقصة تبقى في `raw_data` فقط ولا تدخل الفلو
- لا تنتقل لـ `editorial_queue` إلا عندما يوافق المحرر عليها ويكملها
- يتم تتبعها عبر flag `is_incomplete = true`

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `max_length` | number | 150 الحد الأقصى لطول المحتوى (للمرجعية فقط) |
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |

**Response 200:**
```json
{
  "success": true,
  "count": 8,
  "maxLength": 150;
  "data": [
    {
      "id": 12,
      "title": "خبر ناقص",
      "content": "نص قصير جداً",
      "url": "https://...",
      "fetch_status": "fetched",
      "is_incomplete": true,
      "category_name": "محلي",
      "source_name": "وفا",
      "media_unit_name": null
    }
  ]
}
```

---

### PUT `/api/data/articles/:id/content`
تحديث محتوى خبر ناقص وإرساله لطابور التحرير.

**Params:** `id`

**Request Body:**
```json
{
  "content": "المحتوى الجديد الكامل",
  "title": "عنوان محدّث (اختياري)",
  "imageUrl": "https://example.com/img.jpg (اختياري)",
  "sendToQueue": true
}
```
> `content` — مطلوب. `sendToQueue` — افتراضي `true` (يرسل للطابور). لو `false` يحفظ فقط.

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث الخبر وإرساله لستوديو التحرير",
  "data": {
    "id": 12,
    "title": "عنوان محدّث",
    "content": "المحتوى الجديد",
    "fetch_status": "processed"
  }
}
```

---

### DELETE `/api/data/articles/:id`
حذف خبر من `raw_data` (يحذف من `editorial_queue` أيضاً إن وجد).

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "message": "تم حذف الخبر بنجاح",
  "data": { "id": 12 }
}
```

**Response 404:**
```json
{ "success": false, "message": "الخبر غير موجود" }
```

---

### GET `/api/data/categories`
جلب جميع التصنيفات النشطة.

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    { "id": 1, "name": "محلي", "slug": "local", "flow": "editorial", "is_active": true },
    { "id": 2, "name": "دولي", "slug": "international", "flow": "automated", "is_active": true }
  ]
}
```

---

### GET `/api/data/media-units`
جلب وحدات الإعلام النشطة.

**Response 200:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "id": 1, "name": "القناة الرئيسية", "is_active": true },
    { "id": 2, "name": "الموقع الإلكتروني", "is_active": true }
  ]
}
```

---

### GET `/api/data/comprehensive`
جلب كل البيانات دفعة واحدة (مصادر + أخبار + تصنيفات).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sources": { "count": 5, "items": [ ... ] },
    "articles": { "count": 500, "items": [ ... ] },
    "categories": { "count": 10, "items": [ ... ] }
  }
}
```

---

### GET `/api/data/statistics`
إحصائيات عامة عن النظام.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalSources": 5,
    "activeSources": 4,
    "totalArticles": 500,
    "totalCategories": 10,
    "articlesByCategory": { "1": 120, "2": 80, "3": 50 },
    "articlesBySource": { "1": 200, "2": 150 }
  }
}
```

---

## 4. Flow — فلو معالجة الأخبار

### POST `/api/flow/process`
تشغيل فلو التوجيه — يأخذ الأخبار بحالة `fetched` ويوجّهها لـ `published_items` أو `editorial_queue`.

**Request:** لا يوجد body

**Response 200:**
```json
{
  "success": true,
  "message": "تمت معالجة 15 خبر بنجاح | تم تخطي 3 خبر ناقص",
  "data": {
    "processedCount": 15,
    "automatedCount": 8,
    "editorialCount": 7,
    "errors": []
  }
}
```

---

### GET `/api/flow/queue/pending`
جلب الأخبار المعلقة في طابور التحرير.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `media_unit_id` | number | فلترة حسب وحدة الإعلام (اختياري) |

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "id": 10,
      "media_unit_id": 1,
      "raw_data_id": 55,
      "policy_id": null,
      "status": "pending",
      "editor_notes": null,
      "created_at": "2024-01-15T10:00:00.000Z",
      "updated_at": "2024-01-15T10:00:00.000Z",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر...",
      "image_url": "https://...",
      "url": "https://...",
      "category_name": "محلي",
      "media_unit_name": "القناة الرئيسية",
      "source_name": "وكالة وفا"
    }
  ]
}
```

---

### GET `/api/flow/queue/stats`
إحصائيات الطابور لكل وحدة إعلام.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "القناة الرئيسية",
      "pending_count": 5,
      "in_review_count": 2,
      "approved_count": 10,
      "rejected_count": 3
    }
  ]
}
```

---

### GET `/api/flow/queue/:id`
جلب عنصر واحد من الطابور بالتفاصيل.

**Params:** `id` — رقم العنصر في الطابور

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "status": "pending",
    "title": "عنوان الخبر",
    "content": "محتوى...",
    "category_name": "محلي",
    "media_unit_name": "القناة الرئيسية",
    "source_name": "وفا"
  }
}
```

**Response 404:**
```json
{ "success": false, "message": "العنصر غير موجود" }
```

---

### POST `/api/flow/queue/:id/approve`
موافقة المحرر على خبر ونشره في `published_items`.

**Params:** `id` — رقم العنصر في الطابور

**Request Body:**
```json
{
  "policyId": 3,
  "editorNotes": "تمت المراجعة والموافقة",
  "finalTitle": "عنوان معدّل (اختياري)",
  "finalContent": "محتوى معدّل بعد تطبيق السياسات (اختياري)",
  "finalImageUrl": "https://example.com/img.jpg (اختياري)"
}
```
> كل الحقول اختيارية. لو لم يُرسل `finalContent` يُنشر المحتوى الأصلي.

**Response 200:**
```json
{
  "success": true,
  "message": "تمت الموافقة على الخبر ونشره بنجاح",
  "data": { "queueId": 10 }
}
```

---

### POST `/api/flow/queue/:id/reject`
رفض خبر من الطابور.

**Params:** `id`

**Request Body:**
```json
{
  "editorNotes": "سبب الرفض (اختياري)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم رفض الخبر بنجاح",
  "data": { "queueId": 10 }
}
```

---

### GET `/api/flow/published`
جلب المحتوى المنشور.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `limit` | number | 50 | عدد النتائج |
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |

**Response 200:**
```json
{
  "success": true,
  "count": 20,
  "data": [
    {
      "id": 1,
      "media_unit_id": 1,
      "raw_data_id": 55,
      "queue_id": 10,
      "content_type_id": 1,
      "title": "عنوان المنشور",
      "content": "محتوى...",
      "tags": ["tag1"],
      "is_active": true,
      "published_at": "2024-01-15T12:00:00.000Z",
      "flow_type": "editorial",
      "category_name": "محلي",
      "media_unit_name": "القناة الرئيسية",
      "tag_names": ["سياسة"]
    }
  ]
}
```

---

### GET `/api/flow/published/stats`
إحصائيات المحتوى المنشور.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total_published": 150,
    "automated_count": 80,
    "editorial_count": 70,
    "by_category": [
      { "category": "محلي", "count": 60 },
      { "category": "دولي", "count": 40 }
    ],
    "by_media_unit": [
      { "media_unit": "القناة الرئيسية", "count": 100 },
      { "media_unit": "الموقع الإلكتروني", "count": 50 }
    ]
  }
}
```

---

### GET `/api/flow/published/:id`
جلب منشور واحد بالـ ID.

**Params:** `id`

**Response 200:**
```json
{
  "success": true,
  "data": { "id": 1, "title": "...", "content": "...", "published_at": "..." }
}
```

---

### GET `/api/flow/published/category/:category`
جلب المنشورات حسب اسم الفئة.

**Params:** `category` — اسم الفئة (مثال: `محلي`)

**Query Params:** `limit` (افتراضي: 50)

**Response 200:**
```json
{
  "success": true,
  "count": 30,
  "data": [ ... ]
}
```

---

### GET `/api/flow/daily-stats`
إحصائيات النشر اليومية.

**Query Params:**
| Param | Type | Default | الوصف |
|-------|------|---------|-------|
| `media_unit_id` | number | — | فلترة حسب وحدة الإعلام |
| `days` | number | 30 | عدد الأيام الماضية |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "published_count": 12,
      "rejected_count": 3,
      "media_unit_name": "القناة الرئيسية"
    }
  ]
}
```

---

## 5. Editorial Policies — السياسات التحريرية

### GET `/api/news/editorial-policies`
جلب جميع السياسات المفعّلة.

**Query Params:**
| Param | Type | الوصف |
|-------|------|-------|
| `media_unit_id` | number | فلترة حسب وحدة الإعلام (اختياري) |

**Response 200:**
```json
{
  "status": "success",
  "count": 4,
  "policies": [
    {
      "id": 1,
      "name": "استبدال_الكلمات",
      "description": "استبدال الكلمات المحظورة",
      "task_type": "replace",
      "media_unit_id": 1,
      "is_active": true,
      "is_modifying": true,
      "isModifying": true
    }
  ]
}
```

---

### POST `/api/news/editorial-policies`
إنشاء سياسة تحريرية جديدة.

**Request Body:**
```json
{
  "name": "اسم_السياسة",
  "description": "وصف السياسة (اختياري)",
  "taskType": "replace",
  "editorInstructions": "استبدل الكلمات التالية بمرادفاتها...",
  "injectedVars": {
    "banned_words": ["كلمة1", "كلمة2"],
    "replacement_map": { "قديم": "جديد" }
  },
  "isModifying": true,
  "mediaUnitId": 1
}
```
> `name` و `editorInstructions` — مطلوبان. `injectedVars` لازم يكون JSON object.

**Response 201:**
```json
{
  "status": "success",
  "message": "تم إنشاء السياسة بنجاح",
  "policy": {
    "id": 5,
    "name": "اسم_السياسة",
    "task_type": "replace",
    "is_modifying": true,
    "is_active": true,
    "version": 1
  }
}
```

**Response 400:**
```json
{ "error": "name مطلوب (string غير فارغ)" }
```

---

### GET `/api/news/editorial-policies/:policyName`
جلب تفاصيل سياسة واحدة كاملة.

**Params:** `policyName` — اسم السياسة

**Response 200:**
```json
{
  "status": "success",
  "policy": {
    "id": 1,
    "name": "استبدال_الكلمات",
    "description": "...",
    "task_type": "replace",
    "editor_instructions": "...",
    "prompt_template": "...",
    "injected_vars": { "banned_words": ["..."] },
    "output_schema": { "modified_text": "string", "changes": "array" },
    "is_active": true,
    "is_modifying": true,
    "media_unit_id": 1,
    "version": 2
  }
}
```

---

### PUT `/api/news/editorial-policies/:policyName`
تحديث تعليمات أو متغيرات سياسة.

**Params:** `policyName`

**Request Body** (واحد على الأقل مطلوب):
```json
{
  "editorInstructions": "تعليمات جديدة للـ AI",
  "injectedVars": {
    "banned_words": ["كلمة_جديدة"]
  }
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "تم تحديث السياسة بنجاح",
  "policy": { "id": 1, "name": "...", "version": 3 }
}
```

---

### DELETE `/api/news/editorial-policies/:policyName`
حذف سياسة تحريرية.

**Params:** `policyName`

**Response 200:**
```json
{
  "status": "success",
  "message": "تم حذف السياسة بنجاح",
  "policy": { "id": 1, "name": "استبدال_الكلمات" }
}
```

**Response 404:**
```json
{ "error": "السياسة غير موجودة" }
```

---

### POST `/api/news/editorial-policies/apply`
تطبيق سياسة واحدة على نص أو خبر من الطابور.

**حالة 1 — تطبيق على خبر من الطابور:**
```json
{
  "policyId": 1,
  "queueId": 10,
  "appliedPolicies": []
}
```

**حالة 2 — تطبيق على نص مباشر:**
```json
{
  "policyName": "استبدال_الكلمات",
  "text": "النص المراد معالجته",
  "appliedPolicies": [
    { "name": "سياسة_سابقة", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ]
}
```
> `policyId` أو `policyName` — واحد مطلوب. `text` أو `queueId` — واحد مطلوب.

**Response 200 — سياسة تعديل (is_modifying = true):**
```json
{
  "policy": {
    "id": 1,
    "name": "استبدال_الكلمات",
    "taskType": "replace",
    "isModifying": true,
    "isInspection": false
  },
  "source": {
    "queueId": 10,
    "rawDataId": 55,
    "mediaUnitId": 1,
    "title": "عنوان الخبر",
    "category": "محلي",
    "mediaUnit": "القناة الرئيسية",
    "status": "pending"
  },
  "originalText": "النص الأصلي...",
  "originalTitle": "عنوان الخبر",
  "modifiedText": "النص بعد التعديل...",
  "hasChanges": true,
  "changes": {
    "changesMade": ["استبدل كلمة X بـ Y"],
    "totalChanges": 3
  },
  "result": {
    "modified_text": "...",
    "changes": ["..."],
    "total_changes": 3,
    "notes": "..."
  },
  "appliedPolicies": [
    { "name": "استبدال_الكلمات", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ],
  "executionTime": 1200
}
```

**Response 200 — سياسة فحص (is_modifying = false):**
```json
{
  "policy": { "id": 2, "name": "فحص_التوازن", "isModifying": false, "isInspection": true },
  "originalText": "النص...",
  "inspection": {
    "status": "issues_found",
    "issues": ["النص يميل لجهة واحدة"],
    "summary": "يحتاج مراجعة",
    "details": {}
  },
  "result": { "status": "issues_found", "issues": [...], "summary": "...", "details": {} },
  "appliedPolicies": [...],
  "executionTime": 900
}
```

---

### POST `/api/news/editorial-policies/sequential`
تطبيق سياسات متعددة بشكل متسلسل — output كل سياسة يصير input للتالية.

**Request Body:**
```json
{
  "queueId": 10,
  "policyIds": [1, 2, 3]
}
```
أو بنص مباشر:
```json
{
  "text": "النص الأصلي",
  "policyIds": [1, 2, 3]
}
```
> يطبّق فقط السياسات التي `is_modifying = true`.

**Response 200:**
```json
{
  "status": "success",
  "originalText": "النص الأصلي...",
  "finalText": "النص بعد كل التعديلات...",
  "hasChanges": true,
  "totalExecutionTime": 3500,
  "policiesApplied": 3,
  "skippedPolicyIds": [],
  "source": {
    "queueId": 10,
    "title": "عنوان الخبر",
    "mediaUnit": "القناة الرئيسية"
  },
  "steps": [
    {
      "policyId": 1,
      "policyName": "استبدال_الكلمات",
      "taskType": "replace",
      "hasChanges": true,
      "executionTime": 1200,
      "status": "success",
      "result": { "modified_text": "...", "changes": [...] }
    },
    {
      "policyId": 2,
      "policyName": "إعادة_الصياغة",
      "taskType": "rewrite",
      "hasChanges": true,
      "executionTime": 1500,
      "status": "success",
      "result": { "modified_text": "...", "changes": [...] }
    }
  ]
}
```

---

### POST `/api/news/editorial-policies/pipeline`
جلب السياسات جاهزة للتطبيق من جهة الفرونت.

**Request Body:**
```json
{
  "text": "النص",
  "policyNames": ["استبدال_الكلمات", "فحص_التوازن"]
}
```

**Response 200:**
```json
{
  "status": "success",
  "message": "السياسات جاهزة للتطبيق من جهة الـ Frontend",
  "originalText": "النص",
  "policies": [
    {
      "name": "استبدال_الكلمات",
      "taskType": "replace",
      "endpoint": "generate",
      "description": "تطبيق سياسة استبدال_الكلمات"
    }
  ],
  "instructions": {
    "step1": "طبّق السياسات بالترتيب المطلوب",
    "step2": "استخدم النص المعدّل من السياسة السابقة كـ input للسياسة التالية",
    "step3": "احفظ النص النهائي بعد تطبيق جميع السياسات"
  }
}
```

---

### POST `/api/news/editorial-policies/save-edited`
حفظ النص المعدّل يدوياً من المحرر بعد التطبيق المتسلسل.

**Request Body:**
```json
{
  "queueId": 10,
  "editedText": "النص النهائي بعد تعديل المحرر",
  "appliedPolicies": [
    { "name": "استبدال_الكلمات", "taskType": "replace", "timestamp": "2024-01-15T10:00:00.000Z" }
  ]
}
```
> `queueId` و `editedText` — مطلوبان.

**Response 200:**
```json
{
  "status": "success",
  "message": "تم حفظ النص المعدّل بنجاح",
  "queueId": 10,
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

---

## 6. System Settings — إعدادات النظام

### GET `/api/settings`
جلب جميع إعدادات النظام.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "key": "scheduler_enabled",          "value": "true",  "description": "تشغيل/إيقاف السحب التلقائي", "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "classifier_enabled",         "value": "true",  "description": "تشغيل/إيقاف التصنيف الآلي", "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "flow_enabled",               "value": "true",  "description": "تشغيل/إيقاف فلو التوجيه",   "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "scheduler_interval_minutes", "value": "15",    "description": "الفاصل الزمني بالدقائق",     "updated_at": "2024-01-15T10:00:00.000Z" },
    { "key": "articles_per_source",        "value": "20",    "description": "عدد الأخبار لكل مصدر",       "updated_at": "2024-01-15T10:00:00.000Z" }
  ]
}
```

---

### GET `/api/settings/toggles`
جلب حالة جميع الإعدادات دفعة واحدة (الأكثر استخداماً من الفرونت).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "scheduler_enabled": true,
    "classifier_enabled": true,
    "flow_enabled": false,
    "scheduler_interval_minutes": 15,
    "articles_per_source": 20
  }
}
```

---

### PATCH `/api/settings/:key`
تحديث إعداد واحد.

**Params:** `key` — اسم الإعداد

**المفاتيح المتاحة:**
| Key | Type | الوصف |
|-----|------|-------|
| `scheduler_enabled` | `"true"` / `"false"` | تشغيل/إيقاف السحب التلقائي |
| `classifier_enabled` | `"true"` / `"false"` | تشغيل/إيقاف التصنيف الآلي |
| `flow_enabled` | `"true"` / `"false"` | تشغيل/إيقاف فلو التوجيه |
| `scheduler_interval_minutes` | `"10"` / `"15"` / `"30"` | الفاصل الزمني بالدقائق |
| `articles_per_source` | `"10"` / `"20"` / `"50"` | عدد الأخبار لكل مصدر |

**Request Body:**
```json
{ "value": "false" }
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث scheduler_enabled إلى false",
  "data": {
    "key": "scheduler_enabled",
    "value": "false",
    "description": "تشغيل/إيقاف السحب التلقائي",
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

**Response 400 — مفتاح غير مسموح:**
```json
{
  "success": false,
  "message": "المفتاح غير مسموح به. المفاتيح المتاحة: scheduler_enabled, classifier_enabled, ..."
}
```

**Response 404 — الجدول غير موجود:**
```json
{
  "success": false,
  "message": "الإعداد غير موجود في الداتابيس — شغّل SQL الإنشاء أولاً"
}
```

---

### PATCH `/api/settings/toggles/bulk`
تحديث أكثر من إعداد دفعة واحدة.

**Request Body** (كل الحقول اختيارية، واحد على الأقل مطلوب):
```json
{
  "scheduler_enabled": false,
  "classifier_enabled": true,
  "flow_enabled": false,
  "scheduler_interval_minutes": 30,
  "articles_per_source": 50
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "تم تحديث 3 إعداد",
  "data": [
    { "key": "scheduler_enabled",          "value": "false", "updated_at": "..." },
    { "key": "flow_enabled",               "value": "false", "updated_at": "..." },
    { "key": "scheduler_interval_minutes", "value": "30",    "updated_at": "..." }
  ]
}
```

**Response 400 — قيمة غير صحيحة:**
```json
{ "success": false, "message": "scheduler_interval_minutes يجب أن يكون رقم موجب" }
```

---

## 7. Scheduler — جدولة المهام

### معلومات عامة
الـ Scheduler يعمل بشكل تلقائي في الخلفية ويقرأ الإعدادات من الداتابيس في كل دورة:
- **المرحلة 1:** سحب الأخبار من RSS (parallel)
- **المرحلة 2:** تصنيف الأخبار بالـ AI وحفظها
- **المرحلة 3:** توجيه الأخبار عبر الفلو (أوتوماتيكي أو تحريري)

### الإعدادات المؤثرة
| الإعداد | الوصف |
|--------|-------|
| `scheduler_enabled` | تشغيل/إيقاف السحب التلقائي |
| `classifier_enabled` | تشغيل/إيقاف التصنيف الآلي |
| `flow_enabled` | تشغيل/إيقاف فلو التوجيه |
| `scheduler_interval_minutes` | الفاصل الزمني بين الدورات (بالدقائق) |
| `articles_per_source` | عدد الأخبار المسحوبة من كل مصدر |

### ملاحظات مهمة
- الـ Scheduler يقرأ الإعدادات من الداتابيس قبل كل دورة — لا حاجة لإعادة تشغيل السيرفر
- لو دورة سابقة لا تزال تعمل، الدورة الجديدة تُتخطى لتجنب التعارض
- الأخبار الناقصة (أقل من 300 حرف) تُتخطى من الفلو وتُوضع flag `is_incomplete = true`
- الأخبار الناقصة تبقى في `raw_data` فقط ولا تدخل الفلو تلقائياً
- عندما يكمل المحرر المحتوى، يُزال الـ flag ويدخل الخبر الفلو

---

## 8. Incomplete Articles — الأخبار الناقصة

### المنطق:
```
1. خبر جديد يُسحب من RSS
   ↓
2. يُحفظ في raw_data
   ↓
3. الفلو يتحقق من طول المحتوى:
   
   ✅ إذا >= 300 حرف → يدخل الفلو (أوتو أو تحرير)
   ❌ إذا < 300 حرف → يبقى في raw_data فقط + flag is_incomplete = true
   
4. المحرر يشوف الأخبار الناقصة من `/api/data/articles/incomplete`
   ↓
5. يكمل المحتوى عبر `/api/data/articles/:id/content`
   ↓
6. الخبر ينتقل لـ editorial_queue (إذا كان تحريري)
   أو published_items (إذا كان أوتوماتيكي)
```

### الفرق بين الأخبار الناقصة والطابور:
| الحالة | المكان | الحالة | الفلو |
|--------|--------|--------|-------|
| **ناقصة** | `raw_data` فقط | `is_incomplete = true` | لم تدخل الفلو |
| **في الطابور** | `editorial_queue` | `status = pending` | دخلت الفلو وتنتظر المحرر |
| **منشورة** | `published_items` | `is_active = true` | مرت الفلو ونُشرت |

---

## 9. Error Responses — أشكال الأخطاء

كل الـ endpoints بترجع نفس شكل الخطأ:

**500 — خطأ في السيرفر:**
```json
{
  "success": false,
  "message": "وصف الخطأ",
  "error": "رسالة الخطأ التقنية"
}
```

**404 — غير موجود:**
```json
{
  "success": false,
  "message": "العنصر غير موجود"
}
```

**400 — بيانات غير صحيحة:**
```json
{
  "success": false,
  "message": "وصف المشكلة في الـ request"
}
```

> السياسات التحريرية بترجع `error` بدل `message` في بعض الحالات:
```json
{ "error": "policyName أو policyId مطلوب" }
```

---

## 10. ملاحظات مهمة

### ترتيب الـ Routes في Express
بعض الـ routes لها أولوية — لازم تنتبه:
- `/api/flow/published/stats` لازم يُستدعى قبل `/api/flow/published/:id`
- `/api/news/editorial-policies/apply` لازم يُستدعى قبل `/api/news/editorial-policies/:policyName`

### fetch_status — حالات الخبر
| القيمة | المعنى |
|--------|--------|
| `fetched` | تم السحب، ينتظر التصنيف والفلو |
| `processed` | تم توجيهه للمسار الصحيح |

### flow — نوع مسار الفئة
| القيمة | المعنى |
|--------|--------|
| `automated` | ينشر مباشرة بدون مراجعة |
| `editorial` | يذهب لطابور التحرير |

### التصنيفات المتاحة
| ID | الاسم |
|----|-------|
| 1 | محلي |
| 2 | دولي |
| 3 | اقتصاد |
| 4 | رياضة |
| 5 | صحة |
| 6 | علوم وتكنولوجيا |
| 7 | فن و ثقافة |
| 9 | بيئة |
| 10 | غذاء |
| 11 | سياسي |
