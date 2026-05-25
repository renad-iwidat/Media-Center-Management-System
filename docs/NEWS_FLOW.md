# 📰 فلو سحب ومعالجة الأخبار — بناءً على الوحدات الإعلامية

## النظرة العامة

```
                    ┌─────────────────────────────────────────────────────┐
                    │           NewsDesk API (خارجي)                       │
                    └──────────┬─────────────────────────┬────────────────┘
                               │                         │
                    Step 1:    │              Step 2:     │
                    القائمة    │              التفاصيل   │
                               │                         │
              /articles/by-media-unit/{slug}    /articles/{id}
              (id, title, summary, category)    (text, classifications, ...)
                               │                         │
                    ┌──────────▼─────────────────────────▼────────────────┐
                    │  Pipeline — لكل وحدة إعلامية:                        │
                    │  1. جلب القائمة → فلترة المكرر                       │
                    │  2. جلب التفاصيل الكاملة (النص + التصنيفات)          │
                    │  3. ربط المصدر                                       │
                    │  4. حفظ مع media_unit_id                            │
                    └──────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────────────────┐
                    │  raw_data (fetch_status = 'fetched')                 │
                    │  + media_unit_id (الوحدة التي سحبت الخبر)           │
                    │  + content = النص الكامل (من /articles/{id})         │
                    └──────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────────────────────┐
                    │  FlowRouter — التوزيع حسب الوحدة:                   │
                    │  • إذا media_unit_id موجود → يروح لها فقط           │
                    │  • إذا لا → يبحث عن الوحدات المرتبطة بالمصدر       │
                    │  • Fallback → كل الوحدات النشطة                     │
                    └──────────────┬──────────────────────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
    editorial_queue       editorial_queue       editorial_queue
    (وحدة إعلامية 1)     (وحدة إعلامية 2)     (وحدة إعلامية N)
              │                    │                    │
              ▼                    ▼                    ▼
    published_items       published_items       published_items
```

---

## البنية الجديدة — العلاقات

```
┌──────────────┐     ┌────────────────────┐     ┌──────────────┐
│ media_units  │     │ media_unit_sources │     │   sources    │
│              │     │ (جدول ربط)         │     │              │
│ id           │◄────│ media_unit_id      │     │ id           │
│ name         │     │ source_id ─────────│────►│ slug         │
│ slug         │     │ priority           │     │ name         │
│ is_active    │     │ is_active          │     │ url          │
└──────────────┘     └────────────────────┘     │ is_active    │
       │                                         └──────────────┘
       │                                                │
       │  ┌──────────────────────────────────────────┐  │
       └─►│            raw_data                       │◄─┘
          │ media_unit_id (الوحدة التي سحبت الخبر)   │
          │ source_id (المصدر)                        │
          │ category_id, geo_scope_id                 │
          │ title, content, summary                   │
          │ fetch_status                              │
          └──────────────┬───────────────────────────┘
                         │
          ┌──────────────▼───────────────────────────┐
          │        editorial_queue                     │
          │ media_unit_id (الوحدة المستهدفة)          │
          │ raw_data_id                               │
          │ status (pending/approved/incomplete)       │
          └──────────────┬───────────────────────────┘
                         │
          ┌──────────────▼───────────────────────────┐
          │        published_items                     │
          │ media_unit_id                             │
          │ raw_data_id                               │
          │ title, content, tags                      │
          └──────────────────────────────────────────┘
```

---

## المرحلة 1: السحب من API — بناءً على الوحدات الإعلامية (Two-Step)

**المسؤول:** `news-pipeline.service.ts` + `scheduler.service.ts`

```
┌─────────────────────────────────────────────────────────┐
│  Scheduler (كل 15 دقيقة — حسب system_settings)         │
│                                                         │
│  1. جلب الوحدات الإعلامية النشطة مع مصادرها            │
│     (من media_unit_sources)                             │
│                                                         │
│  2. لكل وحدة إعلامية — Step 1 (القائمة):               │
│     ├─ GET /articles/by-media-unit/{slug}               │
│     │  (يرجع قائمة: id, title, summary, category...)   │
│     │  ⚠️ بدون النص الكامل (text)                       │
│     └─ فحص تكرار (newsdesk_article_id + url)            │
│                                                         │
│  3. لكل مقالة جديدة — Step 2 (التفاصيل):              │
│     ├─ GET /articles/{id}                               │
│     │  (يرجع كل شي: text + classifications + ...)      │
│     ├─ ربط المصدر (sources — findOrCreateBySlug)        │
│     ├─ ربط التصنيف (categories — بالـ slug)             │
│     └─ ربط المنطقة (geographic_scopes — بالـ slug)      │
│                                                         │
│  4. حفظ بـ raw_data مع media_unit_id                    │
│     (fetch_status = 'fetched')                          │
│                                                         │
│  5. إذا ما في وحدات مربوطة → fallback سحب عام          │
└─────────────────────────────────────────────────────────┘
```

**لماذا Two-Step؟**
- `/articles/by-media-unit/{slug}` يرجع القائمة بدون `text` (النص الكامل)
- `/articles/{id}` يرجع المقالة الكاملة مع `text` + `classifications`
- هيك بنضمن ما يضيع أي بيانات

**النتيجة:** أخبار جديدة بجدول `raw_data` بستيتوس `fetched` + `media_unit_id` + نص كامل

---

## المرحلة 2: المعالجة والتوجيه

**المسؤول:** `flow-router.service.ts`

```
┌─────────────────────────────────────────────────────────┐
│  FlowRouter (يشتغل بعد السحب مباشرة)                   │
│                                                         │
│  يجلب كل raw_data WHERE fetch_status = 'fetched'        │
│                                                         │
│  لكل خبر:                                               │
│  ┌───────────────────────────────────────────────┐      │
│  │ 1. تحديد الوحدات المستهدفة:                   │      │
│  │    ├─ media_unit_id موجود → هي فقط            │      │
│  │    ├─ source_id → الوحدات المرتبطة بالمصدر    │      │
│  │    └─ Fallback → كل الوحدات النشطة            │      │
│  │                                                │      │
│  │ 2. تصنيف (إذا category_id = NULL)             │      │
│  │    ├─ classifier_enabled = true → AI           │      │
│  │    └─ لا → يبقى بدون تصنيف (editorial)        │      │
│  │                                                │      │
│  │ 3. فحص اكتمال المحتوى                         │      │
│  │    └─ content.length >= 100 حرف?               │      │
│  │                                                │      │
│  │ 4. تحديد نوع الفلو (من category.flow)          │      │
│  │    ├─ automated (اقتصاد، رياضة، صحة...)       │      │
│  │    └─ editorial (سياسة، مجتمع، أمن...)         │      │
│  │                                                │      │
│  │ 5. التوزيع على الوحدات المستهدفة فقط          │      │
│  └───────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## المرحلة 3: طابور التحرير

**الجدول:** `editorial_queue`

```
┌─────────────────────────────────────────────────────────┐
│  حسب نتيجة المرحلة 2:                                  │
│                                                         │
│  ⚠️ ناقص → status = 'incomplete' (ينتظر المحرر)        │
│  📝 تحريري + مكتمل → status = 'pending' (ينتظر موافقة) │
│  ⚡ أوتوماتيكي + مكتمل → approved → published_items     │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints — إدارة ربط المصادر بالوحدات

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data/media-units/with-sources` | كل الوحدات مع مصادرها |
| GET | `/api/data/media-units/:slug/sources` | مصادر وحدة محددة |
| POST | `/api/data/media-units/:slug/sources` | ربط مصدر بوحدة |
| DELETE | `/api/data/media-units/:slug/sources/:sourceId` | إلغاء ربط مصدر |
| POST | `/api/data/media-units/:slug/sources/sync` | مزامنة من NewsDesk API |
| GET | `/api/data/media-units/:slug/articles` | أخبار وحدة (منشورة) |

**POST /api/data/media-units/:slug/sources — Body:**
```json
{
  "source_id": 5,
  "priority": 1
}
```

---

## ملخص الستيتوسات (fetch_status)

| الستيتوس | المعنى | المرحلة |
|----------|--------|---------|
| `fetched` | تم السحب من API — ينتظر المعالجة | بعد المرحلة 1 |
| `processed` | تمت المعالجة — بالطابور | بعد المرحلة 2 |
| `published` | تم النشر | بعد المرحلة 4 |

---

## الأوامر

| الأمر | الوظيفة |
|--------|---------|
| `npm run news:fetch` | سحب من API + حفظ (دورة واحدة) |
| `npm run news:save` | سحب + حفظ (مع pipeline كامل) |
| `npm run sources:sync` | مزامنة المصادر من API |
| `npm run scheduler` | تشغيل الجدولة التلقائية |
| `npm run classify` | تصنيف الأخبار بدون تصنيف |
| `npm run flow:process` | معالجة وتوجيه الأخبار |

---

## الإعدادات (system_settings)

| الإعداد | القيمة | الوظيفة |
|---------|--------|---------|
| `scheduler_enabled` | true/false | تشغيل/إيقاف السحب التلقائي |
| `scheduler_interval_minutes` | 15 | الفاصل بين كل دورة |
| `articles_per_source` | 20 | حجم الصفحة من الـ API |
| `classifier_enabled` | true/false | تشغيل/إيقاف التصنيف المحلي |
| `flow_enabled` | true/false | تشغيل/إيقاف التوجيه |

---

## Migration SQL

لتطبيق التغييرات على الداتابيس:
```bash
psql $DATABASE_URL -f sql/create_media_unit_sources.sql
```

هذا يُنشئ:
1. جدول `media_unit_sources` (ربط المصادر بالوحدات)
2. عمود `media_unit_id` في `raw_data`
3. عمود `slug` في `media_units`
