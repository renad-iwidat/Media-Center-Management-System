# نظام النشر المتعدد المنصات — Multi-Platform Publishing System (v2)

## ملخص

نظام نشر احترافي متكامل يدعم النشر على عدة منصات مع حماية كاملة من:
- **Race Conditions** — PostgreSQL Advisory Lock
- **Double-Click** — حالة "publishing" حقيقية في DB
- **النشر المكرر** — UNIQUE constraint + فحص قبل النشر
- **الفشل** — Retry مع Exponential Backoff + Dead-Letter Queue

---

## التحسينات (v2)

| المشكلة | الحل |
|---------|------|
| Race Condition (طلبين متزامنين) | `pg_advisory_xact_lock` داخل transaction |
| Double-click publish | حالة `publishing` حقيقية في DB — الطلب الثاني يرجع "قيد النشر" |
| تكرار مفهوم status vs logs | **status = source of truth** (آخر حالة)، **logs = history** (audit trail) |
| أرشفة تلقائية خطرة | الأرشفة = **business rule يدوي** فقط (endpoint مخصص) |
| Instagram limitations | فحص constraints قبل النشر (requires_image, business_account) |
| لا retry strategy | **3 محاولات** مع exponential backoff (2s→4s→8s) + dead-letter |

---

## البنية المعمارية

```
src/services/publishing/
├── types.ts                          ← الأنواع + PLATFORM_CONSTRAINTS + RetryConfig
├── index.ts                          ← تصدير الموديول
├── publishing.service.ts             ← الخدمة الرئيسية (v2)
├── publishing-db.migration.ts        ← Migration (v2 — مع retry columns)
└── providers/                        ← Strategy Pattern
    ├── base-provider.ts              ← IPublishingProvider interface
    ├── index.ts                      ← Provider Registry
    ├── external-website.provider.ts
    ├── facebook.provider.ts
    ├── instagram.provider.ts
    └── twitter.provider.ts

src/controllers/publishing/
└── publishing.controller.ts          ← REST Controller (v2)

src/routes/publishing/
└── publishing.routes.ts              ← Express Routes (v2)
```

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


**الإعدادات (قابلة للتعديل):**
```typescript
DEFAULT_RETRY_CONFIG = {
  max_retries: 3,
  base_delay_ms: 2000,    // 2s → 4s → 8s
  max_delay_ms: 30000,    // حد أقصى 30 ثانية
}
```

**Dead-Letter Queue:**
- المقالات التي فشلت ≥ 3 مرات تبقى في حالة `failed` مع `retry_count >= 3`
- يمكن مراجعتها عبر `GET /api/publishing/dead-letter`
- يمكن إعادة تعيينها يدوياً عبر `POST /api/publishing/set-status`

---

## Source of Truth

| الجدول | الدور | متى يُقرأ |
|--------|-------|-----------|
| `publishing_status` | **الحالة الحالية** — آخر state لكل مقال/منصة | عند فحص "هل منشور؟" |
| `publishing_logs` | **التاريخ** — كل محاولة بالتفاصيل | عند المراجعة والتدقيق |

**القاعدة:**
- لمعرفة "هل المقال منشور على فيسبوك؟" → اقرأ `publishing_status`
- لمعرفة "كم مرة حاولنا ننشره؟" → اقرأ `publishing_logs`

---

## Archive = Business Rule

**قبل (v1):** الأرشفة تلقائية بعد النشر ← خطر!
**بعد (v2):** الأرشفة **يدوية فقط** عبر:

```bash
POST /api/publishing/archive/:articleId
```

**شروط الأرشفة:**
- المقال لازم يكون منشور بنجاح على منصة واحدة على الأقل
- إذا مش منشور → يرجع خطأ

---

## Platform Constraints

```bash
GET /api/publishing/constraints
```

```json
{
  "instagram": {
    "requires_image": true,
    "requires_business_account": true,
    "max_content_length": 2200,
    "supported_media_types": ["image", "video"],
    "notes": [
      "يتطلب Instagram Business/Creator Account",
      "يتطلب صورة أو فيديو إجبارياً — لا يدعم نص فقط",
      "الصورة لازم تكون URL عام (publicly accessible)",
      "الحساب لازم يكون مربوط بصفحة فيسبوك"
    ]
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
  }
}
```

**الفحص يحصل تلقائياً قبل النشر:**
- إذا المقال بدون صورة + المنصة Instagram → خطأ فوري بدون محاولة

---

## Stale Publishing Cleanup

حالات "publishing" العالقة (أكثر من 5 دقائق) تُنظف تلقائياً:

```bash
POST /api/publishing/cleanup
```

هذا يحل مشكلة: لو السيرفر وقع أثناء النشر، المقال يبقى "publishing" للأبد.
الـ cleanup يحوّلها إلى "failed" عشان تقدر تعيد المحاولة.

---

## دورة حياة المقال (Status Lifecycle)

```
┌─────────┐     ┌──────────────────┐     ┌────────────┐
│  draft  │ ──→ │ ready_for_publish │ ──→ │ publishing │ (lock state)
└─────────┘     └──────────────────┘     └────────────┘
                                               │
                                          ┌────┴────┐
                                        نجاح      فشل
                                          │         │
                                          ▼         ▼
                                   ┌────────────┐  يرجع إلى
                                   │ published_ │  ready_for_publish
                                   │ social/ext │
                                   └────────────┘
                                          │
                                    (يدوي فقط)
                                          ▼
                                   ┌──────────┐
                                   │ archived │
                                   └──────────┘
```

---

## API Endpoints الكاملة

Base URL: `/api/publishing/`

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

---

## جداول الداتابيس (v2)

### `publishing_status` — Source of Truth

| العمود | الوصف |
|--------|-------|
| article_id | معرف المقال |
| platform_config_id | إعداد المنصة |
| **status** | `publishing` / `success` / `failed` |
| retry_count | عدد المحاولات (0-3) |
| last_retry_at | آخر محاولة |
| external_post_id | معرف المنشور على المنصة |
| external_url | رابط المنشور |

**UNIQUE:** `(article_id, platform_config_id)`

### `publishing_logs` — Audit Trail

| العمود | الوصف |
|--------|-------|
| article_id | معرف المقال |
| platform_config_id | إعداد المنصة |
| status | `processing` / `success` / `failed` |
| **retry_attempt** | رقم المحاولة (0, 1, 2...) |
| attempted_at | وقت المحاولة |
| completed_at | وقت الانتهاء |

---

## متغيرات البيئة

```env
# Facebook Publishing (Autonews Page)
FACEBOOK_PAGE_ID=961852527016202
FACEBOOK_ACCESS_TOKEN=EAALZAKaM7VdABRW7tlet1dr9CtrZCJy...
```

---

## إضافة منصة جديدة

1. أنشئ `src/services/publishing/providers/NEW.provider.ts` ينفذ `IPublishingProvider`
2. سجّله في `providers/index.ts`
3. أضف النوع في `types.ts` → `PublishingPlatform`
4. أضف القيود في `PLATFORM_CONSTRAINTS`

**هذا كل شيء** — الـ retry, logs, race protection, archive كلها تعمل تلقائياً.
