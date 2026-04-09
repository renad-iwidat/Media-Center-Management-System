# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### المصادر (Sources)

#### الحصول على جميع المصادر
```
GET /data/sources
```

**الرد:**
```json
{
  "success": true,
  "count": 12,
  "data": [
    {
      "id": 1,
      "name": "فلسطين إنفو",
      "url": "https://palinfo.com/feed/",
      "source_type_id": 1,
      "is_active": true,
      "created_at": "2026-04-09T08:45:34.928238+00:00",
      "default_category_id": 1
    }
  ]
}
```

#### الحصول على المصادر النشطة فقط
```
GET /data/sources/active
```

---

### الأخبار (Articles)

#### الحصول على جميع الأخبار
```
GET /data/articles?limit=100&offset=0
```

**المعاملات:**
- `limit` (اختياري): عدد الأخبار (افتراضي: 100)
- `offset` (اختياري): رقم البداية (افتراضي: 0)

**الرد:**
```json
{
  "success": true,
  "total": 500,
  "count": 100,
  "limit": 100,
  "offset": 0,
  "data": [
    {
      "id": 1,
      "source_id": 1,
      "source_type_id": 1,
      "category_id": 1,
      "url": "https://example.com/article",
      "title": "عنوان الخبر",
      "content": "محتوى الخبر",
      "image_url": "https://example.com/image.jpg",
      "tags": ["tag1", "tag2"],
      "fetch_status": "completed",
      "fetched_at": "2026-04-09T13:00:00.000Z"
    }
  ]
}
```

#### الحصول على أخبار مصدر معين
```
GET /data/articles/source/:sourceId
```

**المثال:**
```
GET /data/articles/source/1
```

---

### التصنيفات (Categories)

#### الحصول على جميع التصنيفات
```
GET /data/categories
```

**الرد:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": 1,
      "name": "محلي",
      "slug": "local",
      "flow": "editorial",
      "is_active": true
    },
    {
      "id": 2,
      "name": "دولي",
      "slug": "world",
      "flow": "editorial",
      "is_active": true
    }
  ]
}
```

#### الحصول على أخبار تصنيف معين
```
GET /data/articles/category/:categoryId
```

**المثال:**
```
GET /data/articles/category/1
```

---

### البيانات الشاملة والإحصائيات

#### الحصول على بيانات شاملة
```
GET /data/comprehensive
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "sources": {
      "count": 12,
      "items": [...]
    },
    "articles": {
      "count": 500,
      "items": [...]
    },
    "categories": {
      "count": 10,
      "items": [...]
    }
  }
}
```

#### الحصول على إحصائيات
```
GET /data/statistics
```

**الرد:**
```json
{
  "success": true,
  "data": {
    "totalSources": 12,
    "activeSources": 12,
    "totalArticles": 500,
    "totalCategories": 10,
    "articlesByCategory": {
      "1": 150,
      "2": 100,
      "3": 80,
      "4": 70,
      "5": 50,
      "6": 30,
      "7": 20
    },
    "articlesBySource": {
      "1": 50,
      "2": 45,
      "3": 40,
      "4": 35,
      "5": 30
    }
  }
}
```

---

## أمثلة الاستخدام

### استخدام cURL

#### الحصول على جميع المصادر
```bash
curl http://localhost:3000/api/data/sources
```

#### الحصول على أخبار مصدر معين
```bash
curl http://localhost:3000/api/data/articles/source/1
```

#### الحصول على أخبار تصنيف معين
```bash
curl http://localhost:3000/api/data/articles/category/1
```

#### الحصول على الإحصائيات
```bash
curl http://localhost:3000/api/data/statistics
```

### استخدام JavaScript/Fetch

```javascript
// الحصول على جميع المصادر
fetch('http://localhost:3000/api/data/sources')
  .then(res => res.json())
  .then(data => console.log(data));

// الحصول على أخبار مصدر معين
fetch('http://localhost:3000/api/data/articles/source/1')
  .then(res => res.json())
  .then(data => console.log(data));

// الحصول على الإحصائيات
fetch('http://localhost:3000/api/data/statistics')
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## رموز الأخطاء

| الكود | الوصف |
|------|-------|
| 200 | نجح |
| 400 | طلب غير صحيح |
| 500 | خطأ في الخادم |

---

## ملاحظات

- جميع الـ endpoints تدعم CORS
- جميع الـ responses بصيغة JSON
- التواريخ بصيغة ISO 8601
