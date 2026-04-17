# دليل تكامل لوحة إدخال المستخدم مع نظام الأخبار

## نظرة عامة

هذا الدليل مخصص لبناء **لوحة إدخال يدوي** (User Input Panel) تسمح للمستخدم بإدخال أخبار يدوياً (نص / صوت / فيديو).
النص المُدخل يُعامل كخبر جديد، يُخزّن في جدول `raw_data`، ثم يدخل في الفلو الطبيعي للنظام حتى يصل للمحرر.

---

## 1. فهم الفلو الحالي

```
┌─────────────────┐     ┌─────────────────┐
│   RSS Sources    │     │  User Input     │  ← ★ الجديد
│   (scraping)     │     │  Panel (يدوي)   │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
              ┌──────────────┐
              │   raw_data    │  ← fetch_status = 'fetched'
              └──────┬───────┘
                     ▼
              ┌──────────────────────┐
              │  FlowRouterService   │  ← يقرأ category.flow
              └──────────┬───────────┘
                   ┌─────┴──────┐
                   ▼            ▼
            ┌──────────┐  ┌──────────────┐
            │automated │  │  editorial   │
            │(ينشر     │  │  (يروح      │
            │ مباشرة)  │  │  للمحرر)    │
            └──────────┘  └──────┬───────┘
                                ▼
                         ┌──────────────┐
                         │editorial_queue│ ← status = 'pending'
                         └──────┬───────┘
                                ▼
                         ┌──────────────┐
                         │  المحرر      │ ← يطبق سياسات تحريرية
                         │  يوافق/يرفض │
                         └──────┬───────┘
                                ▼
                         ┌──────────────┐
                         │published_items│ ← الخبر المنشور
                         └──────────────┘
```

**الفكرة**: الإدخال اليدوي يدخل لنفس جدول `raw_data` بنفس الطريقة، بس مع تمييز أنه من يوزر وليس من سكراب.

---

## 2. التعديلات اللي تمت على الباك إند وقاعدة البيانات ✅

### 2.1 إضافة نوع مصدر جديد `user_input`

تم إضافة نوع مصدر جديد في جدول `source_types` لتمييز الأخبار اليدوية:

```sql
INSERT INTO source_types (name) VALUES ('user_input');
```

### 2.2 إضافة مصدر وهمي للإدخال اليدوي

تم إضافة مصدر في جدول `sources` يمثل الإدخال اليدوي:

```sql
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES (
  (SELECT id FROM source_types WHERE name = 'user_input'),
  NULL,
  'User Manual Input',
  true,
  NOW()
);
```

### 2.3 تعديل عمود `url` في جدول `raw_data`

- عمود `url` الآن **يقبل `NULL`** وقيم مكررة بدون مشاكل
- تم إضافة index عادي (non-unique) للحفاظ على سرعة البحث:

```sql
CREATE INDEX idx_raw_data_url ON raw_data(url);
```

### 2.4 إضافة عمود `created_by` لجدول `raw_data`

تم إضافة عمود لتتبع أي يوزر أدخل الخبر:

```sql
ALTER TABLE raw_data ADD COLUMN created_by BIGINT REFERENCES users(id) DEFAULT NULL;
```

- للأخبار من RSS: يبقى `NULL`
- للأخبار من الإدخال اليدوي: **لازم يتعبّأ بـ `user_id` تبع المستخدم اللي أدخل الخبر**
- هيك المحرر بيعرف مباشرة مين أدخل الخبر

### 2.5 ما لم يتغير (جاهز ويشتغل)

- ✅ `POST /api/news` — جاهز ويقبل كل الحقول المطلوبة
- ✅ `POST /api/flow/process` — جاهز ويعالج أي خبر بـ `fetch_status = 'fetched'`
- ✅ `FlowRouterService` — يوجّه حسب `category.flow` بغض النظر عن المصدر
- ✅ `EditorialQueueService` — يعمل بشكل طبيعي
- ✅ `EditorialPolicyService` — يطبق السياسات على أي نص

---

## 3. هيكل قاعدة البيانات — الجداول المهمة

### 3.1 جدول `source_types` — أنواع المصادر

| Column | Type   | Notes                |
|--------|--------|----------------------|
| id     | bigint | PK                   |
| name   | text   | UNIQUE — مثل: RSS, API, Telegram, **user_input** |

### 3.2 جدول `sources` — المصادر الفعلية

| Column              | Type      | Notes                          |
|---------------------|-----------|--------------------------------|
| id                  | bigint    | PK                             |
| source_type_id      | bigint    | FK → source_types.id           |
| url                 | text      | nullable                       |
| name                | text      | اسم المصدر                     |
| is_active           | boolean   | هل المصدر فعّال                |
| created_at          | timestamp | تاريخ الإنشاء                  |
| default_category_id | integer   | FK → categories.id (اختياري)   |

### 3.3 جدول `categories` — التصنيفات

| Column    | Type    | Notes                                    |
|-----------|---------|------------------------------------------|
| id        | bigint  | PK                                       |
| name      | text    | UNIQUE — مثل: سياسة، رياضة، اقتصاد      |
| slug      | text    | UNIQUE                                   |
| flow      | text    | **`automated`** أو **`editorial`**       |
| is_active | boolean |                                          |

> **مهم جداً**: حقل `flow` هو اللي بيحدد مسار الخبر:
> - `automated` = ينشر مباشرة بدون مراجعة
> - `editorial` = يروح لطابور المحرر  
طبعا في حال اختار سياسي او محلي او دولي ف هي تلقائيا بكون editorial

### 3.4 جدول `raw_data` — البيانات الخام (★ الجدول الأساسي)

| Column         | Type      | Notes                                    |
|----------------|-----------|------------------------------------------|
| id             | bigint    | PK, auto-increment                       |
| source_id      | bigint    | FK → sources.id                          |
| source_type_id | bigint    | FK → source_types.id                     |
| category_id    | bigint    | FK → categories.id                       |
| url            | text      | nullable — يقبل NULL للإدخال اليدوي      |
| title          | text      | عنوان الخبر                              |
| content        | text      | محتوى الخبر (النص الكامل)                |
| image_url      | text      | رابط الصورة (اختياري)                    |
| tags           | text[]    | مصفوفة تاغات                             |
| fetch_status   | text      | **لازم يكون `'fetched'`** حتى يدخل الفلو |
| created_by     | bigint    | FK → users.id — **NULL للسكراب، user_id للإدخال اليدوي** |
| fetched_at     | timestamp | تاريخ الإدخال                            |

### 3.5 جدول `editorial_queue` — طابور المحرر

| Column        | Type      | Notes                          |
|---------------|-----------|--------------------------------|
| id            | bigint    | PK                             |
| media_unit_id | bigint    | FK → media_units.id            |
| raw_data_id   | bigint    | FK → raw_data.id               |
| policy_id     | bigint    | NULL حتى المحرر يختار سياسة    |
| status        | text      | pending / in_review / approved / rejected |
| editor_notes  | text      | ملاحظات المحرر                 |
| created_at    | timestamp |                                |
| updated_at    | timestamp |                                |

### 3.6 جدول `media_units` — وحدات الإعلام

| Column      | Type      | Notes              |
|-------------|-----------|---------------------|
| id          | bigint    | PK                  |
| name        | text      | UNIQUE              |
| slug        | text      | UNIQUE              |
| description | text      |                     |
| is_active   | boolean   |                     |
| created_at  | timestamp |                     |

> الفلو بينشر/يضيف للطابور لكل وحدة إعلام نشطة.

### 3.7 جدول `published_items` — المحتوى المنشور

| Column          | Type      | Notes                                    |
|-----------------|-----------|------------------------------------------|
| id              | bigint    | PK                                       |
| media_unit_id   | bigint    | FK → media_units.id                      |
| raw_data_id     | bigint    | FK → raw_data.id                         |
| queue_id        | bigint    | FK → editorial_queue.id (NULL = automated)|
| content_type_id | bigint    | FK → content_types.id                    |
| title           | text      |                                          |
| content         | text      |                                          |
| tags            | text[]    |                                          |
| is_active       | boolean   |                                          |
| published_at    | timestamp |                                          |

---

## 4. الـ API — إضافة خبر جديد `POST /api/news`

### الـ Body المطلوب

```json
{
  "source_id": <id مصدر User Manual Input>,
  "source_type_id": <id نوع user_input>,
  "category_id": <id التصنيف المختار من الفورم>,
  "url": null,
  "title": "عنوان الخبر",
  "content": "محتوى الخبر الكامل",
  "image_url": "",
  "tags": ["تاغ1", "تاغ2"],
  "fetch_status": "fetched",
  "created_by": <user_id اللي أدخل الخبر>
}
```

### شرح الحقول

| الحقل | مطلوب؟ | الشرح |
|-------|--------|-------|
| `source_id` | ✅ | ID مصدر `User Manual Input` — ثابت، تجلبيه من `GET /api/data/sources/active` |
| `source_type_id` | ✅ | ID نوع المصدر `user_input` — ثابت، نفس الـ endpoint |
| `category_id` | ✅ | **التصنيف اللي اختاره المستخدم — لازم يكون محدد عشان الخبر يمشي بالفلو الصحيح** |
| `url` | ❌ | `null` — لأنه إدخال يدوي |
| `title` | ✅ | عنوان الخبر |
| `content` | ✅ | النص الكامل للخبر |
| `image_url` | ❌ | رابط صورة (اختياري) |
| `tags` | ❌ | مصفوفة تاغات (اختياري) |
| `fetch_status` | ✅ | **لازم يكون `"fetched"`** حتى يدخل الفلو |
| `created_by` | ✅ | **ID المستخدم اللي أدخل الخبر — لازم يتبعث عشان المحرر يعرف مين أدخله** |

### ملاحظة مهمة عن `category_id`

كل تصنيف عنده حقل `flow` بيحدد مسار الخبر:
- `flow = "automated"` → الخبر ينشر مباشرة
- `flow = "editorial"` → الخبر يروح لطابور المحرر

**لازم المستخدم يختار التصنيف**، وتجلبي التصنيفات من:
```
GET /api/data/categories
```

---

## 5. الحقول المطلوبة في الفورم

| حقل الفورم     | يُرسل كـ        | مطلوب؟ | ملاحظات                                    |
|----------------|-----------------|--------|---------------------------------------------|
| عنوان الخبر    | `title`         | ✅ نعم  | نص                                          |
| محتوى الخبر    | `content`       | ✅ نعم  | نص (من كتابه )    |
| التصنيف        | `category_id`   | ✅ نعم  | dropdown — جلب من `GET /api/data/categories` |
| تاغات          | `tags`          | اختياري | مصفوفة نصوص                                 |
| صورة           | `image_url`     | اختياري | رابط صورة أو رفع صورة                       |

### الحقول الثابتة (يُرسلها الفرونت تلقائياً)

| حقل             | قيمة                                          | شرح                                |
|-----------------|-----------------------------------------------|-------------------------------------|
| `source_id`     | ID المصدر `User Manual Input`                 | تجلبيه من `GET /api/data/sources/active` |
| `source_type_id`| ID نوع المصدر `user_input`                    | نفس الـ endpoint                   |
| `fetch_status`  | `"fetched"`                                   | **لازم يكون fetched** حتى يدخل الفلو|
| `url`           | `null`                                        | لأنه إدخال يدوي                     |
| `created_by`    | `user_id` المستخدم الحالي                      | **لازم يتبعث — عشان المحرر يعرف مين أدخل الخبر** |

---

## 6. خطوات العمل بالترتيب

### عند تحميل الصفحة:
```
GET /api/data/categories          → لملء dropdown التصنيفات
GET /api/data/sources/active      → لجلب source_id و source_type_id
```

### عند الإرسال:
```
POST /api/news                    → حفظ الخبر في raw_data
```

### بعد نجاح الحفظ:
```
POST /api/flow/process            → تشغيل الفلو (الخبر يتوجه حسب التصنيف)
```

### (اختياري) للتحقق:
```
GET /api/flow/queue/pending       → التأكد إن الخبر وصل لطابور المحرر
```

---

## 7. مثال كامل

### الطلب:
```http
POST /api/news
Content-Type: application/json

{
  "source_id": 10,
  "source_type_id": 5,
  "category_id": 3,
  "url": null,
  "title": "اجتماع طارئ لمجلس الوزراء لمناقشة الموازنة",
  "content": "عقد مجلس الوزراء اجتماعاً طارئاً اليوم لمناقشة بنود الموازنة العامة للعام المقبل...",
  "image_url": "",
  "tags": ["سياسة", "موازنة", "مجلس الوزراء"],
  "fetch_status": "fetched",
  "created_by": 7
}
```

### الرد:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "source_id": 10,
    "source_type_id": 5,
    "category_id": 3,
    "title": "اجتماع طارئ لمجلس الوزراء لمناقشة الموازنة",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-17T10:30:00.000Z"
  },
  "message": "News created successfully"
}
```

### تشغيل الفلو:
```http
POST /api/flow/process
```

```json
{
  "success": true,
  "data": {
    "processedCount": 1,
    "automatedCount": 0,
    "editorialCount": 1,
    "errors": []
  }
}
```

---

## 8. الـ Endpoints المتاحة (مرجع سريع)

| Method | Endpoint                              | الوصف                              |
|--------|---------------------------------------|------------------------------------|
| GET    | `/api/data/categories`                | جلب التصنيفات (للـ dropdown)       |
| GET    | `/api/data/media-units`               | جلب وحدات الإعلام                  |
| GET    | `/api/data/sources/active`            | جلب المصادر النشطة                 |
| POST   | `/api/news`                           | ★ إضافة خبر جديد لـ raw_data      |


## 9. ملاحظات إضافية


### بخصوص الـ Validation
- `title` — مطلوب، لا يقل عن 5 أحرف
- `content` — مطلوب، لا يقل عن 20 حرف
- `category_id` — مطلوب، لازم يكون موجود بجدول categories
- `fetch_status` — لازم يكون `"fetched"` حتى يدخل الفلو
