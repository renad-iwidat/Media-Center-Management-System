-- تنظيف طابور التحرير من الأخبار الناقصة
-- ينقل الأخبار اللي محتواها أقل من 150 حرف من editorial_queue لحالة fetched

-- 1. إرجاع الأخبار الناقصة لحالة fetched بالـ raw_data
UPDATE raw_data
SET fetch_status = 'fetched'
WHERE id IN (
  SELECT eq.raw_data_id
  FROM editorial_queue eq
  JOIN raw_data rd ON eq.raw_data_id = rd.id
  WHERE LENGTH(rd.content) < 500
    AND eq.status = 'pending'
);

-- 2. حذف الأخبار الناقصة من طابور التحرير
DELETE FROM editorial_queue
WHERE id IN (
  SELECT eq.id
  FROM editorial_queue eq
  JOIN raw_data rd ON eq.raw_data_id = rd.id
  WHERE LENGTH(rd.content) < 150
    AND eq.status = 'pending'
);
