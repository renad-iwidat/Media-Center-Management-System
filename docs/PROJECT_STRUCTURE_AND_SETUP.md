# 📋 Media Center Management System - Project Structure & Setup Guide

**آخر تحديث:** April 11, 2026  
**الإصدار:** 1.0.0  
**الحالة:** ✅ جاهز للعمل الجماعي

---

## 🎯 نظرة عامة على المشروع

هذا مشروع **Node.js + TypeScript** لإدارة نظام مركز إعلامي متكامل يتضمن:
- إدارة مصادر الأخبار (RSS, API, Telegram, Web Scraper)
- سحب وتخزين الأخبار
- تصنيف الأخبار الآلي
- إدارة التحرير والنشر
- API RESTful شامل

---

## 📁 بنية المشروع

```
media-center-management-system/
├── src/
│   ├── config/                    # ملفات الإعدادات
│   │   ├── database.ts           # إعدادات قاعدة البيانات والـ Pool
│   │   ├── environment.ts        # متغيرات البيئة
│   │   ├── sql-queries.ts        # استعلامات SQL المعرفة مسبقاً
│   │   └── swagger.ts            # إعدادات Swagger
│   │
│   ├── controllers/               # معالجات الطلبات (Request Handlers)
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   └── sources.controller.ts    # معالج المصادر
│   │   └── news/
│   │       ├── index.ts
│   │       ├── classifier.controller.ts # معالج التصنيف الآلي
│   │       ├── data.controller.ts       # معالج البيانات الشاملة
│   │       └── news.controller.ts       # معالج الأخبار
│   │
│   ├── models/                    # نماذج البيانات (Data Models)
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   └── database.models.ts      # نماذج قاعدة البيانات
│   │   └── news/
│   │       ├── index.ts
│   │       └── news.models.ts          # نماذج الأخبار
│   │
│   ├── routes/                    # مسارات API
│   │   ├── database/
│   │   │   └── sources.routes.ts       # مسارات المصادر
│   │   └── news/
│   │       ├── data.routes.ts          # مسارات البيانات
│   │       └── news.routes.ts          # مسارات الأخبار
│   │
│   ├── services/                  # منطق الأعمال (Business Logic)
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   └── database.service.ts     # خدمات قاعدة البيانات
│   │   └── news/
│   │       ├── index.ts
│   │       ├── ai-classifier.service.ts      # تصنيف الأخبار الآلي
│   │       ├── article-saver.service.ts      # حفظ المقالات
│   │       ├── data-storage.service.ts       # تخزين البيانات
│   │       ├── rss-fetcher.service.ts        # سحب RSS
│   │       ├── rss-pipeline.service.ts       # خط أنابيب RSS
│   │       ├── scheduler.service.ts          # جدولة المهام
│   │       └── unclassified-processor.service.ts  # معالج الأخبار غير المصنفة
│   │
│   ├── types/                     # تعريفات TypeScript
│   │   ├── database/
│   │   │   ├── index.ts
│   │   │   └── database.types.ts       # أنواع قاعدة البيانات
│   │   └── news/
│   │       ├── index.ts
│   │       └── news.types.ts           # أنواع الأخبار
│   │
│   ├── middleware/                # Middleware (قد يكون فارغاً)
│   │
│   ├── utils/                     # دوال مساعدة
│   │   ├── classify-articles.ts        # تصنيف المقالات
│   │   ├── database-examples.ts        # أمثلة قاعدة البيانات
│   │   ├── fetch-and-save.ts           # سحب وحفظ
│   │   ├── rss-runner.ts               # تشغيل RSS
│   │   ├── start-scheduler.ts          # بدء الجدولة
│   │   └── test-db-connection.ts       # اختبار الاتصال
│   │
│   └── index.ts                   # نقطة البداية الرئيسية
│
├── .env                           # متغيرات البيئة (حساس - لا تشاركه)
├── .env.example                   # مثال متغيرات البيئة
├── package.json                   # المكتبات والـ scripts
├── tsconfig.json                  # إعدادات TypeScript
├── API_DOCUMENTATION.md           # توثيق API
├── README.md                      # ملف التعريف
└── PROJECT_STRUCTURE_AND_SETUP.md # هذا الملف
```


## 🔐 معايير الأمان

✅ **تم تطبيقها:**
- Helmet.js لحماية رؤوس HTTP
- CORS مفعل
- SSL/TLS للاتصال بقاعدة البيانات
- Connection pooling مع timeouts
- Parameterized queries لمنع SQL injection

⚠️ **يجب الانتباه:**
- لا تشارك ملف `.env` مع أحد
- استخدم متغيرات البيئة للبيانات الحساسة
- تحقق من صحة المدخلات دائماً
- استخدم HTTPS في الإنتاج

---

## 🤝 معايير العمل الجماعي

### قواعس التسمية

**الملفات:**
- `camelCase` للملفات العادية: `userService.ts`
- `kebab-case` للملفات المركبة: `user-service.ts`
- `.controller.ts` للـ controllers
- `.service.ts` للـ services
- `.types.ts` للـ types
- `.models.ts` للـ models

**المتغيرات والدوال:**
- `camelCase` للمتغيرات والدوال: `getUserById()`
- `PascalCase` للـ classes والـ interfaces: `UserService`, `IUser`
- `UPPER_SNAKE_CASE` للـ constants: `MAX_RETRIES`

**قواعد قاعدة البيانات:**
- `snake_case` لأسماء الجداول والأعمدة: `user_profiles`, `created_at`
- `_id` للـ primary keys: `user_id`
- `_at` للـ timestamps: `created_at`, `updated_at`

### التعليقات

```typescript
/**
 * وصف الدالة بالعربية
 * 
 * @param param1 - وصف المعامل الأول
 * @param param2 - وصف المعامل الثاني
 * @returns وصف القيمة المرجعة
 */
async function doSomething(param1: string, param2: number): Promise<void> {
  // تعليق توضيحي
}
```

### معالجة الأخطاء

```typescript
try {
  // العملية
} catch (error) {
  console.error('❌ وصف الخطأ:', error);
  res.status(500).json({
    success: false,
    error: error instanceof Error ? error.message : 'خطأ غير معروف'
  });
}
```

---

## 📚 الملفات الإضافية

- **API_DOCUMENTATION.md** - توثيق API مفصل
- **README.md** - ملف التعريف الأساسي
- **.env.example** - مثال متغيرات البيئة

---

## ✅ قائمة التحقق قبل البدء

- [ ] تثبيت Node.js و npm
- [ ] استنساخ المشروع
- [ ] تشغيل `npm install`
- [ ] نسخ `.env.example` إلى `.env`
- [ ] اختبار الاتصال: `npm run db:test`
- [ ] تشغيل الخادم: `npm run dev`
- [ ] زيارة `http://localhost:3000/api`

