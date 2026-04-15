# ملخص جمل SQL المستخدمة في المشروع

## 📋 جدول المحتويات
1. [جمل SELECT](#جمل-select)
2. [جمل INSERT](#جمل-insert)
3. [جمل UPDATE](#جمل-update)
4. [الجداول المستخدمة](#الجداول-المستخدمة)

---

## جمل SELECT

### 1. جلب أنواع المصادر
```sql
SELECT * FROM source_types ORDER BY id;
```

### 2. جلب نوع مصدر بالـ ID
```sql
SELECT * FROM source_types WHERE id = $1;
```

### 3. جلب نوع مصدر بالاسم
```sql
SELECT * FROM source_types WHERE name = $1;
```

### 4. جلب جميع المصادر مع أنواعها
```sql
SELECT s.*, st.name as source_type_name 
FROM sources s 
LEFT JOIN source_types st ON s.source_type_id = st.id 
ORDER BY s.id;
```

### 5. جلب مصدر بالـ ID
```sql
SELECT * FROM sources WHERE id = $1;
```

### 6. جلب المصادر النشطة
```sql
SELECT id, source_type_id, url, name, is_active, created_at, default_category_id 
FROM sources 
WHERE is_active = true 
ORDER BY id;
```

### 7. جلب جميع البيانات الخام
```sql
SELECT * FROM raw_data ORDER BY fetched_at DESC;
```

### 8. جلب بيانات خام بالـ ID
```sql
SELECT * FROM raw_data WHERE id = $1;
```

### 9. جلب البيانات الخام حسب المصدر
```sql
SELECT * FROM raw_data 
WHERE source_id = $1 
ORDER BY fetched_at DESC;
```

### 10. التحقق من وجود خبر بالـ URL
```sql
SELECT id FROM raw_data 
WHERE url = $1 
LIMIT 1;
```

### 11. جلب جميع التصنيفات النشطة
```sql
SELECT * FROM categories 
WHERE is_active = true 
ORDER BY name;
```

### 12. جلب تصنيف بالـ ID
```sql
SELECT * FROM categories WHERE id = $1;
```

### 13. جلب تصنيف بالـ slug
```sql
SELECT * FROM categories WHERE slug = $1;
```

### 14. جلب طابور التحرير
```sql
SELECT * FROM editorial_queue 
ORDER BY created_at DESC;
```

### 15. جلب عناصر الطابور حسب الحالة
```sql
SELECT * FROM editorial_queue 
WHERE status = $1 
ORDER BY created_at DESC;
```

### 16. جلب جميع العناصر المعلقة في الطابور مع التفاصيل
```sql
SELECT 
  eq.id,
  eq.media_unit_id,
  eq.raw_data_id,
  eq.policy_id,
  eq.status,
  eq.editor_notes,
  eq.created_at,
  eq.updated_at,
  rd.title,
  rd.content,
  c.name as category_name,
  mu.name as media_unit_name
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
JOIN media_units mu ON eq.media_unit_id = mu.id
WHERE eq.status = 'pending'
ORDER BY eq.created_at ASC;
```

### 17. جلب عنصر واحد من الطابور مع التفاصيل
```sql
SELECT 
  eq.id,
  eq.media_unit_id,
  eq.raw_data_id,
  eq.policy_id,
  eq.status,
  eq.editor_notes,
  eq.created_at,
  eq.updated_at,
  rd.title,
  rd.content,
  rd.image_url,
  rd.url,
  c.name as category_name,
  mu.name as media_unit_name
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
JOIN media_units mu ON eq.media_unit_id = mu.id
WHERE eq.id = $1;
```

### 18. جلب المحتوى المنشور
```sql
SELECT * FROM published_items 
WHERE is_active = true 
ORDER BY published_at DESC;
```

### 19. جلب محتوى منشور بالـ ID
```sql
SELECT * FROM published_items WHERE id = $1;
```

### 20. جلب جميع المحتوى المنشور مع التفاصيل
```sql
SELECT 
  pi.id,
  pi.media_unit_id,
  pi.raw_data_id,
  pi.queue_id,
  pi.content_type_id,
  pi.title,
  pi.content,
  pi.tags,
  pi.is_active,
  pi.published_at,
  rd.image_url,
  rd.url as original_url,
  c.name as category_name,
  mu.name as media_unit_name,
  CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
  pi.tags as tag_names
FROM published_items pi
JOIN raw_data rd ON pi.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
JOIN media_units mu ON pi.media_unit_id = mu.id
WHERE pi.is_active = true
ORDER BY pi.published_at DESC
LIMIT $1;
```

### 21. جلب محتوى منشور واحد مع التفاصيل
```sql
SELECT 
  pi.id,
  pi.media_unit_id,
  pi.raw_data_id,
  pi.queue_id,
  pi.content_type_id,
  pi.title,
  pi.content,
  pi.tags,
  pi.is_active,
  pi.published_at,
  rd.image_url,
  rd.url as original_url,
  c.name as category_name,
  mu.name as media_unit_name,
  CASE WHEN pi.queue_id IS NULL THEN 'automated' ELSE 'editorial' END as flow_type,
  pi.tags as tag_names
FROM published_items pi
JOIN raw_data rd ON pi.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
JOIN media_units mu ON pi.media_unit_id = mu.id
WHERE pi.id = $1 AND pi.is_active = true;
```

### 22. جلب الأخبار الجديدة (fetch_status = 'fetched')
```sql
SELECT * FROM raw_data 
WHERE fetch_status = 'fetched' 
ORDER BY fetched_at ASC;
```

### 23. جلب الفئات النشطة
```sql
SELECT id, name, flow, is_active FROM categories 
WHERE is_active = true;
```

### 24. جلب وحدات الإعلام النشطة
```sql
SELECT id, name, is_active FROM media_units 
WHERE is_active = true;
```

### 25. جلب content_type_id للأخبار
```sql
SELECT id FROM content_types 
WHERE name = 'news' 
LIMIT 1;
```

### 26. جلب إحصائيات الطابور
```sql
SELECT 
  mu.id,
  mu.name,
  COUNT(CASE WHEN eq.status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN eq.status = 'in_review' THEN 1 END) as in_review_count,
  COUNT(CASE WHEN eq.status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN eq.status = 'rejected' THEN 1 END) as rejected_count
FROM media_units mu
LEFT JOIN editorial_queue eq ON mu.id = eq.media_unit_id
WHERE mu.is_active = true
GROUP BY mu.id, mu.name
ORDER BY pending_count DESC;
```

### 27. جلب إجمالي المحتوى المنشور
```sql
SELECT COUNT(*) as total FROM published_items 
WHERE is_active = true;
```

### 28. جلب عدد المحتوى الأوتوماتيكي والتحريري
```sql
SELECT 
  COUNT(CASE WHEN queue_id IS NULL THEN 1 END) as automated_count,
  COUNT(CASE WHEN queue_id IS NOT NULL THEN 1 END) as editorial_count
FROM published_items 
WHERE is_active = true;
```

### 29. جلب المحتوى حسب الفئة
```sql
SELECT 
  c.id,
  c.name as category,
  COUNT(*) as count
FROM published_items pi
JOIN raw_data rd ON pi.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
WHERE pi.is_active = true
GROUP BY c.id, c.name
ORDER BY count DESC;
```

### 31. جلب المحتوى حسب وحدة الإعلام
```sql
SELECT 
  mu.id,
  mu.name as media_unit,
  COUNT(*) as count
FROM published_items pi
JOIN media_units mu ON pi.media_unit_id = mu.id
WHERE pi.is_active = true
GROUP BY mu.id, mu.name
ORDER BY count DESC;
```

### 32. جلب خبر من الـ queue مع التفاصيل الكاملة
```sql
SELECT 
  eq.id as queue_id,
  eq.media_unit_id,
  eq.raw_data_id,
  eq.status,
  rd.title,
  rd.content,
  rd.category_id,
  c.name as category_name,
  mu.name as media_unit_name
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
JOIN categories c ON rd.category_id = c.id
JOIN media_units mu ON eq.media_unit_id = mu.id
WHERE eq.id = $1;
```

### 33. جلب بيانات الخبر من editorial_queue
```sql
SELECT 
  eq.id,
  eq.media_unit_id,
  eq.raw_data_id,
  rd.title,
  rd.content,
  rd.tags
FROM editorial_queue eq
JOIN raw_data rd ON eq.raw_data_id = rd.id
WHERE eq.id = $1;
```

---

## جمل INSERT

### 1. إنشاء نوع مصدر جديد
```sql
INSERT INTO source_types (name) 
VALUES ($1) 
RETURNING *;
```

### 2. إنشاء مصدر جديد
```sql
INSERT INTO sources (source_type_id, url, name, is_active, created_at) 
VALUES ($1, $2, $3, $4, NOW()) 
RETURNING *;
```

### 3. إنشاء بيانات خام جديدة
```sql
INSERT INTO raw_data 
(source_id, source_type_id, category_id, url, title, content, image_url, tags, fetch_status, fetched_at) 
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) 
RETURNING *;
```

### 4. إنشاء تصنيف جديد
```sql
INSERT INTO categories (name, slug, flow, is_active) 
VALUES ($1, $2, $3, $4) 
RETURNING *;
```

### 5. إضافة عنصر جديد للطابور
```sql
INSERT INTO editorial_queue 
(media_unit_id, raw_data_id, policy_id, status, created_at, updated_at) 
VALUES ($1, $2, $3, $4, NOW(), NOW()) 
RETURNING *;
```

### 6. إنشاء محتوى منشور جديد
```sql
INSERT INTO published_items 
(media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
VALUES ($1, $2, NULL, $3, $4, $5, $6, true, NOW());
```

### 7. إضافة خبر لطابور التحرير (من flow-router)
```sql
INSERT INTO editorial_queue 
(media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
VALUES ($1, $2, NULL, 'pending', NOW(), NOW());
```

### 8. نشر خبر معتمد من الطابور
```sql
INSERT INTO published_items 
(media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
VALUES ($1, $2, $3, $4, $5, $6, true, NOW());
```

---

## جمل UPDATE

### 1. تحديث مصدر
```sql
UPDATE sources 
SET name = $1, is_active = $2, url = $3 
WHERE id = $4 
RETURNING *;
```

### 2. تحديث تصنيف الخبر
```sql
UPDATE raw_data 
SET category_id = $1 
WHERE id = $2 
RETURNING *;
```

### 3. تحديث حالة الخبر
```sql
UPDATE raw_data 
SET fetch_status = $1 
WHERE id = $2;
```

### 4. تحديث حالة عنصر الطابور إلى 'in_review'
```sql
UPDATE editorial_queue 
SET status = 'in_review', 
    policy_id = $1, 
    editor_notes = $2,
    updated_at = NOW()
WHERE id = $3;
```

### 5. تحديث حالة عنصر الطابور إلى 'approved'
```sql
UPDATE editorial_queue 
SET status = 'approved', 
    updated_at = NOW()
WHERE id = $1;
```

### 6. رفض عنصر من الطابور
```sql
UPDATE editorial_queue 
SET status = 'rejected', 
    editor_notes = $1,
    updated_at = NOW()
WHERE id = $2;
```

### 7. إلغاء تفعيل محتوى منشور
```sql
UPDATE published_items 
SET is_active = false 
WHERE id = $1;
```

---

## الجداول المستخدمة

### 1. source_types
- **الوصف:** أنواع المصادر (RSS, API, Telegram, Web Scraper)
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `name` (VARCHAR)

### 2. sources
- **الوصف:** المصادر الفعلية
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `source_type_id` (INT, FOREIGN KEY)
  - `url` (VARCHAR)
  - `name` (VARCHAR)
  - `is_active` (BOOLEAN)
  - `created_at` (TIMESTAMP)
  - `default_category_id` (INT)

### 3. raw_data
- **الوصف:** البيانات الخام المجلوبة من المصادر
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `source_id` (INT, FOREIGN KEY)
  - `source_type_id` (INT, FOREIGN KEY)
  - `category_id` (INT, FOREIGN KEY)
  - `url` (VARCHAR)
  - `title` (VARCHAR)
  - `content` (TEXT)
  - `image_url` (VARCHAR)
  - `tags` (ARRAY)
  - `fetch_status` (VARCHAR) - 'pending', 'fetched', 'processed'
  - `fetched_at` (TIMESTAMP)

### 4. categories
- **الوصف:** التصنيفات (سياسة، رياضة، إلخ)
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `name` (VARCHAR)
  - `slug` (VARCHAR)
  - `flow` (VARCHAR) - 'automated' أو 'editorial'
  - `is_active` (BOOLEAN)

### 5. editorial_queue
- **الوصف:** طابور التحرير (الأخبار المعلقة للمراجعة)
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `media_unit_id` (INT, FOREIGN KEY)
  - `raw_data_id` (INT, FOREIGN KEY)
  - `policy_id` (INT, FOREIGN KEY) - يمكن أن يكون NULL
  - `status` (VARCHAR) - 'pending', 'in_review', 'approved', 'rejected'
  - `editor_notes` (TEXT)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### 6. published_items
- **الوصف:** المحتوى المنشور
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `media_unit_id` (INT, FOREIGN KEY)
  - `raw_data_id` (INT, FOREIGN KEY)
  - `queue_id` (INT, FOREIGN KEY) - NULL للمحتوى الأوتوماتيكي
  - `content_type_id` (INT, FOREIGN KEY)
  - `title` (VARCHAR)
  - `content` (TEXT)
  - `tags` (ARRAY)
  - `is_active` (BOOLEAN)
  - `published_at` (TIMESTAMP)

### 7. media_units
- **الوصف:** وحدات الإعلام
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `name` (VARCHAR)
  - `is_active` (BOOLEAN)

### 8. content_types
- **الوصف:** أنواع المحتوى
- **الأعمدة:**
  - `id` (INT, PRIMARY KEY)
  - `name` (VARCHAR) - مثل 'news'

---

## 📊 ملخص الإحصائيات

- **عدد جمل SELECT:** 33
- **عدد جمل INSERT:** 8
- **عدد جمل UPDATE:** 7
- **عدد الجداول المستخدمة:** 9
- **عدد الـ JOINs المستخدمة:** 15+

---

## 🔗 الملفات التي تحتوي على جمل SQL

1. `src/services/database/database.service.ts` - خدمات قاعدة البيانات الأساسية
2. `src/services/news/flow-router.service.ts` - توجيه الأخبار
3. `src/services/news/editorial-queue.service.ts` - إدارة طابور التحرير
4. `src/services/news/published-items.service.ts` - إدارة المحتوى المنشور
5. `src/utils/test-policies-pipeline.ts` - اختبار سياسات التحرير

---

## ⚠️ ملاحظات مهمة

1. **استخدام Parameterized Queries:** جميع جمل SQL تستخدم `$1, $2, ...` لتجنب SQL Injection
2. **Timestamps:** جميع العمليات تستخدم `NOW()` للتاريخ والوقت الحالي
3. **Foreign Keys:** جميع الجداول مرتبطة بـ Foreign Keys
4. **Status Values:** الحالات المستخدمة:
   - `fetch_status`: 'pending', 'fetched', 'processed'
   - `editorial_queue.status`: 'pending', 'in_review', 'approved', 'rejected'
   - `flow`: 'automated', 'editorial'
5. **NULL Values:** بعض الحقول يمكن أن تكون NULL (مثل `policy_id`, `queue_id`, `editor_notes`)

