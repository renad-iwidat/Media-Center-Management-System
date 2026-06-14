-- ============================================================
-- إضافة عمود is_cleaned لجدول raw_data
-- يحدد هل الخبر تم تنظيفه قبل النشر أم لا
-- ============================================================

ALTER TABLE raw_data
  ADD COLUMN IF NOT EXISTS is_cleaned BOOLEAN NOT NULL DEFAULT false;

-- تحديث الأخبار المنشورة سابقاً (نعتبرها منظفة لعدم التأثير على القديم)
UPDATE raw_data SET is_cleaned = true
WHERE fetch_status IN ('published') OR publish_status IN ('published_external', 'ready_for_publish');

-- Index للأداء
CREATE INDEX IF NOT EXISTS idx_raw_data_is_cleaned
  ON raw_data(is_cleaned)
  WHERE is_cleaned = false;
