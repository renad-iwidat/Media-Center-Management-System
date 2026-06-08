# طبقة المزامنة المستقرة — NewsDesk API ↔ الداتابيس المحلي

## الهدف
بناء طبقة مزامنة مستقرة تعمل كل 5 دقائق:
- تسحب من NewsDesk API الخارجي وتخزّن في الداتابيس المحلي
- الـ Frontend يقرأ **فقط** من الداتابيس المحلي
- كل خبر مرتبط بوحدته الإعلامية + تصنيفه + نطاقه الجغرافي + وسومه

---

## المبدأ الأساسي: الاعتماد على `slug` وليس `id`

المشكلة السابقة: الكود كان يعتمد على معرّفات ثابتة (`category_id = 1, 2, 3...`) لتحديد الـ flow.
عند حذف الجداول وإعادة المزامنة، الـ IDs تتغيّر → الربط يفسد.

**الحل:** كل المزامنة والتوجيه تعتمد على `slug` (مستقر) بدلاً من `id` (متغيّر).

---

## 🆕 التحسينات الجديدة (v2)

### 1. Incremental Sync (التحديث التدريجي)
- **جدول `sync_state`**: يخزّن `last_sync_at` و `last_article_date` لكل وحدة إعلامية
- **date_from ديناميكي**: بدلاً من "آخر ساعتين" الثابت:
  - أول مزامنة → آخر 7 أيام
  - بعدها → ساعة قبل آخر مزامنة ناجحة (overlap للأمان)
- **لا يُفوّت أخبار**: حتى لو النظام كان متوقف عدة أيام
- **يتوقف عند انتهاء البيانات**: إذا الصفحة فاضية يتوقف

### 2. Sync Logging (تسجيل المزامنة في الداتابيس)
- **جدول `sync_logs`**: يسجل كل عملية مزامنة (بداية/انتهاء/نجاح/فشل)
- يحفظ: `articles_fetched`, `articles_saved`, `articles_skipped`, `errors[]`, `duration_ms`
- **تنظيف تلقائي**: حذف سجلات أقدم من 30 يوم (كل 10 دورات)
- **API Endpoints**:
  - `GET /api/newsdesk/sync/status` → حالة كل الوحدات + إحصائيات 24 ساعة
  - `GET /api/newsdesk/sync/logs?limit=50` → آخر سجلات المزامنة

### 3. Retry + Rate Limiting المحسّن
- **NewsDesk API Client**: retry 3 مرات مع exponential backoff
- **Rate Limiting**: إذا 429 → انتظار `retry-after` ثم إعادة المحاولة
- **لا يعيد المحاولة على 4xx** (client errors) — فقط network/5xx/429
- **Pagination محسّنة**: حتى 10 صفحات (بدلاً من 5) + يتوقف إذا فاضية

---

## الملف الجديد: `src/services/news/newsdesk-sync.service.ts`

طبقة المزامنة الموحّدة. الدالة الرئيسية `syncAll()`:

```
syncAll()
  ├─ syncCategories()        → categories (بالـ slug + flow الصحيح)
  ├─ syncGeoScopes()         → geographic_scopes (بالـ slug)
  ├─ syncMediaUnitsAndSources() → media_units + sources + media_unit_sources
  └─ backfillRawDataLinks()  → إصلاح الأخبار القديمة الناقصة الروابط
```

### `backfillRawDataLinks()` — إصلاح البيانات الناقصة
يربط الأخبار الموجودة (raw_data) اللي اتخزنت بدون روابط:
1. `geo_scope_id` ← من `geo_scope_slug`
2. `category_id` ← من `category_slug`
3. `source_id` ← من `source_slug`
4. `media_unit_id` ← من المصدر (عبر `media_unit_sources`)

### `CATEGORY_FLOW_BY_SLUG` — خريطة الـ flow المستقرة
```
editorial: politics, society, security, other, religion
automated: economy, sports, health, technology, culture, environment, food
```

---

## التعديلات على الملفات الموجودة

### 1. `src/services/news/scheduler.service.ts`
- `syncFromExternalApi()` صار يستدعي `newsDeskSyncService.syncAll()` (الطبقة الموحّدة)
- الـ interval الافتراضي = 5 دقائق
- المرحلة 0 (المزامنة) تعمل قبل السحب في كل دورة

### 2. `src/services/news/flow-router.service.ts`
- `getActiveCategories()` صار يجيب عمود `flow`
- تحديد الـ flow يعتمد أولاً على `categories.flow` من الداتابيس → ثم fallback للـ map
- `autoPublishStuckItems()` صار يستخدم `c.flow = 'automated'` في الـ query (بدل IDs ثابتة)

### 3. `src/services/news/auto-publish.service.ts`
- `getUnpublishedForTarget()` صار يستخدم `c.flow = 'automated'` (بدل CATEGORY_FLOW_MAP)
- حُذف `CATEGORY_FLOW_MAP` غير المستخدم

### 4. `src/services/news/news-pipeline.service.ts`
- `runGlobalPipeline()` (fallback) صار يربط `media_unit_id` من المصدر عبر `getMediaUnitsBySourceId`

### 5. `src/services/database/database.service.ts`
- `findOrCreateBySlug()` يضمن وجود `source_type_id = 2` + يتعامل مع URL فاضي

### 6. `src/index.ts`
- seed لـ `source_types` (8 أنواع) + `system_settings` (6 إعدادات) عند البدء

---

## دورة المزامنة الكاملة (كل 5 دقائق)

```
┌────────────────────────────────────────────────────────────┐
│  المرحلة 0: المزامنة (newsDeskSyncService.syncAll)          │
│    1. categories    ← GET /categories                       │
│    2. geo_scopes     ← GET /geographic-scopes               │
│    3. media_units    ← GET /admin/media-units               │
│       + sources + media_unit_sources                        │
│    4. backfill: إصلاح روابط raw_data القديمة                │
├────────────────────────────────────────────────────────────┤
│  المرحلة 1: سحب الأخبار (news-pipeline)                     │
│    - لكل وحدة: GET /articles/by-media-unit/{slug}           │
│    - لكل خبر جديد: GET /articles/{id}                        │
│    - فلترة المكرر (newsdesk_article_id + url)               │
│    - حفظ في raw_data (source_id + media_unit_id +           │
│      category_slug + geo_scope_slug + tags + ...)           │
├────────────────────────────────────────────────────────────┤
│  المرحلة 2: المعالجة (flow-router)                          │
│    - تصنيف AI للأخبار بدون category                         │
│    - توجيه حسب categories.flow → editorial / automated      │
│    - توزيع على editorial_queue حسب الوحدة                   │
├────────────────────────────────────────────────────────────┤
│  المرحلة 3: نشر الأخبار الأوتوماتيكية العالقة               │
│  المرحلة 4: النشر التلقائي الخارجي                          │
└────────────────────────────────────────────────────────────┘
```

---

## منع التكرار (Deduplication)

| المستوى | الآلية |
|---|---|
| الأخبار | `existsByNewsDeskId(id)` + `existsByUrl(url)` قبل الجلب |
| الأخبار | `existsBySimilarity(title, content)` قبل الحفظ |
| المصادر | `findOrCreateBySlug` — بحث بالـ slug ثم name ثم url |
| الوحدات | `upsertMediaUnit` — بحث بالـ slug |
| التصنيفات | `SELECT WHERE slug` ثم INSERT/UPDATE |
| النطاقات | `SELECT WHERE slug` ثم INSERT/UPDATE |
| الربط | `media_unit_sources` عنده `UNIQUE(media_unit_id, source_id)` |

---

## التحقق من سلامة البيانات

بعد كل مزامنة:
- ✅ كل خبر له `source_id` (من المصدر المربوط)
- ✅ كل خبر له `media_unit_id` (من الوحدة أو عبر المصدر)
- ✅ كل خبر له `category_id` (من الـ slug أو تصنيف AI)
- ✅ كل خبر له `geo_scope_id` (من الـ slug)
- ✅ الـ tags محفوظة (من `keywords` المحوّلة)
- ✅ الحالة (`fetch_status`) صحيحة

---

## الـ Frontend يقرأ من الداتابيس فقط

| الصفحة | API | المصدر |
|---|---|---|
| OverviewView | `/flow/*`, `/data/statistics` | الداتابيس |
| QueueView | `/flow/editorial` | الداتابيس |
| PublishedView | `/flow/published` | الداتابيس |
| IncompleteView | `/data/articles/incomplete` | الداتابيس |
| SourcesView | `/sources` + `/newsdesk/*` (للعرض فقط) | الداتابيس + API |

> الـ `/newsdesk/*` endpoints تُستخدم فقط لعرض حالة الـ API والمزامنة اليدوية،
> أما بيانات الأخبار الفعلية فكلها من الداتابيس المحلي.
