# Manual Input Service

خدمة الإدخال اليدوي للأخبار - تسمح للمراسلين بإدخال أخبار يدوياً من الميدان.

## الملفات

```
src/
├── models/manual-input/
│   └── ManualInput.ts          # تعريف الأنواع والواجهات
├── services/manual-input/
│   └── ManualInputService.ts   # منطق الأعمال
├── controllers/manual-input/
│   └── ManualInputController.ts # معالجة الطلبات
└── routes/manual-input/
    └── index.ts                # مسارات API
```

## API Endpoints

### 1. GET /api/manual-input/categories
جلب التصنيفات النشطة

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "محلي",
      "slug": "local",
      "flow": "editorial",
      "is_active": true
    }
  ]
}
```

### 2. GET /api/manual-input/source
جلب معلومات مصدر الإدخال اليدوي

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 13,
    "name": "User Manual Input",
    "source_type_id": 5,
    "is_active": true
  }
}
```

### 3. POST /api/manual-input/submit
إرسال خبر يدوي جديد

**Request Body:**
```json
{
  "source_id": 13,
  "source_type_id": 5,
  "category_id": 1,
  "url": null,
  "title": "عنوان الخبر",
  "content": "محتوى الخبر الكامل...",
  "image_url": "",
  "tags": ["تاغ1", "تاغ2"],
  "fetch_status": "fetched",
  "created_by": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "source_id": 13,
    "source_type_id": 5,
    "category_id": 1,
    "title": "عنوان الخبر",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-19T10:30:00.000Z"
  },
  "message": "تم إضافة الخبر بنجاح"
}
```

## Validation Rules

- `title`: مطلوب، لا يقل عن 5 أحرف
- `content`: مطلوب، لا يقل عن 20 حرف
- `category_id`: مطلوب
- `created_by`: مطلوب
- `fetch_status`: يجب أن يكون "fetched"

## Workflow

1. المستخدم يدخل الخبر من الفورم
2. يُحفظ في جدول `raw_data` مع `fetch_status = 'fetched'`
3. يُشغّل الـ FlowRouterService
4. حسب `category.flow`:
   - `automated`: ينشر مباشرة
   - `editorial`: يروح لطابور المحرر

## Frontend

الصفحة موجودة في: `portal-frontend/src/pages/ManualInput.tsx`

### Features:
- فورم إدخال نص
- اختيار التصنيف
- إضافة وسوم
- رابط صورة اختياري
- Validation على الفرونت والباك
