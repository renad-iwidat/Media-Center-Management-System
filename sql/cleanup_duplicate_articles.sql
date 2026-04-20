-- تنظيف الأخبار المكررة من قاعدة البيانات
-- هذا السكريبت يزيل الأخبار المكررة ويحتفظ بأقدم نسخة
-- الترتيب مهم جداً: published_items → editorial_queue → raw_data

-- 1. حذف المكررات من published_items أولاً (لا توجد foreign keys تشير إليها)
DELETE FROM published_items
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY raw_data_id, media_unit_id 
      ORDER BY published_at ASC
    ) as rn
    FROM published_items
  ) t
  WHERE rn > 1
);

-- 2. تحديث queue_id إلى NULL في published_items للمكررات من editorial_queue
UPDATE published_items
SET queue_id = NULL
WHERE queue_id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY raw_data_id, media_unit_id 
      ORDER BY created_at ASC
    ) as rn
    FROM editorial_queue
  ) t
  WHERE rn > 1
);

-- 3. حذف المكررات من editorial_queue ثانياً
DELETE FROM editorial_queue
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY raw_data_id, media_unit_id 
      ORDER BY created_at ASC
    ) as rn
    FROM editorial_queue
  ) t
  WHERE rn > 1
);

-- 4. حذف published_items المرتبطة بـ raw_data المكررة
WITH duplicate_raw_data AS (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY fetched_at ASC
    ) as rn
    FROM raw_data
  ) t
  WHERE rn > 1
)
DELETE FROM published_items
WHERE raw_data_id IN (SELECT id FROM duplicate_raw_data);

-- 5. تحديث queue_id إلى NULL في published_items للمرتبطة بـ raw_data المكررة
WITH duplicate_raw_data AS (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY fetched_at ASC
    ) as rn
    FROM raw_data
  ) t
  WHERE rn > 1
)
UPDATE published_items
SET queue_id = NULL
WHERE queue_id IN (
  SELECT eq.id FROM editorial_queue eq
  WHERE eq.raw_data_id IN (SELECT id FROM duplicate_raw_data)
);

-- 6. حذف editorial_queue المرتبطة بـ raw_data المكررة
WITH duplicate_raw_data AS (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY fetched_at ASC
    ) as rn
    FROM raw_data
  ) t
  WHERE rn > 1
)
DELETE FROM editorial_queue
WHERE raw_data_id IN (SELECT id FROM duplicate_raw_data);

-- 7. الآن نحذف الأخبار المكررة من raw_data (نفس العنوان)
DELETE FROM raw_data
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(title)) 
      ORDER BY fetched_at ASC
    ) as rn
    FROM raw_data
  ) t
  WHERE rn > 1
);

-- 8. عرض إحصائيات بعد التنظيف
SELECT 
  'raw_data' as table_name,
  COUNT(*) as total_articles,
  COUNT(DISTINCT LOWER(TRIM(title))) as unique_titles
FROM raw_data
UNION ALL
SELECT 
  'editorial_queue' as table_name,
  COUNT(*) as total_items,
  COUNT(DISTINCT raw_data_id) as unique_articles
FROM editorial_queue
UNION ALL
SELECT 
  'published_items' as table_name,
  COUNT(*) as total_items,
  COUNT(DISTINCT raw_data_id) as unique_articles
FROM published_items;
