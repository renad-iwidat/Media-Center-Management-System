# لوحة المراسلين - إدخال الأخبار

تطبيق React منفصل للمراسلين لإدخال الأخبار يدوياً (نص، صوت، فيديو).

## المميزات

✅ إدخال أخبار نصية
✅ اختيار التصنيف
✅ إضافة وسوم
✅ رابط صورة اختياري
✅ واجهة عربية كاملة
✅ Validation على الفرونت والباك

## التثبيت

```bash
cd manual-input-frontend
npm install
```

## التشغيل

```bash
npm run dev
```

التطبيق سيعمل على: `http://localhost:3001`

## البناء للإنتاج

```bash
npm run build
```

## الهيكل

```
manual-input-frontend/
├── src/
│   ├── api/
│   │   └── client.ts          # Axios client
│   ├── pages/
│   │   └── ManualInputText.tsx # صفحة الإدخال النصي
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## API Endpoints

- `GET /api/manual-input/categories` - جلب التصنيفات
- `GET /api/manual-input/source/text` - جلب مصدر النص
- `POST /api/manual-input/submit` - إرسال خبر جديد

## ملاحظات

- التطبيق يستخدم Vite + React + TypeScript
- التصميم بـ Tailwind CSS
- الاتجاه RTL (من اليمين لليسار)
- كل النصوص بالعربية
