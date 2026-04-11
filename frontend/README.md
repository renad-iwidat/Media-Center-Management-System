# 🎨 Frontend - Media Center Management System

**الإصدار:** 1.0.0  
**آخر تحديث:** April 11, 2026  
**الحالة:** 🚀 قيد التطوير

---

## 📋 نظرة عامة

هذا المجلد يحتوي على واجهة المستخدم (Frontend) لنظام إدارة مركز الإعلام. يتم تطويره بشكل منفصل عن الـ Backend API.

---

## 📁 بنية المشروع

```
frontend/
├── public/                    # ملفات ثابتة
│   ├── index.html            # الصفحة الرئيسية
│   ├── favicon.ico           # أيقونة الموقع
│   └── ...
│
├── src/                       # كود المصدر
│   ├── components/           # مكونات React
│   │   ├── Header/
│   │   ├── Sidebar/
│   │   ├── Dashboard/
│   │   ├── Articles/
│   │   ├── Sources/
│   │   ├── Categories/
│   │   └── ...
│   │
│   ├── pages/                # الصفحات
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Articles.tsx
│   │   ├── Sources.tsx
│   │   ├── Categories.tsx
│   │   └── ...
│   │
│   ├── services/             # خدمات API
│   │   ├── api.ts           # إعدادات Axios
│   │   ├── sources.service.ts
│   │   ├── articles.service.ts
│   │   ├── categories.service.ts
│   │   └── ...
│   │
│   ├── hooks/                # React Hooks مخصصة
│   │   ├── useArticles.ts
│   │   ├── useSources.ts
│   │   └── ...
│   │
│   ├── types/                # تعريفات TypeScript
│   │   ├── article.types.ts
│   │   ├── source.types.ts
│   │   └── ...
│   │
│   ├── styles/               # ملفات CSS/SCSS
│   │   ├── global.css
│   │   ├── variables.css
│   │   └── ...
│   │
│   ├── utils/                # دوال مساعدة
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   └── ...
│   │
│   ├── App.tsx               # المكون الرئيسي
│   ├── index.tsx             # نقطة البداية
│   └── ...
│
├── package.json              # المكتبات والـ scripts
├── tsconfig.json             # إعدادات TypeScript
├── vite.config.ts            # إعدادات Vite (إذا كان المشروع يستخدم Vite)
└── README.md                 # هذا الملف
```

