# 🔄 ملخص إعادة هيكلة نظام الأخبار — بناءً على الوحدات الإعلامية

## المشكلة (قبل)

- السحب كان **عام** — يجلب كل الأخبار من الـ API بدون تمييز لأي وحدة إعلامية
- المصادر (`sources`) **مستقلة** — ما في ربط مباشر بين المصدر والوحدة الإعلامية
- التوزيع كان يوزع الخبر على **كل** الوحدات الإعلامية النشطة (بدون تمييز)
- البيانات كانت تُسحب من `/articles/raw` — بدون تصنيف أو تفاصيل كاملة

---

## الحل (بعد)

- السحب يتم **بناءً على الوحدة الإعلامية** — كل وحدة تسحب أخبار مصادرها فقط
- جدول ربط جديد `media_unit_sources` — كل وحدة لها مصادرها الخاصة
- التوزيع يصير **فقط للوحدات المرتبطة** بالمصدر (مش كل الوحدات)
- البيانات تُسحب بـ **Two-Step** لضمان اكتمال المعلومات

---

## Two-Step Approach

```
Step 1: GET /articles/by-media-unit/{slug}
        → قائمة المقالات (id, title, summary, category, source)
        → فلترة المكرر بالـ newsdesk_article_id أو url
        ⚠️ بدون النص الكامل

Step 2: GET /articles/{id}
        → لكل مقالة جديدة: التفاصيل الكاملة
        → text (النص الكامل) + classifications + keywords + ai_confidence
        ✅ بيانات 100% كاملة
```

---

## الملفات الجديدة

| الملف | الوظيفة |
|-------|---------|
| `sql/create_media_unit_sources.sql` | Migration — جدول الربط + أعمدة جديدة |
| `src/services/database/media-unit-source.service.ts` | خدمة إدارة ربط المصادر بالوحدات |
| `src/controllers/news/media-unit-source.controller.ts` | API endpoints لإدارة الربط |

---

## الملفات المعدلة

| الملف | التعديل |
|-------|---------|
| `src/services/news/news-pipeline.service.ts` | أُعيد كتابته — Two-Step per media unit |
| `src/services/news/newsdesk-api.service.ts` | إضافة `getRawArticleById` + تحسين `getArticlesByMediaUnit` |
| `src/services/news/flow-router.service.ts` | التوزيع حسب الوحدة المرتبطة (مش كل الوحدات) |
| `src/services/news/article-saver.service.ts` | حفظ `media_unit_id` مع الخبر |
| `src/services/database/database.service.ts` | `RawDataService.create` يدعم `media_unit_id` |
| `src/models/database/database.models.ts` | إضافة `media_unit_id` للـ interface |
| `src/routes/news/data.routes.ts` | إضافة routes جديدة |
| `docs/NEWS_FLOW.md` | توثيق الفلو الجديد |

---

## تغييرات الداتابيس

```sql
-- جدول ربط المصادر بالوحدات (Many-to-Many)
CREATE TABLE media_unit_sources (
  id              SERIAL PRIMARY KEY,
  media_unit_id   INTEGER NOT NULL REFERENCES media_units(id),
  source_id       INTEGER NOT NULL REFERENCES sources(id),
  priority        INTEGER DEFAULT 1,
  is_active       BOOLEAN DEFAULT true,
  UNIQUE(media_unit_id, source_id)
);

-- عمود جديد في raw_data — الوحدة التي سحبت الخبر
ALTER TABLE raw_data ADD COLUMN media_unit_id INTEGER REFERENCES media_units(id);

-- عمود slug في media_units — للربط مع NewsDesk API
ALTER TABLE media_units ADD COLUMN slug VARCHAR(255) DEFAULT '';
```

---

## API Endpoints الجديدة

| Method | Endpoint | الوظيفة |
|--------|----------|---------|
| GET | `/api/data/media-units/with-sources` | كل الوحدات مع مصادرها |
| GET | `/api/data/media-units/:slug/sources` | مصادر وحدة محددة |
| POST | `/api/data/media-units/:slug/sources` | ربط مصدر بوحدة `{ source_id, priority }` |
| DELETE | `/api/data/media-units/:slug/sources/:sourceId` | إلغاء ربط مصدر |
| POST | `/api/data/media-units/:slug/sources/sync` | مزامنة مصادر من NewsDesk API |
| GET | `/api/data/media-units/:slug/articles` | أخبار وحدة (منشورة) |

---

## فلو التوزيع الجديد (FlowRouter)

```
لكل خبر جديد:
├─ media_unit_id موجود؟ → يروح لها فقط ✅
├─ source_id موجود؟ → يبحث عن الوحدات المرتبطة بالمصدر
└─ Fallback → كل الوحدات النشطة (للتوافق مع القديم)
```

---

## خطوات التطبيق

```bash
# 1. تشغيل الـ migration
psql $DATABASE_URL -f sql/create_media_unit_sources.sql

# 2. ربط المصادر بالوحدات (عبر API أو مزامنة)
curl -X POST /api/data/media-units/huna-gaza/sources/sync
curl -X POST /api/data/media-units/alnajah/sources/sync

# أو يدوياً:
curl -X POST /api/data/media-units/huna-gaza/sources \
  -d '{"source_id": 5, "priority": 1}'

# 3. الـ scheduler يشتغل تلقائياً بالفلو الجديد
```

---

## ملاحظات

- إذا ما في وحدات مربوطة بمصادر → النظام يرجع للسحب العام (fallback)
- مصدر واحد ممكن يكون مربوط بأكثر من وحدة إعلامية
- الـ priority بيحدد أولوية المصدر ضمن الوحدة
- Soft delete — إلغاء الربط يحط `is_active = false` (ما يحذف)
