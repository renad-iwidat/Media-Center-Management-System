# 📝 ملخص التغييرات - إضافة موقع النجاح

## التاريخ
**June 8, 2026**

## الهدف
إضافة موقع النجاح (nn.najah.edu) كموقع نشر خارجي جديد للوحدة الإعلامية "النجاح"، مع دعم API مختلف عن موقع هنا غزة.

---

## ✅ الملفات المضافة

### 1. قاعدة البيانات
- **`sql/add_najah_site.sql`**
  - إنشاء/التحقق من وجود الوحدة الإعلامية "النجاح"
  - إضافة موقع النجاح كـ `auto_publish_target`
  - إعدادات API: URL, Token, category mapping

### 2. التوثيق
- **`docs/NAJAH_SITE_INTEGRATION.md`**
  - دليل شامل للتكامل
  - شرح API endpoints
  - Category mapping
  - استكشاف الأخطاء
  
- **`NAJAH_SITE_SETUP.md`**
  - دليل إعداد سريع
  - خطوات التفعيل
  - التحقق من الإعدادات

### 3. الاختبار
- **`test_najah_api.sh`**
  - سكريبت bash لاختبار API
  - إرسال خبر تجريبي
  - التحقق من الاستجابة

---

## 🔧 الملفات المعدّلة

### 1. `sql/create_auto_publish_settings.sql`
**التغييرات:**
- ✅ إضافة قسم جديد لموقع النجاح
- ✅ توثيق category mapping لموقع النجاح
- ✅ إضافة INSERT statement لموقع النجاح

**الكود المضاف:**
```sql
-- إدراج هدف "موقع النجاح" — الوحدة الإعلامية "النجاح"
INSERT INTO auto_publish_targets (media_unit_id, name, api_url, api_token, default_category_id, is_enabled)
SELECT 
  mu.id,
  'موقع النجاح',
  'https://nn.najah.edu/api/v1/news/article/',
  '<NAJAH_API_TOKEN>',  -- مخزّن في .env أو قاعدة البيانات
  12,
  false
FROM media_units mu
WHERE mu.name = 'النجاح'
ON CONFLICT DO NOTHING;
```

### 2. `src/services/news/auto-publish.service.ts`
**التغييرات الرئيسية:**

#### أ. إضافة Category Mapping جديد
```typescript
// إضافة mapping خاص بموقع النجاح
const LOCAL_TO_NAJAH_CATEGORY: Record<number, number> = {
  1:  12,  // محلي → الأخبار المحلية (ID مختلف عن هنا غزة)
  2:  4,   // دولي → الأخبار الدولية
  3:  6,   // اقتصاد → الاقتصاد
  // ... باقي التصنيفات
};

// دالة ديناميكية لاختيار الـ mapping المناسب
function getCategoryMapping(targetApiUrl: string): Record<number, number> {
  if (targetApiUrl.includes('nn.najah.edu')) {
    return LOCAL_TO_NAJAH_CATEGORY;
  }
  return LOCAL_TO_HGAZA_CATEGORY; // افتراضي
}
```

#### ب. تحديث دالة `publishOneToTarget`
```typescript
// 1. استخدام mapping ديناميكي
const categoryMapping = getCategoryMapping(target.api_url);
const externalCategoryId = article.category_id
  ? (categoryMapping[article.category_id] || target.default_category_id)
  : target.default_category_id;

// 2. كشف نوع الموقع
const isNajahSite = target.api_url.includes('nn.najah.edu');
const isHgazaSite = target.api_url.includes('hgaza.nn.ps');

// 3. بناء FormData مخصص لكل موقع
if (isNajahSite) {
  retryFormData.append('keywords', tagsString);
  retryFormData.append('auto_publish', 'true');
  retryFormData.append('pin', '0');
} else {
  retryFormData.append('tags', tagsString);
  retryFormData.append('keywords', tagsString);
}

// 4. استخدام نوع Authentication المناسب
const authHeader = isNajahSite 
  ? `Token ${target.api_token}`
  : `Bearer ${target.api_token}`;
```

---

## 🔑 الفروقات التقنية

### API Authentication
| الموقع | الطريقة | مثال |
|--------|---------|------|
| هنا غزة | Bearer Token | `Authorization: Bearer 2\|wN4C...` |
| النجاح | Token | `Authorization: Token 9eedb2e...` |

### Category ID (محلي)
| الموقع | Category ID |
|--------|-------------|
| هنا غزة | 1 |
| النجاح | 12 |

### Form Data Fields
| Field | هنا غزة | النجاح |
|-------|---------|--------|
| title | ✅ | ✅ |
| content | ✅ | ✅ |
| category_id | ✅ | ✅ |
| tags | ✅ | ❌ |
| keywords | ✅ | ✅ |
| image_base64 | ✅ | ✅ |
| auto_publish | ❌ | ✅ |
| pin | ❌ | ✅ |

---

## 🎯 الميزات

### 1. الكشف التلقائي للموقع
الكود يكتشف نوع الموقع من `api_url` ويختار:
- ✅ Category mapping المناسب
- ✅ نوع Authentication الصحيح
- ✅ Form fields المطلوبة

### 2. دعم مواقع متعددة
- ✅ كل وحدة إعلامية يمكن أن يكون لها موقع خارجي أو أكثر
- ✅ إعدادات منفصلة لكل موقع
- ✅ تفعيل/إيقاف فردي

### 3. Backward Compatible
- ✅ لا تغيير على موقع هنا غزة الحالي
- ✅ نفس الـ API endpoints
- ✅ نفس آلية العمل

---

## 📊 Database Schema

### جدول `auto_publish_targets`
```sql
id                  | SERIAL PRIMARY KEY
media_unit_id       | INTEGER REFERENCES media_units(id)
name                | VARCHAR(255)  -- "موقع النجاح"
api_url             | TEXT          -- "https://nn.najah.edu/..."
api_token           | TEXT          -- مخزّن في .env أو قاعدة البيانات
default_category_id | INTEGER       -- 12
is_enabled          | BOOLEAN       -- false (افتراضي)
created_at          | TIMESTAMP
updated_at          | TIMESTAMP
```

### السجلات الجديدة
```sql
-- الوحدة الإعلامية "النجاح"
media_units:
  id: (auto)
  name: 'النجاح'
  slug: 'najah'
  is_active: true

-- موقع النشر
auto_publish_targets:
  media_unit_id: (من media_units)
  name: 'موقع النجاح'
  api_url: 'https://nn.najah.edu/api/v1/news/article/'
  api_token: '<NAJAH_API_TOKEN>'  -- مخزّن في .env أو قاعدة البيانات
  default_category_id: 12
  is_enabled: false
```

---

## 🔄 آلية العمل

### النشر التلقائي (Automated)
```
1. Scheduler يعمل كل 10 دقائق
2. يجلب الأخبار من published_items (تصنيفات آلية)
3. لكل موقع مفعّل:
   - يحدد نوع الموقع من api_url
   - يختار category mapping المناسب
   - يبني request بالصيغة الصحيحة
   - يرسل POST بـ authentication الصحيح
4. يسجل النتيجة في auto_publish_log
```

### النشر اليدوي (Editorial)
```
1. المحرر يختار "نشر على موقع خارجي"
2. يظهر dialog بالمواقع المتاحة (هنا غزة + النجاح)
3. يختار الموقع المطلوب
4. POST /api/auto-publish/publish-one
5. نفس آلية النشر التلقائي
```

---

## 🧪 الاختبار

### 1. اختبار API مباشر
```bash
bash test_najah_api.sh
```

### 2. اختبار من النظام
```sql
-- جلب خبر تجريبي
SELECT id, title FROM raw_data LIMIT 1;

-- نشره يدوياً
-- من الفرونت اند أو عبر API:
POST /api/auto-publish/publish-one
{
  "raw_data_id": 123,
  "target_id": 2  -- ID موقع النجاح
}
```

### 3. التحقق من النتيجة
```sql
-- آخر عملية نشر
SELECT * FROM auto_publish_log 
WHERE target_id = (SELECT id FROM auto_publish_targets WHERE name = 'موقع النجاح')
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🚀 التفعيل

### خطوات التفعيل الكاملة

```bash
# 1. تشغيل السكريبت
psql -U postgres -d media_center -f sql/add_najah_site.sql

# 2. تفعيل الموقع
psql -U postgres -d media_center -c "UPDATE auto_publish_targets SET is_enabled = true WHERE name = 'موقع النجاح';"

# 3. تفعيل Master Switch
psql -U postgres -d media_center -c "UPDATE system_settings SET value = 'true' WHERE key = 'auto_publish_enabled';"

# 4. اختبار API
bash test_najah_api.sh

# 5. إعادة تشغيل الباكند
npm run dev
```

---

## 📈 الإحصائيات المتوقعة

بعد التفعيل، ستظهر في `/api/auto-publish/stats`:

```json
{
  "masterEnabled": true,
  "targets": [
    {
      "id": 1,
      "name": "موقع هنا غزة",
      "mediaUnitName": "هنا غزة",
      "isEnabled": true,
      "totalPublished": 150,
      "totalFailed": 5,
      "publishedToday": 12
    },
    {
      "id": 2,
      "name": "موقع النجاح",
      "mediaUnitName": "النجاح",
      "isEnabled": true,
      "totalPublished": 0,
      "totalFailed": 0,
      "publishedToday": 0
    }
  ]
}
```

---

## 🔐 الأمان

### Credentials Management
- ✅ الـ Token مخزّن في قاعدة البيانات (encrypted في production)
- ✅ لا يظهر في logs
- ✅ HTTPS فقط للاتصالات

### Rate Limiting
- ✅ تأخير 5 ثوانٍ بين كل طلب
- ✅ إعادة محاولة في حالة 500 (rate limit)
- ✅ حد أقصى 3 محاولات

---

## 📚 المراجع

- [NAJAH_SITE_INTEGRATION.md](./docs/NAJAH_SITE_INTEGRATION.md) - الدليل الكامل
- [MULTI_PLATFORM_PUBLISHING_SYSTEM.md](./docs/MULTI_PLATFORM_PUBLISHING_SYSTEM.md) - نظام النشر
- [EXTERNAL_AUTO_PUBLISH_EXPLAINED.md](./docs/EXTERNAL_AUTO_PUBLISH_EXPLAINED.md) - شرح النشر التلقائي

---

## ✅ Checklist

- [x] إضافة SQL migration
- [x] تحديث auto-publish service
- [x] إضافة category mapping
- [x] دعم Token authentication
- [x] دعم معاملات auto_publish و pin
- [x] كتابة التوثيق
- [x] إنشاء سكريبت اختبار
- [x] التحقق من عدم وجود أخطاء (getDiagnostics)
- [x] Backward compatibility مع هنا غزة

---

## 🎉 النتيجة النهائية

تم إضافة موقع النجاح بنجاح مع:
- ✅ دعم كامل للنشر التلقائي واليدوي
- ✅ category mapping مخصص
- ✅ API مختلف (Token authentication)
- ✅ معاملات إضافية (auto_publish, pin)
- ✅ توثيق شامل
- ✅ سكريبت اختبار
- ✅ عدم تأثير على الوظائف الحالية

**الكود جاهز للاستخدام الفوري!** 🚀
