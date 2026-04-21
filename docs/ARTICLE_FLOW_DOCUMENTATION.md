# توثيق فلو الأخبار الكامل
## من لحظة السحب / الإدخال حتى النشر

---

## نظرة عامة

```
المصدر (RSS / Manual Input)
        │
        ▼
  ┌─────────────┐
  │  المرحلة 1  │  سحب الأخبار  (rss-pipeline.service)
  └─────────────┘
        │
        ▼
  ┌─────────────┐
  │  المرحلة 2  │  تصنيف + حفظ  (article-saver.service)
  └─────────────┘
        │
        ▼
  ┌─────────────┐
  │  المرحلة 3  │  توجيه الفلو  (flow-router.service)
  └─────────────┘
        │
   ┌────┴────┐
   ▼         ▼
أوتوماتيكي  تحريري
   │         │
   ▼         ▼
published  editorial
 _items     _queue
```

---

## الجداول المستخدمة

| الجدول | الدور |
|--------|-------|
| `sources` | مصادر الأخبار (RSS feeds + manual input) |
| `source_types` | أنواع المصادر (rss, user_input_text, ...) |
| `categories` | الفئات مع تحديد الفلو (automated / editorial) |
| `media_units` | وحدات الإعلام التي تُنشر إليها الأخبار |
| `raw_data` | مستودع جميع الأخبار المسحوبة قبل النشر |
| `editorial_queue` | طابور انتظار المحرر |
| `published_items` | الأخبار المنشورة نهائياً |
| `system_settings` | إعدادات التشغيل (تفعيل/إيقاف كل مرحلة) |

---

## المرحلة 1 — سحب الأخبار
**الخدمة:** `rss-pipeline.service.ts`  
**المُشغِّل:** `scheduler.service.ts` كل X دقيقة (من `system_settings`)

### الخطوات:
1. قراءة `system_settings.scheduler_enabled` — إذا `false` توقف
2. جلب المصادر النشطة من `sources` (حيث `is_active = true`)
3. سحب الأخبار من كل مصدر RSS بشكل **parallel**
4. تحديث `sources.last_fetched` لكل مصدر تم سحبه
5. فلترة الأخبار الموجودة مسبقاً عبر `raw_data.url` (تجنب التكرار)
6. فلترة التكرار بالعنوان/المحتوى عبر `RawDataService.existsBySimilarity`

### الجداول المقروءة:
- `system_settings` ← `scheduler_enabled`, `articles_per_source`
- `sources` ← المصادر النشطة

### الجداول المكتوب عليها:
- `sources.last_fetched` ← تحديث وقت آخر سحب

### الناتج:
قائمة أخبار جديدة في الذاكرة (لم تُحفظ بعد)

---

## المرحلة 2 — تصنيف + حفظ
**الخدمة:** `article-saver.service.ts`

### الخطوات:
1. **تصنيف AI:** الأخبار التي ليس لمصدرها `default_category_id` → ترسل لـ AI Model
   - AI يرجع اسم الفئة → يُحوَّل لـ `category_id`
   - إذا فشل AI → fallback: `category_id = 1` (محلي)
2. **الأخبار بتصنيف افتراضي:** تأخذ `default_category_id` من المصدر مباشرة
3. **حفظ في `raw_data`** بـ `fetch_status = 'fetched'`

### الأعمدة المكتوبة في `raw_data`:

| العمود | القيمة |
|--------|--------|
| `source_id` | معرّف المصدر |
| `source_type_id` | نوع المصدر (rss=1..5, user_input=6/7/8) |
| `category_id` | من AI أو default_category |
| `url` | رابط الخبر |
| `title` | العنوان |
| `content` | المحتوى (description من RSS) |
| `image_url` | صورة الخبر |
| `tags` | الوسوم |
| `fetch_status` | **`'fetched'`** ← القيمة الأولية |
| `pub_date` | تاريخ النشر الأصلي |
| `is_incomplete` | `false` (القيمة الافتراضية) |

---

## المرحلة 3 — توجيه الفلو
**الخدمة:** `flow-router.service.ts`

### الشرط الأساسي:
يعمل على الأخبار التي `fetch_status = 'fetched'` فقط

### شجرة القرار لكل خبر:

```
الخبر (fetch_status = 'fetched')
        │
        ▼
  content.length < 300 ؟
  ├── نعم ──► is_incomplete = true
  │           fetch_status يبقى 'fetched'
  │           ← يظهر في تاب "أخبار ناقصة"
  │
  └── لا ──► is_incomplete = false
              │
              ▼
        source_type_id ∈ {6, 7, 8} ؟  (user_input)
        ├── نعم ──► editorial_queue (إجباري)
        │           fetch_status = 'processed'
        │
        └── لا ──► category.flow = ?
                    │
                    ├── 'automated' ──► AI تنظيف المحتوى
                    │                   └──► published_items
                    │                        fetch_status = 'processed'
                    │
                    └── 'editorial' ──► editorial_queue
                                        fetch_status = 'processed'
```

### الجداول المقروءة:
- `raw_data` ← الأخبار بـ `fetch_status = 'fetched'`
- `categories` ← `flow` (automated/editorial)
- `media_units` ← الوحدات النشطة
- `system_settings` ← `flow_enabled`

### الجداول المكتوب عليها:

**`raw_data`** — تحديثات:

| العمود | القيمة | متى |
|--------|--------|-----|
| `is_incomplete` | `true` | محتوى < 300 حرف |
| `is_incomplete` | `false` | محتوى ≥ 300 حرف |
| `fetch_status` | `'processed'` | بعد التوجيه الناجح |

**`published_items`** — إدراج (المسار الأوتوماتيكي):

| العمود | القيمة |
|--------|--------|
| `media_unit_id` | معرّف وحدة الإعلام |
| `raw_data_id` | معرّف الخبر الأصلي |
| `queue_id` | `NULL` (لا يمر بالطابور) |
| `content_type_id` | `1` (خبر) |
| `title` | العنوان |
| `content` | المحتوى **المنظَّف بالـ AI** |
| `tags` | الوسوم |
| `is_active` | `true` |
| `published_at` | `NOW()` |

**`editorial_queue`** — إدراج (المسار التحريري):

| العمود | القيمة |
|--------|--------|
| `media_unit_id` | معرّف وحدة الإعلام |
| `raw_data_id` | معرّف الخبر الأصلي |
| `policy_id` | `NULL` (يحدده المحرر لاحقاً) |
| `status` | `'pending'` |
| `created_at` | `NOW()` |
| `updated_at` | `NOW()` |

---

## تفاصيل المسار الأوتوماتيكي — تنظيف المحتوى
**الخدمة:** `content-cleaner.service.ts`

قبل النشر، يُرسَل المحتوى لـ AI Model بالبرومبت التالي:
- حذف الجمل الترويجية ("تابعونا...", "اقرأ أيضاً...")
- حذف أسماء القنوات والمنصات بصيغة ترويجية
- حذف الروابط والهاشتاغات والرموز غير الصحفية
- الحفاظ على المحتوى الصحفي والاقتباسات والأسماء والأرقام
- عدم إعادة الصياغة — تنظيف فقط

**Fallback:** إذا فشل AI أو رجع نص فارغ أو أقصر من 30% من الأصلي → يُستخدم النص الأصلي

---

## تفاصيل المسار التحريري — بعد editorial_queue
بعد إضافة الخبر لـ `editorial_queue` بحالة `pending`، يتولى المحرر:

1. يرى الخبر في "استوديو التحرير"
2. يطبّق سياسات التحرير عبر AI (`editorial-policy.service.ts`)
3. يعدّل المحتوى حسب ما يراه مناسباً
4. ينشر → يُدرج في `published_items`

---

## أنواع المصادر (source_types)

| id | name | الفلو |
|----|------|-------|
| 1-5 | RSS feeds | حسب الفئة |
| 6 | user_input_text | editorial إجباري |
| 7 | user_input_audio | editorial إجباري |
| 8 | user_input_video | editorial إجباري |

---

## الفئات وفلوها (categories)

| id | name | flow |
|----|------|------|
| 1 | محلي | editorial |
| 2 | دولي | editorial |
| 3 | اقتصاد | automated |
| 4 | رياضة | automated |
| 5 | صحة | automated |
| 6 | علوم وتكنولوجيا | automated |
| 7 | فن و ثقافة | automated |
| 9 | بيئة | automated |
| 10 | غذاء | automated |
| 11 | سياسي | editorial |

---

## حالات fetch_status في raw_data

| الحالة | المعنى |
|--------|--------|
| `'fetched'` | تم الحفظ، بانتظار الفلو |
| `'processed'` | تم التوجيه (للنشر أو للطابور) |

> الأخبار الناقصة (is_incomplete = true) تبقى بحالة `'fetched'` ولا تنتقل لـ `'processed'`

---

## إعدادات النظام المؤثرة (system_settings)

| المفتاح | الوصف | القيمة الافتراضية |
|---------|-------|------------------|
| `scheduler_enabled` | تفعيل/إيقاف السحب التلقائي | `true` |
| `scheduler_interval_minutes` | الفاصل الزمني بين الدورات | `15` |
| `articles_per_source` | عدد الأخبار لكل مصدر | `20` |
| `classifier_enabled` | تفعيل/إيقاف تصنيف AI | `true` |
| `flow_enabled` | تفعيل/إيقاف توجيه الفلو | `true` |

---

## الخدمات والملفات

| الملف | الدور |
|-------|-------|
| `scheduler.service.ts` | يشغّل الدورات الدورية ويرتّب المراحل |
| `rss-pipeline.service.ts` | سحب RSS وفلترة المكررات |
| `article-saver.service.ts` | تصنيف AI وحفظ في raw_data |
| `flow-router.service.ts` | توجيه الأخبار للمسار الصحيح |
| `content-cleaner.service.ts` | تنظيف المحتوى قبل النشر الأوتوماتيكي |
| `ai-classifier.service.ts` | تصنيف الأخبار بالفئة المناسبة |
| `editorial-policy.service.ts` | تطبيق سياسات التحرير عبر AI |
