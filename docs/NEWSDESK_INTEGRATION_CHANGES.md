# تقرير التحقق والتعديلات — تكامل NewsDesk API

## التأكيدات الأساسية

### ✅ 1. مصدر البيانات = الداتابيس المحلي

**جميع الـ APIs الخاصة بالمشروع تقرأ من الداتابيس المحلي:**

| API Endpoint | مصدر البيانات | الخدمة |
|---|---|---|
| `GET /api/sources` | جدول `sources` | `SourceService.getAll()` |
| `GET /api/data/media-units` | جدول `media_units` | `query('SELECT ... FROM media_units')` |
| `GET /api/data/articles` | جدول `raw_data` | `RawDataService.getAll()` |
| `GET /api/data/categories` | جدول `categories` | `CategoryService.getAll()` |
| `GET /api/flow/editorial` | `editorial_queue` + `raw_data` | `EditorialQueueService` |
| `GET /api/flow/published` | `published_items` + `raw_data` | `PublishedItemsService` |
| `GET /api/flow/queue/stats` | `editorial_queue` + `media_units` | `EditorialQueueService` |
| `GET /api/flow/daily-stats` | `published_items` + `editorial_queue` | `PublishedItemsService` |
| `GET /api/data/articles/incomplete` | `raw_data` + `editorial_queue` | `data.controller` |

**الـ API الخارجي (NewsDesk) يُستخدم فقط لـ:**
- سحب الأخبار الجديدة (عبر `news-pipeline.service.ts` → يحفظ في `raw_data`)
- مزامنة المصادر والوحدات (عبر `POST /api/newsdesk/sync/all` → يحفظ في `sources` + `media_units`)

---

### ✅ 2. حفظ البيانات في الداتابيس

**كيف تُخزّن البيانات:**

```
NewsDesk API الخارجي
    │
    ├─ Scheduler (كل 15 دقيقة):
    │   └─ news-pipeline.service.ts
    │       ├─ GET /articles/by-media-unit/{slug} → قائمة
    │       ├─ GET /articles/{id} → تفاصيل كاملة
    │       └─ article-saver.service.ts → حفظ في raw_data (status='fetched')
    │
    └─ مزامنة يدوية (POST /api/newsdesk/sync/all):
        ├─ GET /admin/media-units → media_units محلي
        ├─ sources → sources محلي
        └─ ربط → media_unit_sources محلي
```

**الجداول المتأثرة:**
| جدول | البيانات المخزنة |
|---|---|
| `raw_data` | الأخبار (title, content, url, image, category_id, media_unit_id, source_id) |
| `sources` | المصادر (name, slug, url, is_active) |
| `media_units` | الوحدات الإعلامية (name, slug, is_active) |
| `media_unit_sources` | ربط المصادر بالوحدات (media_unit_id, source_id, priority) |
| `editorial_queue` | طابور التحرير (media_unit_id, raw_data_id, status) |
| `published_items` | المنشورات (media_unit_id, raw_data_id, title, content) |

---

### ✅ 3. فلترة الوحدات الإعلامية — حالة كل API

#### Backend APIs

| API Endpoint | يدعم `media_unit_id`? | كيف يفلتر |
|---|---|---|
| `GET /api/flow/editorial` | ✅ نعم | `WHERE eq.media_unit_id = $1` |
| `GET /api/flow/published` | ✅ نعم | `WHERE pi.media_unit_id = $1` |
| `GET /api/flow/queue/pending` | ✅ نعم | `WHERE eq.media_unit_id = $1` |
| `GET /api/flow/queue/stats` | ✅ نعم | يعرض إحصائيات لكل وحدة |
| `GET /api/flow/daily-stats` | ✅ نعم | `WHERE pi.media_unit_id = $1` |
| `GET /api/flow/published/stats` | ✅ نعم | `GROUP BY mu.name` |
| `GET /api/data/articles/incomplete` | ✅ **تم إصلاحه** | `WHERE rd.media_unit_id = $1 OR editorial_queue.media_unit_id = $1` |
| `GET /api/data/media-units/with-sources` | ✅ نعم | يعرض كل وحدة مع مصادرها |
| `GET /api/data/media-units/:slug/articles` | ✅ نعم | `WHERE pi.media_unit_id = $1` |
| `GET /api/data/statistics` | ⚠️ عام | إحصائيات النظام الكلية — لا تحتاج فلترة |
| `GET /api/data/articles` | ⚠️ عام | قائمة كل الأخبار — نادر الاستخدام |
| `GET /api/sources` | ⚠️ عام | قائمة المصادر المحلية — لا تحتاج فلترة |

#### Frontend Views

| الصفحة | يمرر `unitId`? | يفلتر بالوحدة? |
|---|---|---|
| `OverviewView` | ✅ نعم | ✅ `getEditorialStudio(unitId)`, `getPublished(unitId)`, `getDailyStats(unitId)` |
| `QueueView` | ✅ نعم | ✅ `getEditorialStudio(unitId)` |
| `PublishedView` | ✅ نعم | ✅ `getPublished(unitId)` |
| `IncompleteView` | ✅ نعم | ✅ `getIncompleteArticles(unitId)` |
| `SourcesView` | — | لا تحتاج (المصادر عامة) |
| `ArchiveView` | ✅ نعم | ✅ يستخدم `unitId` |
| `PoliciesView` | ✅ نعم | ✅ يفلتر حسب الوحدة |

---

## التعديلات المُجراة

### الملفات المعدلة:

#### 1. `src/controllers/news/data.controller.ts`
- **`getIncompleteArticles`** — أصبح يقبل `?media_unit_id` ويفلتر الأخبار الناقصة حسب الوحدة الإعلامية عبر `editorial_queue.media_unit_id` أو `raw_data.media_unit_id`

#### 2. `src/services/news/newsdesk-api.service.ts`
- أُضيفت methods لجلب الوحدات الإعلامية من الـ API الخارجي:
  - `getMediaUnits()`, `getMediaUnitBySlug()`
  - `getAdminMediaUnits()`, `getAdminMediaUnitBySlug()`
  - `syncAllMediaUnitsAndSources()`

#### 3. `src/controllers/news/newsdesk-proxy.controller.ts`
- `listMediaUnits` — proxy لجلب الوحدات من الـ API الخارجي
- `getMediaUnit` — proxy لجلب وحدة واحدة
- `syncAll` — **مزامنة كاملة**: وحدات + مصادر + ربط → الداتابيس المحلي
- `syncSources` — مزامنة المصادر فقط

#### 4. `src/routes/news/newsdesk-proxy.routes.ts`
- `GET /api/newsdesk/media-units`
- `GET /api/newsdesk/media-units/:slug`
- `POST /api/newsdesk/sync/all`
- `POST /api/newsdesk/sync/sources`

#### 5. `frontend/src/services/api.ts`
- أُضيفت API calls:
  - `getNewsDeskSources`, `getNewsDeskMediaUnits`
  - `syncAllFromNewsDesk`, `syncSourcesFromNewsDesk`
  - `getNewsDeskCategories`, `getNewsDeskArticles`
  - `getNewsDeskAdminStats`, `getNewsDeskSchedulerStatus`

#### 6. `frontend/src/components/news/SourcesView.tsx`
- أُعيد كتابته ليعرض:
  - Tab الوحدات الإعلامية (من الـ API الخارجي) مع مصادر كل وحدة
  - Tab المصادر (خارجي + محلي)
  - إحصائيات NewsDesk
  - زر مزامنة لاستيراد كل شي من الـ API إلى الداتابيس المحلي

---

## فلو العمل الكامل

```
1. المزامنة (مرة واحدة أو حسب الحاجة):
   ─────────────────────────────────────────
   POST /api/newsdesk/sync/all
     → يجلب media_units + sources من الـ API الخارجي
     → يحفظ في: media_units, sources, media_unit_sources

2. السحب (كل 15 دقيقة — تلقائي):
   ─────────────────────────────────────────
   Scheduler → news-pipeline.service.ts
     → لكل وحدة إعلامية نشطة (من media_unit_sources):
       → GET /articles/by-media-unit/{slug}
       → GET /articles/{id} (تفاصيل كاملة)
     → article-saver.service.ts → raw_data (fetch_status='fetched', media_unit_id=X)

3. المعالجة (بعد السحب مباشرة):
   ─────────────────────────────────────────
   FlowRouter:
     → يفحص media_unit_id من raw_data
     → يوزع على editorial_queue (لكل وحدة مستهدفة)
     → أوتوماتيكي = auto-publish → published_items
     → تحريري = pending (ينتظر المحرر)

4. العرض (الفرونت اند):
   ─────────────────────────────────────────
   كل الصفحات تمرر selectedMediaUnitId
     → Backend يفلتر بـ media_unit_id
     → النتيجة: بيانات مفلترة حسب الوحدة الإعلامية المختارة
```

---

## ملاحظات

- **لا يوجد أي API يقرأ مباشرة من NewsDesk API** للعرض في الفرونت اند — كل شي يمر عبر الداتابيس المحلي
- المزامنة (`sync/all`) آمنة ويمكن تشغيلها مراراً — تستخدم `ON CONFLICT` / `findOrCreateBySlug`
- لتشغيل المزامنة التلقائية، يمكن إضافتها للـ scheduler كخطوة إضافية (لاحقاً)
