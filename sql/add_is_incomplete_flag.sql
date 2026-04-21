-- إضافة flag للأخبار الناقصة
-- هذا الـ flag يساعد في تتبع الأخبار التي لم تكتمل بعد

ALTER TABLE raw_data 
ADD COLUMN IF NOT EXISTS is_incomplete BOOLEAN DEFAULT false;

-- تحديث الأخبار الموجودة التي محتواها أقل من 300 حرف
UPDATE raw_data 
SET is_incomplete = true 
WHERE LENGTH(COALESCE(content, '')) < 300 
AND fetch_status IN ('fetched', 'processed');

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_raw_data_is_incomplete 
ON raw_data(is_incomplete, fetch_status);

-- التعليق
COMMENT ON COLUMN raw_data.is_incomplete IS 'true إذا كان المحتوى أقل من 300 حرف';
