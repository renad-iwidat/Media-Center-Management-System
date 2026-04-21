-- ============================================================
-- إضافة عمود pub_date لجدول raw_data
-- يخزن تاريخ نشر الخبر على الموقع الأصلي (من RSS pubDate)
-- ============================================================

ALTER TABLE raw_data
  ADD COLUMN IF NOT EXISTS pub_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN raw_data.pub_date IS 'تاريخ نشر الخبر على الموقع الأصلي (من RSS pubDate)';
