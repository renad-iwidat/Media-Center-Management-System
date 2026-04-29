-- إضافة unique constraint على published_items
-- لمنع نشر نفس الخبر (raw_data_id) مرتين لنفس الوحدة الإعلامية (media_unit_id)

-- أولاً: حذف التكرارات — احتفظ بأحدث سجل فقط لكل (raw_data_id, media_unit_id)
DELETE FROM published_items 
WHERE id NOT IN (
  SELECT MAX(id) FROM published_items 
  GROUP BY raw_data_id, media_unit_id
);

-- إضافة unique constraint
ALTER TABLE published_items
ADD CONSTRAINT unique_raw_data_per_media_unit 
UNIQUE (raw_data_id, media_unit_id);

-- إضافة تعليق على الـ constraint
COMMENT ON CONSTRAINT unique_raw_data_per_media_unit ON published_items 
IS 'منع نشر نفس الخبر (raw_data_id) مرتين لنفس الوحدة الإعلامية (media_unit_id)';
