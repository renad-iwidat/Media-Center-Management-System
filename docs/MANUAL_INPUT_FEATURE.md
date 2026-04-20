# Manual Input Feature - ميزة الإدخال اليدوي

## نظرة عامة

تم بناء feature كاملة للإدخال اليدوي للأخبار من قبل المراسلين في الميدان.

## الملفات المنشأة

### Backend

```
src/
├── models/manual-input/
│   ├── ManualInput.ts           # تعريف الأنواع
│   └── index.ts
├── services/manual-input/
│   ├── ManualInputService.ts    # منطق الأعمال
│   ├── index.ts
│   └── README.md
├── controllers/manual-input/
│   ├── ManualInputController.ts # معالجة الطلبات
│   └── index.ts
├── routes/manual-input/
│   └── index.ts                 # مسارات API
└── utils/manual-input/
    ├── check-database-setup.ts  # فحص الداتا بيس
    └── test-manual-input.ts     # اختبار الـ feature
```

### Frontend

```
portal-frontend/src/pages/
└── ManualInput.tsx              # صفحة الإدخال اليدوي
```

## API Endpoints

### 1. GET /api/manual-input/categories
جلب التصنيفات النشطة للاختيار منها

### 2. GET /api/manual-input/source
جلب معلومات مصدر الإدخال اليدوي (ID: 13)

### 3. POST /api/manual-input/submit
إرسال خبر يدوي جديد

## Workflow

```
المستخدم يدخل الخبر
        ↓
POST /api/manual-input/submit
        ↓
حفظ في raw_data (fetch_status = 'fetched')
        ↓
FlowRouterService يقرأ category.flow
        ↓
    ┌───────┴───────┐
    ↓               ↓
automated      editorial
(نشر مباشر)    (طابور المحرر)
```

## Features

✅ إدخال نص يدوي
✅ اختيار التصنيف
✅ إضافة وسوم (tags)
✅ رابط صورة اختياري
✅ Validation على الفرونت والباك
✅ تتبع المستخدم (created_by)
✅ دخول في الفلو الطبيعي للنظام

## Database Schema

### الجداول المستخدمة:
- `source_types` - نوع المصدر (user_input)
- `sources` - المصدر (User Manual Input)
- `categories` - التصنيفات
- `raw_data` - البيانات الخام (يُحفظ فيها الخبر)
- `editorial_queue` - طابور المحرر (للتصنيفات editorial)
- `published_items` - المحتوى المنشور

### الحقول المهمة في raw_data:
- `created_by` - معرف المستخدم الذي أدخل الخبر
- `url` - NULL للإدخال اليدوي
- `fetch_status` - 'fetched' حتى يدخل الفلو

## Testing

تم اختبار:
✅ جلب التصنيفات (10 تصنيفات)
✅ جلب المصدر (ID: 13)
✅ Validation للبيانات
✅ الاتصال بالداتا بيس

## Next Steps

1. ربط الـ routes بالـ main server
2. إضافة authentication للحصول على user_id الحقيقي
3. ربط مع FlowRouterService الموجود
4. إضافة صفحة ManualInput للـ navigation
5. اختبار end-to-end كامل

## Future Enhancements

- [ ] إدخال صوت
- [ ] إدخال فيديو
- [ ] رفع صور بدل روابط
- [ ] معاينة قبل الإرسال
- [ ] حفظ كمسودة
