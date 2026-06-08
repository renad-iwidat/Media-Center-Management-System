# 🚀 إعداد موقع النجاح - دليل سريع

## الملفات المضافة/المعدلة

### 1. قاعدة البيانات
- ✅ **`sql/add_najah_site.sql`** - سكريبت إضافة موقع النجاح
- ✅ **`sql/create_auto_publish_settings.sql`** - محدّث بموقع النجاح

### 2. الكود (Backend)
- ✅ **`src/services/news/auto-publish.service.ts`** - محدّث لدعم:
  - Category mapping خاص بموقع النجاح
  - Token authentication (بدلاً من Bearer)
  - معاملات `auto_publish` و `pin`

### 3. التوثيق
- ✅ **`docs/NAJAH_SITE_INTEGRATION.md`** - دليل كامل للتكامل

---

## ⚡ خطوات التفعيل السريعة

### الخطوة 1: تشغيل السكريبت
```bash
# من مجلد المشروع
psql -U your_username -d your_database -f sql/add_najah_site.sql
```

### الخطوة 2: تفعيل الموقع
```sql
UPDATE auto_publish_targets 
SET is_enabled = true 
WHERE name = 'موقع النجاح';
```

### الخطوة 3: تفعيل النشر التلقائي
```sql
UPDATE system_settings 
SET value = 'true' 
WHERE key = 'auto_publish_enabled';
```

### الخطوة 4: إعادة تشغيل الباكند
```bash
npm run dev
# أو
npm start
```

---

## 🔍 التحقق من التفعيل

```sql
-- عرض جميع مواقع النشر المفعلة
SELECT 
  mu.name AS "الوحدة الإعلامية",
  apt.name AS "الموقع",
  apt.is_enabled AS "مفعّل",
  apt.api_url AS "API"
FROM auto_publish_targets apt
JOIN media_units mu ON mu.id = apt.media_unit_id
ORDER BY mu.name;
```

**النتيجة المتوقعة:**
```
 الوحدة الإعلامية |     الموقع      | مفعّل |                    API
-------------------+------------------+-------+-------------------------------------------
 النجاح            | موقع النجاح     | true  | https://nn.najah.edu/api/v1/news/article/
 هنا غزة           | موقع هنا غزة    | true  | https://hgaza.nn.ps/api/v1/automation/news
```

---

## 📊 الفروقات الرئيسية بين الموقعين

| المعامل | موقع هنا غزة | موقع النجاح |
|---------|--------------|-------------|
| **Authentication** | `Bearer Token` | `Token` |
| **Category ID (محلي)** | 1 | 12 |
| **Tags** | `tags` + `keywords` | `keywords` فقط |
| **معاملات إضافية** | - | `auto_publish`, `pin` |

---

## 🎯 الاستخدام

### النشر التلقائي
- يعمل كل 10 دقائق عبر الـ Scheduler
- ينشر الأخبار الآلية (اقتصاد، رياضة، صحة، تكنولوجيا، إلخ)

### النشر اليدوي
```javascript
// من الفرونت اند - استديو التحرير
POST /api/auto-publish/publish-one
{
  "raw_data_id": 123,
  "target_id": 2  // ID موقع النجاح
}
```

---

## 📝 ملاحظات مهمة

1. ✅ الكود يكتشف الموقع تلقائياً من `api_url`
2. ✅ يختار الـ category mapping المناسب
3. ✅ يستخدم نوع المصادقة الصحيح
4. ✅ يضيف المعاملات الخاصة بكل موقع

---

## 🔗 روابط مفيدة

- [دليل التكامل الكامل](./docs/NAJAH_SITE_INTEGRATION.md)
- [نظام النشر المتعدد](./docs/MULTI_PLATFORM_PUBLISHING_SYSTEM.md)
- [شرح النشر التلقائي](./docs/EXTERNAL_AUTO_PUBLISH_EXPLAINED.md)

---

## 🆘 مشاكل شائعة

### ❌ الأخبار لا تُنشر
- تحقق من تفعيل `auto_publish_enabled`
- تحقق من تفعيل `is_enabled` للموقع

### ❌ خطأ 401 Unauthorized
- تأكد من صحة الـ Token
- الموقع يستخدم `Token` وليس `Bearer`

### ❌ خطأ في التصنيف
- راجع category mapping في الكود
- تأكد من التصنيف موجود على موقع النجاح

---

**تم بنجاح! 🎉**
