# دليل تشغيل نظام الإدخال اليدوي

## نظرة عامة

النظام يتكون من:
1. **Backend API** - Express + PostgreSQL
2. **Frontend** - React + Vite + Tailwind CSS

---

## الخطوة 1: تثبيت Dependencies

### Backend
```bash
npm install
```

### Frontend
```bash
cd manual-input-frontend
npm install
```

---

## الخطوة 2: إعداد قاعدة البيانات

تأكد من أن ملف `.env` يحتوي على:
```env
DATABASE_URL=postgresql://media_center_db_user:r7Xdw8zqsFnNwauT2UDppnbQU9k4ZR41@dpg-d7bg2jqa214c73edlb10-a.oregon-postgres.render.com/media_center_db
PORT=3000
NODE_ENV=development
```

---

## الخطوة 3: التحقق من قاعدة البيانات

تأكد من وجود المصادر الجديدة:
```bash
npx ts-node src/utils/manual-input/check-database-setup.ts
```

يجب أن ترى:
- ✅ مصدر Manual Input - Text (ID: 14)
- ✅ مصدر Manual Input - Audio (ID: 15)
- ✅ مصدر Manual Input - Video (ID: 16)

---

## الخطوة 4: تشغيل Backend

```bash
npm run dev
```

السيرفر سيعمل على: `http://localhost:3000`

### اختبار الـ API:
```bash
# في terminal جديد
npx ts-node src/utils/manual-input/test-api-endpoints.ts
```

---

## الخطوة 5: تشغيل Frontend

```bash
cd manual-input-frontend
npm run dev
```

الفرونت سيعمل على: `http://localhost:3001`

---

## الـ API Endpoints

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

### 2. GET /api/manual-input/sources
جلب كل المصادر (نص، صوت، فيديو)

**Response:**
```json
{
  "success": true,
  "data": {
    "text": { "id": 14, "name": "Manual Input - Text", ... },
    "audio": { "id": 15, "name": "Manual Input - Audio", ... },
    "video": { "id": 16, "name": "Manual Input - Video", ... }
  }
}
```

### 3. GET /api/manual-input/source/text
جلب مصدر النص فقط

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 14,
    "name": "Manual Input - Text",
    "source_type_id": 6,
    "is_active": true
  }
}
```

### 4. POST /api/manual-input/submit
إرسال خبر جديد

**Request:**
```json
{
  "source_id": 14,
  "source_type_id": 6,
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
    "source_id": 14,
    "source_type_id": 6,
    "category_id": 1,
    "title": "عنوان الخبر",
    "fetch_status": "fetched",
    "fetched_at": "2026-04-19T10:30:00.000Z"
  },
  "message": "تم إضافة الخبر بنجاح"
}
```

---

## استكشاف الأخطاء

### Backend لا يعمل
```bash
# تحقق من الاتصال بالداتا بيس
npx ts-node src/utils/manual-input/check-database-setup.ts
```

### Frontend لا يتصل بالـ API
- تأكد من أن Backend يعمل على port 3000
- تحقق من `vite.config.ts` أن الـ proxy صحيح

### خطأ في الإرسال
- تحقق من console في المتصفح
- تحقق من logs في Backend terminal

---

## الملفات المهمة

### Backend
```
src/
├── models/manual-input/ManualInput.ts
├── services/manual-input/ManualInputService.ts
├── controllers/manual-input/ManualInputController.ts
├── routes/manual-input/index.ts
└── index.ts (main server)
```

### Frontend
```
manual-input-frontend/
├── src/
│   ├── api/client.ts
│   ├── pages/ManualInputText.tsx
│   └── App.tsx
└── vite.config.ts
```

---

## Next Steps

1. ✅ إضافة Authentication (user_id حقيقي)
2. ✅ ربط مع FlowRouterService
3. ✅ إضافة صفحة للصوت
4. ✅ إضافة صفحة للفيديو
5. ✅ رفع الملفات على S3
