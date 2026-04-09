# 📁 Project Structure - Feature-Based Organization

## الهيكل الجديد للمشروع

تم تنظيم المشروع بناءً على الـ features، حيث كل feature لها فولدرها الخاص في كل directory.

---

## 🗂️ البنية الكاملة

```
src/
├── config/
│   ├── database.ts              # اتصال PostgreSQL
│   ├── environment.ts           # متغيرات البيئة
│   ├── sql-queries.ts           # استعلامات SQL
│   └── rss-sources.ts           # مصادر RSS
│
├── services/
│   ├── database/
│   │   ├── database.service.ts  # جميع خدمات قاعدة البيانات
│   │   ├── index.ts             # تصدير الخدمات
│   │   └── README.md            # توثيق الخدمات
│   │
│   └── news/
│       ├── rss-fetcher.service.ts    # سحب RSS
│       ├── data-storage.service.ts   # حفظ البيانات
│       ├── index.ts                  # تصدير الخدمات
│       └── README.md                 # توثيق الخدمات
│
├── controllers/
│   ├── database/
│   │   ├── sources.controller.ts # التحكم بالمصادر
│   │   ├── index.ts              # تصدير Controllers
│   │   └── README.md             # توثيق Controllers
│   │
│   └── news/
│       ├── news.controller.ts    # التحكم بالأخبار
│       ├── index.ts              # تصدير Controllers
│       └── README.md             # توثيق Controllers
│
├── routes/
│   ├── database/
│   │   ├── sources.routes.ts     # مسارات المصادر
│   │   ├── index.ts              # تصدير Routes
│   │   └── README.md             # توثيق Routes
│   │
│   └── news/
│       ├── news.routes.ts        # مسارات الأخبار
│       ├── index.ts              # تصدير Routes
│       └── README.md             # توثيق Routes
│
├── types/
│   ├── database/
│   │   ├── database.types.ts     # أنواع قاعدة البيانات
│   │   ├── index.ts              # تصدير Types
│   │   └── README.md             # توثيق Types
│   │
│   └── news/
│       ├── news.types.ts         # أنواع الأخبار
│       ├── index.ts              # تصدير Types
│       └── README.md             # توثيق Types
│
├── models/
│   ├── database/
│   │   ├── database.models.ts    # نماذج قاعدة البيانات
│   │   ├── index.ts              # تصدير Models
│   │   └── README.md             # توثيق Models
│   │
│   └── news/
│       ├── news.models.ts        # نماذج الأخبار
│       ├── index.ts              # تصدير Models
│       └── README.md             # توثيق Models
│
├── middleware/                   # Middleware عام
├── utils/
│   ├── database-examples.ts      # أمثلة قاعدة البيانات
│   ├── rss-runner.ts             # تشغيل RSS
│   └── README.md                 # توثيق Utils
│
└── index.ts                      # نقطة الدخول الرئيسية
```

---

## 🎯 الفوائد

### 1. تنظيم أفضل
- كل feature لها فولدرها الخاص
- سهل العثور على الملفات
- سهل إضافة features جديدة

### 2. قابلية الصيانة
- كل feature مستقلة
- سهل تعديل feature واحد بدون التأثير على الآخرين
- سهل حذف feature كاملة

### 3. إعادة الاستخدام
- يمكن نسخ feature كاملة إلى مشروع آخر
- كل feature تحتوي على كل ما تحتاجه

### 4. التطور السريع
- سهل إضافة features جديدة
- سهل فهم الكود
- سهل التعاون بين المطورين

---

## 📦 الـ Features الحالية

### 1. Database Feature
**الملفات:**
- `src/services/database/database.service.ts` - الخدمات
- `src/models/database/database.models.ts` - النماذج
- `src/types/database/database.types.ts` - الأنواع

**الخدمات:**
- SourceTypeService
- SourceService
- RawDataService
- CategoryService
- EditorialPolicyService
- EditorialQueueService
- PublishedItemService

### 2. News Feature
**الملفات:**
- `src/services/news/rss-fetcher.service.ts` - سحب RSS
- `src/services/news/data-storage.service.ts` - حفظ البيانات
- `src/models/news/news.models.ts` - النماذج
- `src/types/news/news.types.ts` - الأنواع

**الخدمات:**
- RSSFetcherService
- DataStorageService

---

## 🚀 كيفية الاستخدام

### استيراد من Database Feature
```typescript
// الطريقة 1: من index
import { SourceService } from './services/database';

// الطريقة 2: مباشرة
import { SourceService } from './services/database/database.service';
```

### استيراد من News Feature
```typescript
// الطريقة 1: من index
import { rssFetcherService } from './services/news';

// الطريقة 2: مباشرة
import { rssFetcherService } from './services/news/rss-fetcher.service';
```

### استيراد Types
```typescript
// من Database
import { SourceType, Source } from './types/database';

// من News
import { RSSArticle, NewsStatus } from './types/news';
```

### استيراد Models
```typescript
// من Database
import { SourceType, Source } from './models/database';

// من News
import { RawNewsArticle, PublishedNewsArticle } from './models/news';
```

---

## 🔄 إضافة Feature جديدة

### الخطوات:

1. **إنشاء الفولدرات:**
```bash
mkdir -p src/services/my-feature
mkdir -p src/controllers/my-feature
mkdir -p src/routes/my-feature
mkdir -p src/types/my-feature
mkdir -p src/models/my-feature
```

2. **إنشاء الملفات:**
```
src/
├── services/my-feature/
│   ├── my-feature.service.ts
│   └── index.ts
├── controllers/my-feature/
│   ├── my-feature.controller.ts
│   └── index.ts
├── routes/my-feature/
│   ├── my-feature.routes.ts
│   └── index.ts
├── types/my-feature/
│   ├── my-feature.types.ts
│   └── index.ts
└── models/my-feature/
    ├── my-feature.models.ts
    └── index.ts
```

3. **تحديث index.ts الرئيسي:**
```typescript
import myFeatureRoutes from './routes/my-feature';
app.use('/api/my-feature', myFeatureRoutes);
```

---

## 📝 قائمة الملفات

### Services
- [x] `src/services/database/database.service.ts`
- [x] `src/services/database/index.ts`
- [x] `src/services/news/rss-fetcher.service.ts`
- [x] `src/services/news/data-storage.service.ts`
- [x] `src/services/news/index.ts`

### Controllers
- [x] `src/controllers/database/sources.controller.ts`
- [x] `src/controllers/database/index.ts`
- [x] `src/controllers/news/news.controller.ts`
- [x] `src/controllers/news/index.ts`

### Routes
- [x] `src/routes/database/sources.routes.ts`
- [x] `src/routes/database/index.ts`
- [x] `src/routes/news/news.routes.ts`
- [x] `src/routes/news/index.ts`

### Types
- [x] `src/types/database/database.types.ts`
- [x] `src/types/database/index.ts`
- [x] `src/types/news/news.types.ts`
- [x] `src/types/news/index.ts`

### Models
- [x] `src/models/database/database.models.ts`
- [x] `src/models/database/index.ts`
- [x] `src/models/news/news.models.ts`
- [x] `src/models/news/index.ts`

---

## 🔗 API Endpoints

### Database Routes
```
GET    /api/sources              # جميع المصادر
GET    /api/sources/active       # المصادر النشطة
GET    /api/sources/:id          # مصدر بالـ ID
POST   /api/sources              # إنشاء مصدر
PUT    /api/sources/:id          # تحديث مصدر
```

### News Routes
```
GET    /api/news                 # جميع الأخبار
GET    /api/news/:id             # خبر بالـ ID
GET    /api/news/source/:sourceId # أخبار من مصدر
POST   /api/news                 # إضافة خبر
```

---

## 🎯 الخطوات التالية

1. **إضافة Controllers إضافية:**
   - CategoriesController
   - EditorialQueueController
   - PublishedItemsController

2. **إضافة Routes إضافية:**
   - categories.routes.ts
   - editorial-queue.routes.ts
   - published-items.routes.ts

3. **إضافة Middleware:**
   - Authentication
   - Authorization
   - Validation
   - Error Handling

4. **إضافة Features جديدة:**
   - Users Feature
   - Analytics Feature
   - Notifications Feature

---

## 📚 المراجع

- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Project Structure](https://www.freecodecamp.org/news/how-to-structure-a-node-js-project/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

---

**تم تنظيم المشروع بنجاح! 🎉**
