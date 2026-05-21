# نظام النشر المتعدد المنصات — Multi-Platform Publishing System (v2)

## ملخص عام

نظام نشر احترافي متكامل يدعم النشر على **المواقع الخارجية** (WordPress API) و**السوشال ميديا** (فيسبوك، إنستغرام، تويتر) مع:
- حماية كاملة من Race Conditions و Double-Click
- Retry مع Exponential Backoff + Dead-Letter Queue
- تتبع كامل لكل عملية نشر في الداتابيس (Audit Trail)
- نشر تلقائي للأخبار الأوتوماتيكية + نشر يدوي للتحريرية

---

## الفلو الكامل — من الخبر الخام حتى النشر النهائي

### المرحلة 1: سحب الأخبار وتوجيهها (Flow Router)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Scheduler (كل 10-15 دقيقة)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. سحب أخبار جديدة من NewsDesk API → raw_data (status: 'fetched')      │
│  2. تصنيف AI (يحدد category_id)                                         │
│  3. تنظيف النص (للأوتوماتيكية فقط)                                      │
│  4. فحص اكتمال المحتوى (عنوان + محتوى ≥100 حرف + صورة)                 │
│  5. التوجيه حسب التصنيف:                                                │
│                                                                          │
│     ┌────────────────────────────────────────────────────────────┐       │
│     │  automated (أوتوماتيكي):                                   │       │
│     │    اقتصاد(3), رياضة(4), صحة(5), تكنولوجيا(6),             │       │
│     │    ثقافة(7), بيئة(9), غذاء(10)                             │       │
│     │    → auto-approve → published_items → نشر خارجي تلقائي    │       │
│     ├────────────────────────────────────────────────────────────┤       │
│     │  editorial (تحريري):                                       │       │
│     │    محلي(1), دولي(2), سياسي(11)                             │       │
│     │    → editorial_queue (pending) → المحرر يقرر               │       │
│     └────────────────────────────────────────────────────────────┘       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

**تغييرات الداتابيس في هذه المرحلة:**

| الجدول | التغيير | التفاصيل |
|--------|---------|----------|
| `raw_data` | INSERT | خبر جديد بـ `fetch_status = 'fetched'` |
| `raw_data` | UPDATE `category_id` | بعد تصنيف AI |
| `raw_data` | UPDATE `content` | بعد تنظيف النص (أوتوماتيكي فقط) |
| `raw_data` | UPDATE `fetch_status` | `'fetched'` → `'processed'` أو `'published'` |
| `editorial_queue` | INSERT | صف لكل media_unit (status: pending/incomplete) |
| `editorial_queue` | UPDATE `status` | `'pending'` → `'approved'` (أوتوماتيكي) |
| `published_items` | INSERT | الخبر المنشور محلياً (أوتوماتيكي فوراً / تحريري بعد موافقة المحرر) |

---

### المرحلة 2: النشر على الموقع الخارجي

هناك مسارين:

#### المسار A: النشر التلقائي (أخبار أوتوماتيكية)

```
published_items (automated) ──→ auto-publish.service ──→ External API
                                      │
                                      ├── يفحص auto_publish_targets (المفعّلة)
                                      ├── يفحص auto_publish_log (لمنع التكرار)
                                      ├── يرسل POST multipart/form-data
                                      ├── يسجل النتيجة في auto_publish_log
                                      └── يحدّث raw_data.publish_status → 'published_external'
```

**الشروط:**
- `auto_publish_enabled = true` (Master Switch)
- الهدف `is_enabled = true`
- الخبر من تصنيف automated
- لم يُنشر مسبقاً على نفس الهدف (فحص `auto_publish_log`)

#### المسار B: النشر اليدوي (أخبار تحريرية)

```
المحرر يوافق على الخبر
        │
        ▼
PublishedView → يضغط "عرض" → يختار "نشر موقع خارجي"
        │
        ▼
يظهر dialog بالمواقع المفعّلة (auto_publish_targets)
        │
        ▼
يضغط "نشر" على الهدف المطلوب
        │
        ▼
POST /api/auto-publish/publish-one { raw_data_id, target_id }
        │
        ▼
auto-publish.service.publishOneToTarget()
        │
        ├── يبني multipart/form-data (title, content, category_id, tags, image_url)
        ├── يحدد category_id الخارجي من LOCAL_TO_HGAZA_CATEGORY mapping
        ├── يرسل POST إلى target.api_url مع Bearer token
        │
        ├── ✅ نجاح:
        │     ├── يسجل في auto_publish_log (status: 'success', external_url, external_id)
        │     ├── يحدّث raw_data.publish_status → 'published_external'
        │     └── يرجع الرابط الخارجي للفرونت
        │
        └── ❌ فشل:
              ├── يسجل في auto_publish_log (status: 'failed', error_message, response_code)
              └── يزيد retry_count
```

**تغييرات الداتابيس:**

| الجدول | التغيير | التفاصيل |
|--------|---------|----------|
| `auto_publish_log` | INSERT/UPDATE | تسجيل كل محاولة نشر (status, response_code, external_url, external_id) |
| `raw_data` | UPDATE `publish_status` | → `'published_external'` عند النجاح |

---

### المرحلة 3: النشر على السوشال ميديا (فيسبوك / إنستغرام / تويتر)

```
PublishedView → يضغط "عرض" → يختار "إنشاء منشور على السوشال ميديا"
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│              SocialPostCreator (4 خطوات)                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: تعديل المنشور                                       │
│  ─────────────────────                                       │
│  • AI يولّد مسودة منشور مناسبة للمنصة المختارة              │
│  • المحرر يعدّل النص + يضيف/يزيل الصورة                    │
│  • يختار المنصة (فيسبوك/إنستغرام/تويتر)                    │
│                                                              │
│  Step 2: معالجة المنشور                                      │
│  ─────────────────────                                       │
│  • AI يراجع ويصقل المنشور (إيموجي + هاشتاجات)              │
│  • يتأكد من مناسبته لطبيعة المنصة                           │
│                                                              │
│  Step 3: معاينة المنشور                                      │
│  ─────────────────────                                       │
│  • المحرر يشوف الشكل النهائي                                │
│  • يختار config المنصة المحددة (من platform_configs)          │
│  • يضغط "نشر"                                               │
│                                                              │
│  Step 4: النشر الفعلي                                        │
│  ─────────────────────                                       │
│  • POST /api/publishing/publish { article_id, config_id }    │
│  • publishing.service.publishToPlatform()                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### فلو النشر على السوشال ميديا بالتفصيل (publishing.service)

```
POST /api/publishing/publish { article_id: 5, platform_config_id: 2 }
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1. جلب platform_config (فحص is_enabled)                          │
│ 2. فحص Platform Constraints (Instagram يتطلب صورة)               │
│ 3. BEGIN TRANSACTION                                             │
│    ├── pg_advisory_xact_lock(50002) ← Lock key = 5*10000 + 2    │
│    ├── فحص publishing_status:                                    │
│    │     • status='success' → "منشور مسبقاً" (رفض)              │
│    │     • status='publishing' → "قيد النشر" (رفض)              │
│    │     • status='failed' → نسمح بإعادة المحاولة               │
│    ├── INSERT/UPDATE publishing_status → status='publishing'     │
│    ├── UPDATE raw_data.publish_status → 'publishing'             │
│    └── COMMIT (يحرر الـ lock)                                    │
│                                                                  │
│ 4. جلب بيانات المقال (يفضّل published_items على raw_data)        │
│ 5. الحصول على Provider (facebook/instagram/twitter)              │
│ 6. تسجيل المحاولة في publishing_logs (status: 'processing')     │
│ 7. تنفيذ النشر عبر Provider                                     │
│                                                                  │
│    ┌── ✅ نجاح ──────────────────────────────────────────┐       │
│    │ • UPDATE publishing_status → 'success'              │       │
│    │   + external_post_id, external_url, published_at    │       │
│    │ • UPDATE publishing_logs → 'success'                │       │
│    │ • UPDATE raw_data.publish_status:                    │       │
│    │   - facebook/instagram/twitter → 'published_social' │       │
│    │   - external_website → 'published_external'         │       │
│    └─────────────────────────────────────────────────────┘       │
│                                                                  │
│    ┌── ❌ فشل ───────────────────────────────────────────┐       │
│    │ • UPDATE publishing_status → 'failed'               │       │
│    │   + error_message, retry_count++, last_retry_at     │       │
│    │ • UPDATE publishing_logs → 'failed'                 │       │
│    │ • UPDATE raw_data.publish_status → 'ready_for_publish' │    │
│    └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**تغييرات الداتابيس عند النشر على السوشال:**

| الجدول | التغيير | متى |
|--------|---------|-----|
| `publishing_status` | INSERT/UPDATE | عند بدء النشر (status: publishing) |
| `publishing_status` | UPDATE | عند النجاح (status: success + external_url + external_post_id) |
| `publishing_status` | UPDATE | عند الفشل (status: failed + error_message + retry_count) |
| `publishing_logs` | INSERT | عند بدء كل محاولة (status: processing, retry_attempt) |
| `publishing_logs` | UPDATE | عند انتهاء المحاولة (status: success/failed + completed_at) |
| `raw_data` | UPDATE `publish_status` | publishing → published_social (نجاح) أو ready_for_publish (فشل) |

---

## Race Condition Prevention

```
طلب 1: POST /publish {article: 5, config: 2}
طلب 2: POST /publish {article: 5, config: 2}  ← بنفس اللحظة!
         │
         ▼
┌─────────────────────────────────────────┐
│ BEGIN TRANSACTION                        │
│ SELECT pg_advisory_xact_lock(50002)     │  ← Lock key = articleId*10000 + configId
│                                          │
│ طلب 1: يحصل على الـ lock ✅             │
│ طلب 2: ينتظر... ⏳                      │
│                                          │
│ طلب 1: INSERT status = 'publishing'     │
│ طلب 1: COMMIT → يحرر الـ lock           │
│                                          │
│ طلب 2: يحصل على الـ lock الآن           │
│ طلب 2: SELECT → يجد status='publishing' │
│ طلب 2: COMMIT → يرجع "قيد النشر حالياً" │
└─────────────────────────────────────────┘
```

---

## Retry Strategy (Exponential Backoff)

```
المحاولة 1: فشل → انتظار 2 ثانية
المحاولة 2: فشل → انتظار 4 ثوانٍ
المحاولة 3: فشل → Dead Letter ☠️ (لا مزيد من المحاولات)
```

**الإعدادات:**
```typescript
DEFAULT_RETRY_CONFIG = {
  max_retries: 3,
  base_delay_ms: 2000,    // 2s → 4s → 8s
  max_delay_ms: 30000,    // حد أقصى 30 ثانية
}
```

**Dead-Letter Queue:**
- المقالات التي فشلت ≥ 3 مرات تبقى في حالة `failed` مع `retry_count >= 3`
- مراجعتها: `GET /api/publishing/dead-letter`
- إعادة تعيينها: `POST /api/publishing/set-status`

---

## دورة حياة المقال (Status Lifecycle)

```
                                    ┌──────────────────────────────────────────────────────┐
                                    │              raw_data.publish_status                   │
                                    └──────────────────────────────────────────────────────┘

┌─────────┐     ┌──────────────────┐     ┌────────────┐
│  draft  │ ──→ │ ready_for_publish │ ──→ │ publishing │ (lock state — يمنع double-click)
└─────────┘     └──────────────────┘     └────────────┘
     │                                         │
     │                                    ┌────┴────┐
     │                                  نجاح      فشل
     │                                    │         │
     │                                    ▼         ▼
     │                          ┌─────────────────┐  يرجع إلى
     │                          │ published_social │  ready_for_publish
     │                          │       أو        │
     │                          │published_external│
     │                          └─────────────────┘
     │                                    │
     │                              (يدوي فقط)
     │                                    ▼
     │                             ┌──────────┐
     └─────────────────────────────│ archived │
                                   └──────────┘
```

**القواعد:**
- `publishing` = حالة مؤقتة (lock) — لو بقيت أكثر من 5 دقائق تُنظف تلقائياً
- `published_social` = نُشر على سوشال ميديا واحدة على الأقل
- `published_external` = نُشر على موقع خارجي واحد على الأقل
- `archived` = قرار يدوي من المحرر (يتطلب نشر ناجح مسبق)
- لا يمكن الرجوع من `archived` أو `published_external` إلى حالة أقل

---

## Source of Truth — جداول التتبع

| الجدول | الدور | متى يُقرأ | يخص |
|--------|-------|-----------|-----|
| `publishing_status` | **الحالة الحالية** لكل مقال/منصة سوشال | "هل منشور على فيسبوك؟" | سوشال ميديا |
| `publishing_logs` | **تاريخ المحاولات** (audit trail) | "كم مرة حاولنا؟ متى فشل؟" | سوشال ميديا |
| `auto_publish_log` | **سجل النشر الخارجي** | "هل منشور على هنا غزة؟ ما الرابط؟" | مواقع خارجية |
| `raw_data.publish_status` | **حالة المقال العامة** | "وين وصل هالخبر؟" | الكل |

---

## جداول الداتابيس الكاملة

### `platform_configs` — إعدادات المنصات (سوشال ميديا)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL PK | |
| platform | VARCHAR | `facebook` / `instagram` / `twitter` / `external_website` |
| name | VARCHAR | اسم عرض ("صفحة فيسبوك الرئيسية") |
| credentials | JSONB | `{page_id, access_token}` أو `{api_url, api_token}` |
| is_enabled | BOOLEAN | مفعّل أم لا |
| media_unit_id | INT FK | الوحدة الإعلامية |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE:** `(platform, media_unit_id, name)`

### `publishing_status` — حالة النشر الحالية (Source of Truth للسوشال)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL PK | |
| article_id | INT FK → raw_data | معرف المقال |
| platform | VARCHAR | المنصة |
| platform_config_id | INT FK | إعداد المنصة |
| status | VARCHAR | `publishing` / `success` / `failed` |
| external_post_id | VARCHAR | ID المنشور على المنصة الخارجية |
| external_url | VARCHAR | رابط المنشور |
| published_at | TIMESTAMP | وقت النشر الناجح |
| error_message | TEXT | رسالة الخطأ (عند الفشل) |
| retry_count | INT DEFAULT 0 | عدد المحاولات (0-3) |
| last_retry_at | TIMESTAMP | آخر محاولة |
| metadata | JSONB | بيانات إضافية من المنصة |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**UNIQUE:** `(article_id, platform_config_id)`

### `publishing_logs` — سجل المحاولات (Audit Trail للسوشال)

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL PK | |
| article_id | INT FK | معرف المقال |
| platform | VARCHAR | المنصة |
| platform_config_id | INT FK | إعداد المنصة |
| status | VARCHAR | `processing` / `success` / `failed` |
| external_post_id | VARCHAR | ID المنشور |
| external_url | VARCHAR | رابط المنشور |
| error_message | TEXT | رسالة الخطأ |
| retry_attempt | INT | رقم المحاولة (0, 1, 2...) |
| metadata | JSONB | بيانات إضافية |
| attempted_at | TIMESTAMP | وقت بدء المحاولة |
| completed_at | TIMESTAMP | وقت انتهاء المحاولة |

### `auto_publish_targets` — أهداف النشر الخارجي

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL PK | |
| media_unit_id | INT FK | الوحدة الإعلامية |
| name | VARCHAR | اسم الهدف ("موقع هنا غزة") |
| api_url | VARCHAR | `https://hgaza.nn.ps/api/v1/automation/news` |
| api_token | VARCHAR | Bearer token |
| default_category_id | INT | التصنيف الافتراضي على الموقع الخارجي |
| is_enabled | BOOLEAN | مفعّل أم لا |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### `auto_publish_log` — سجل النشر الخارجي

| العمود | النوع | الوصف |
|--------|-------|-------|
| id | SERIAL PK | |
| target_id | INT FK → auto_publish_targets | الهدف |
| raw_data_id | INT FK → raw_data | المقال |
| status | VARCHAR | `pending` / `success` / `failed` |
| external_url | VARCHAR | رابط الخبر على الموقع الخارجي |
| external_id | INT | ID الخبر على الموقع الخارجي |
| response_code | INT | HTTP status code (201, 400, 500...) |
| response_body | TEXT | جسم الاستجابة |
| error_message | TEXT | رسالة الخطأ |
| retry_count | INT DEFAULT 0 | عدد المحاولات |
| published_at | TIMESTAMP | وقت النشر |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

---

## تفاصيل كل Provider

### Facebook Provider

| الحقل | القيمة |
|-------|--------|
| API | Facebook Graph API v19.0 |
| Endpoint (نص) | `POST /{page_id}/feed` |
| Endpoint (صورة) | `POST /{page_id}/photos` |
| Auth | Page Access Token (long-lived) |
| Max Length | 63,206 حرف |
| Credentials | `page_id` + `access_token` (من DB أو `.env` كـ fallback) |

**تنسيق المنشور:**
```
📰 {العنوان}

{المحتوى — أول 500 حرف}

#{هاشتاج1} #{هاشتاج2} ...
```

**الصورة:** تُرسل تلقائياً لو `image_url` موجودة (endpoint `/photos` مع `caption`)، وإلا منشور نصي عبر `/feed`.

### External Website Provider

| الحقل | القيمة |
|-------|--------|
| API | WordPress REST API (أو أي API مخصص) |
| Method | POST multipart/form-data |
| Auth | Bearer Token |
| Response | `201 Created` |

**الحقول المرسلة:**
| حقل | الوصف |
|------|-------|
| `title` | عنوان الخبر |
| `content` | محتوى الخبر الكامل |
| `category_id` | ID التصنيف على الموقع الخارجي (من mapping) |
| `tags` | الوسوم (مفصولة بفاصلة) |
| `keywords` | الكلمات المفتاحية |
| `image_url` | رابط صورة الخبر (اختياري) |

### ربط التصنيفات (Category Mapping)

| تصنيف محلي | ID | → | تصنيف هنا غزة | ID |
|-----------|---|---|--------------|---|
| محلي | 1 | → | الأخبار المحلية | 1 |
| دولي | 2 | → | الأخبار الدولية | 4 |
| اقتصاد | 3 | → | الاقتصاد | 6 |
| رياضة | 4 | → | الرياضة | 7 |
| صحة | 5 | → | الصحة | 2 |
| علوم وتكنولوجيا | 6 | → | تكنولوجيا | 8 |
| فن و ثقافة | 7 | → | الثقافة | 9 |
| بيئة | 9 | → | اجتماعي | 10 |
| غذاء | 10 | → | أخبار عامة | 13 |
| سياسي | 11 | → | السياسة | 5 |

---

## Platform Constraints (فحص قبل النشر)

```json
{
  "instagram": {
    "requires_image": true,
    "requires_business_account": true,
    "max_content_length": 2200,
    "notes": ["يتطلب صورة إجبارياً", "حساب Business/Creator مربوط بفيسبوك"]
  },
  "facebook": {
    "requires_image": false,
    "max_content_length": 63206,
    "notes": ["يتطلب Page Access Token (long-lived)"]
  },
  "twitter": {
    "requires_image": false,
    "max_content_length": 280,
    "notes": ["يتطلب OAuth 1.0a credentials"]
  },
  "external_website": {
    "requires_image": false,
    "max_content_length": 100000,
    "notes": ["يدعم WordPress REST API أو أي API مخصص"]
  }
}
```

**الفحص يحصل تلقائياً قبل النشر:**
- إذا المقال بدون صورة + المنصة Instagram → خطأ فوري بدون محاولة

---

## الأرشفة (Archive)

**القاعدة:** الأرشفة = قرار يدوي من المحرر (ليست تلقائية)

```bash
POST /api/publishing/archive/:articleId
```

**الشروط:**
- المقال لازم يكون منشور بنجاح على منصة واحدة على الأقل (سوشال أو خارجي)
- يفحص `publishing_status` (سوشال) + `auto_publish_log` (خارجي)

**تغييرات الداتابيس عند الأرشفة:**
| الجدول | التغيير |
|--------|---------|
| `raw_data.publish_status` | → `'archived'` |
| `published_items.is_active` | → `false` (لا يظهر في قسم النشر) |

---

## Stale Publishing Cleanup

حالات "publishing" العالقة (أكثر من 5 دقائق) تُنظف تلقائياً:

```bash
POST /api/publishing/cleanup
```

يحوّل `publishing` → `failed` مع رسالة "Timeout — stuck in publishing state"

---

## API Endpoints الكاملة

### نظام النشر على السوشال ميديا (`/api/publishing/`)

| Method | Path | الوصف |
|--------|------|-------|
| POST | `/publish` | نشر مقال على منصة (مع race condition protection) |
| POST | `/set-status` | تغيير حالة مقال يدوياً |
| POST | `/retry` | إعادة محاولة الفاشل (exponential backoff) |
| GET | `/dead-letter` | المقالات في dead-letter queue |
| POST | `/cleanup` | تنظيف حالات publishing العالقة |
| GET | `/status/:articleId` | حالة النشر لمقال (source of truth) |
| GET | `/logs` | سجل النشر (audit trail) |
| GET | `/logs/:articleId` | سجل مقال معين |
| GET | `/platforms` | المنصات المدعومة |
| GET | `/constraints` | قيود كل منصة |
| GET | `/configs` | إعدادات المنصات |
| GET | `/configs/:id` | إعداد واحد |
| POST | `/configs` | إنشاء إعداد |
| PATCH | `/configs/:id` | تحديث إعداد |
| DELETE | `/configs/:id` | حذف إعداد |
| POST | `/configs/:id/toggle` | تفعيل/إيقاف |
| POST | `/configs/:id/validate` | التحقق من الاعتمادات |
| GET | `/archive` | المقالات المؤرشفة |
| POST | `/archive/:articleId` | أرشفة يدوية |
| GET | `/stats` | إحصائيات (تشمل dead-letter count) |

### نظام النشر على المواقع الخارجية (`/api/auto-publish/`)

| Method | Path | الوصف |
|--------|------|-------|
| GET | `/status` | حالة النظام + إحصائيات |
| POST | `/toggle` | تفعيل/إيقاف النشر التلقائي (master) |
| GET | `/targets` | جميع أهداف النشر |
| POST | `/targets` | إنشاء هدف جديد |
| PATCH | `/targets/:id` | تحديث هدف |
| DELETE | `/targets/:id` | حذف هدف |
| POST | `/targets/:id/toggle` | تفعيل/إيقاف هدف |
| POST | `/run` | تشغيل يدوي فوري |
| POST | `/publish-one` | نشر خبر واحد يدوياً |
| POST | `/retry` | إعادة محاولة الفاشل |
| GET | `/log` | سجل النشر |
| GET | `/external-links/:rawDataId` | روابط خبر منشور |
| POST | `/external-links/batch` | روابط عدة أخبار |

---

## البنية المعمارية

```
src/services/publishing/                    ← نظام السوشال ميديا
├── types.ts                                ← الأنواع + PLATFORM_CONSTRAINTS + RetryConfig
├── index.ts                                ← تصدير الموديول
├── publishing.service.ts                   ← الخدمة الرئيسية (v2) — race protection + retry
├── publishing-db.migration.ts              ← Migration
└── providers/                              ← Strategy Pattern
    ├── base-provider.ts                    ← IPublishingProvider interface
    ├── index.ts                            ← Provider Registry
    ├── external-website.provider.ts        ← WordPress API
    ├── facebook.provider.ts                ← Facebook Graph API
    ├── instagram.provider.ts               ← Instagram API
    └── twitter.provider.ts                 ← Twitter/X API

src/services/news/
├── auto-publish.service.ts                 ← النشر التلقائي على المواقع الخارجية
├── published-items.service.ts              ← إدارة المحتوى المنشور محلياً
├── flow-router.service.ts                  ← توجيه الأخبار (automated/editorial)
└── scheduler.service.ts                    ← الـ Scheduler (يشغّل كل شي)

src/controllers/publishing/
└── publishing.controller.ts                ← REST Controller (سوشال)

src/controllers/news/
└── auto-publish.controller.ts              ← REST Controller (خارجي)

frontend/src/components/news/
├── PublishedView.tsx                        ← عرض الأخبار المنشورة + أزرار النشر
├── SocialPostCreator.tsx                   ← إنشاء منشور سوشال (4 خطوات + AI)
└── QueueView.tsx                           ← استديو التحرير
```

---

## متغيرات البيئة

```env
# Facebook Publishing
FACEBOOK_PAGE_ID=961852527016202
FACEBOOK_ACCESS_TOKEN=EAALZAKaM7VdABRW7tlet1dr9CtrZCJy...

# Auto-Publish (External Website)
# يُخزّن في auto_publish_targets (api_url + api_token)
```

---

## تفعيل المنصة في DB (مطلوب)

### تفعيل فيسبوك (سوشال ميديا):

```sql
INSERT INTO platform_configs (platform, name, credentials, is_enabled, media_unit_id)
VALUES ('facebook', 'صفحة فيسبوك الرئيسية', '{}'::jsonb, true, 1)
ON CONFLICT (platform, media_unit_id, name) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled, updated_at = NOW();
```

> `credentials='{}'` لأن الـ provider يستخدم `.env` كـ fallback

### تفعيل موقع خارجي:

```sql
INSERT INTO auto_publish_targets (media_unit_id, name, api_url, api_token, default_category_id, is_enabled)
VALUES (1, 'موقع هنا غزة', 'https://hgaza.nn.ps/api/v1/automation/news', 'TOKEN_HERE', 1, true);
```

### تفعيل النشر التلقائي:

```sql
INSERT INTO system_settings (key, value) VALUES ('auto_publish_enabled', 'true')
ON CONFLICT (key) DO UPDATE SET value = 'true';
```

---

## إضافة منصة جديدة

1. أنشئ `src/services/publishing/providers/NEW.provider.ts` ينفذ `IPublishingProvider`
2. سجّله في `providers/index.ts`
3. أضف النوع في `types.ts` → `PublishingPlatform`
4. أضف القيود في `PLATFORM_CONSTRAINTS`
5. أضف صف في `platform_configs` بالداتابيس

**هذا كل شيء** — الـ retry, logs, race protection, archive كلها تعمل تلقائياً.

---

## ملخص التتبع (Tracking Summary)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ماذا يحصل في الداتابيس عند كل عملية                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📥 خبر جديد يوصل:                                                      │
│     raw_data ← INSERT (fetch_status: 'fetched')                          │
│                                                                          │
│  🤖 تصنيف + توجيه:                                                      │
│     raw_data ← UPDATE (category_id, content, fetch_status: 'processed')  │
│     editorial_queue ← INSERT (status: pending/incomplete)                │
│                                                                          │
│  ✅ موافقة (أوتوماتيكي أو يدوي):                                        │
│     editorial_queue ← UPDATE (status: 'approved')                        │
│     published_items ← INSERT (is_active: true)                           │
│                                                                          │
│  🌐 نشر خارجي:                                                          │
│     auto_publish_log ← INSERT (status, external_url, external_id)        │
│     raw_data ← UPDATE (publish_status: 'published_external')             │
│                                                                          │
│  📘 نشر سوشال:                                                          │
│     publishing_status ← INSERT/UPDATE (status: publishing → success)     │
│     publishing_logs ← INSERT (processing → success/failed)               │
│     raw_data ← UPDATE (publish_status: 'published_social')               │
│                                                                          │
│  📦 أرشفة:                                                               │
│     raw_data ← UPDATE (publish_status: 'archived')                       │
│     published_items ← UPDATE (is_active: false)                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

*آخر تحديث: مايو 2026*
