# 🎓 دليل ربط موقع النجاح (nn.najah.edu)

## 📋 نظرة عامة

تم إضافة موقع النجاح الإخباري (nn.najah.edu) كموقع نشر خارجي جديد للوحدة الإعلامية "النجاح". يدعم النظام الآن النشر التلقائي على موقعين:

1. **موقع هنا غزة** (hgaza.nn.ps) - للوحدة الإعلامية "هنا غزة"
2. **موقع النجاح** (nn.najah.edu) - للوحدة الإعلامية "النجاح"

---

## 🔑 بيانات الاتصال (API Credentials)

### موقع النجاح (nn.najah.edu)

```
Username: liminal
Password: najah@2020
Token: 9eedb2ef002f23c08c23b2b1adbc2fc2ff3da320
API URL: https://nn.najah.edu/api/v1/news/article/
```

### طريقة المصادقة

- **موقع النجاح**: يستخدم `Token` Authentication
  ```
  Authorization: Token 9eedb2ef002f23c08c23b2b1adbc2fc2ff3da320
  ```

- **موقع هنا غزة**: يستخدم `Bearer` Token
  ```
  Authorization: Bearer 2|wN4CYvKv2ND3paNMgG8VxOntVBwG5a5mFdaEE5sY76c8b503
  ```

---

## 🗂️ ربط التصنيفات (Category Mapping)

### تصنيفات النظام → موقع النجاح

| ID | التصنيف المحلي | Flow | موقع النجاح (Category ID) |
|----|----------------|------|---------------------------|
| 1  | محلي           | editorial | 12 - الأخبار المحلية |
| 2  | دولي           | editorial | 4 - الأخبار الدولية |
| 3  | اقتصاد         | automated | 6 - الاقتصاد |
| 4  | رياضة          | automated | 7 - الرياضة |
| 5  | صحة            | automated | 2 - الصحة |
| 6  | علوم وتكنولوجيا | automated | 8 - تكنولوجيا |
| 7  | فن و ثقافة     | automated | 9 - الثقافة |
| 9  | بيئة           | automated | 10 - اجتماعي |
| 10 | غذاء           | automated | 13 - أخبار عامة |
| 11 | سياسي          | editorial | 5 - السياسة |

**ملاحظة:** الفرق الرئيسي بين الموقعين هو تصنيف "محلي":
- هنا غزة: `1` (الأخبار المحلية)
- النجاح: `12` (الأخبار المحلية)

---

## 📡 صيغة API Request

### موقع النجاح

```bash
curl -X POST \
  -H "Authorization: Token 9eedb2ef002f23c08c23b2b1adbc2fc2ff3da320" \
  -F "title=عنوان الخبر" \
  -F "category_id=12" \
  -F "content=<p>محتوى الخبر</p>" \
  -F "image_base64=data:image/jpeg;base64,..." \
  -F "keywords=تكنولوجيا,ذكاء اصطناعي" \
  -F "auto_publish=true" \
  -F "pin=0" \
  https://nn.najah.edu/api/v1/news/article/
```

### معاملات خاصة بموقع النجاح

- **`auto_publish`**: `true` للنشر المباشر، `false` للحفظ كمسودة
- **`pin`**: رقم من 0-5
  - `0`: غير مثبت
  - `1-5`: مثبت في الصفحة الرئيسية (5 أخبار)
  - `5`: الخبر الأول (صورة كبيرة)

---

## 🚀 التفعيل والاستخدام

### 1. تشغيل السكريبت SQL

```bash
psql -U your_username -d your_database -f sql/add_najah_site.sql
```

أو من داخل PostgreSQL:

```sql
\i sql/add_najah_site.sql
```

### 2. تفعيل الموقع

```sql
-- تفعيل موقع النجاح للنشر
UPDATE auto_publish_targets 
SET is_enabled = true 
WHERE name = 'موقع النجاح';
```

### 3. تفعيل النشر التلقائي (Master Switch)

```sql
-- تفعيل النشر التلقائي على جميع المواقع
UPDATE system_settings 
SET value = 'true' 
WHERE key = 'auto_publish_enabled';
```

### 4. التحقق من الإعدادات

```sql
-- عرض جميع مواقع النشر
SELECT 
  apt.id,
  mu.name AS media_unit,
  apt.name AS target_name,
  apt.api_url,
  apt.is_enabled
FROM auto_publish_targets apt
JOIN media_units mu ON mu.id = apt.media_unit_id
ORDER BY mu.name, apt.name;
```

---

## 🔄 آلية النشر

### النشر التلقائي (Automated Categories)

الأخبار من التصنيفات الآلية (اقتصاد، رياضة، صحة، تكنولوجيا، ثقافة، بيئة، غذاء) تُنشر تلقائياً:

```
raw_data → AI Classification → Auto-Approve → published_items
                                                     ↓
                                   Scheduler (كل 10 دقائق)
                                                     ↓
                                   auto_publish_targets (enabled)
                                                     ↓
                                   POST إلى موقع النجاح
```

### النشر اليدوي (Editorial Categories)

الأخبار التحريرية (محلي، دولي، سياسي) تحتاج موافقة المحرر:

```
raw_data → AI Classification → editorial_queue (pending)
                                        ↓
                                  المحرر يراجع
                                        ↓
                    ┌───────────────────┴────────────────────┐
                    ↓                                        ↓
              يوافق: published_items                    يرفض: archived
                    ↓
          المحرر يختار "نشر على موقع خارجي"
                    ↓
          POST /api/auto-publish/publish-one
                    ↓
          POST إلى موقع النجاح
```

---

## 📊 مراقبة النشر

### عرض سجل النشر

```sql
-- آخر 20 عملية نشر على موقع النجاح
SELECT 
  apl.id,
  rd.title,
  apl.status,
  apl.external_url,
  apl.external_id,
  apl.published_at,
  apl.error_message
FROM auto_publish_log apl
JOIN auto_publish_targets apt ON apt.id = apl.target_id
JOIN raw_data rd ON rd.id = apl.raw_data_id
WHERE apt.name = 'موقع النجاح'
ORDER BY apl.created_at DESC
LIMIT 20;
```

### إحصائيات النشر

```sql
-- إحصائيات النشر لموقع النجاح
SELECT 
  apt.name,
  COUNT(*) FILTER (WHERE apl.status = 'success') AS successful,
  COUNT(*) FILTER (WHERE apl.status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE apl.status = 'success' AND apl.published_at > NOW() - INTERVAL '24 hours') AS today
FROM auto_publish_targets apt
LEFT JOIN auto_publish_log apl ON apl.target_id = apt.id
WHERE apt.name = 'موقع النجاح'
GROUP BY apt.name;
```

---

## 🔧 استكشاف الأخطاء

### مشكلة: الأخبار لا تُنشر تلقائياً

**الحلول:**

1. تحقق من Master Switch:
   ```sql
   SELECT * FROM system_settings WHERE key = 'auto_publish_enabled';
   ```

2. تحقق من تفعيل الموقع:
   ```sql
   SELECT is_enabled FROM auto_publish_targets WHERE name = 'موقع النجاح';
   ```

3. تحقق من الـ Scheduler:
   ```bash
   # في logs الباكند
   grep "auto-publish" logs/backend.log
   ```

### مشكلة: خطأ في المصادقة (401 Unauthorized)

- تأكد من صحة الـ Token
- تأكد من استخدام `Token` بدلاً من `Bearer`

### مشكلة: خطأ في التصنيف (Category not found)

- تأكد من mapping التصنيفات صحيح
- تحقق من أن التصنيف موجود على موقع النجاح

---

## 🔐 الأمان

### ملاحظات هامة:

1. **Token حساس**: لا تشاركه أو تكتبه في الكود
2. **البيئة الإنتاجية**: استخدم `.env` لتخزين الـ credentials
3. **HTTPS فقط**: تأكد من استخدام HTTPS للاتصالات

### تحديث الـ Token:

```sql
UPDATE auto_publish_targets 
SET api_token = 'NEW_TOKEN_HERE' 
WHERE name = 'موقع النجاح';
```

---

## 🎯 API Endpoints (Backend)

### 1. جلب جميع مواقع النشر
```
GET /api/auto-publish/targets
```

### 2. جلب مواقع النشر لوحدة إعلامية
```
GET /api/auto-publish/targets/media-unit/:mediaUnitId
```

### 3. نشر خبر يدوياً
```
POST /api/auto-publish/publish-one
Body: {
  "raw_data_id": 123,
  "target_id": 2
}
```

### 4. تفعيل/إيقاف موقع نشر
```
PUT /api/auto-publish/targets/:id/toggle
Body: {
  "enabled": true
}
```

### 5. إحصائيات النشر
```
GET /api/auto-publish/stats
```

---

## 📝 ملاحظات إضافية

1. **التأخير بين الطلبات**: 5 ثوانٍ لتجنب rate limiting
2. **إعادة المحاولة**: حتى 3 محاولات للأخبار الفاشلة
3. **الصور**: تُحوّل لـ base64 قبل الإرسال
4. **المحتوى**: يُرسل كـ HTML

---

## 🆘 الدعم

لأي مشاكل أو استفسارات، راجع:
- [MULTI_PLATFORM_PUBLISHING_SYSTEM.md](./MULTI_PLATFORM_PUBLISHING_SYSTEM.md)
- [EXTERNAL_AUTO_PUBLISH_EXPLAINED.md](./EXTERNAL_AUTO_PUBLISH_EXPLAINED.md)
- [API_REFERENCE.md](./API_REFERENCE.md)
