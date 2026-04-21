-- ============================================================
-- إضافة عمود last_fetched_at لجدول sources
-- يخزن آخر وقت تم سحب أخبار من هذا المصدر
-- ============================================================

ALTER TABLE sources
  ADD COLUMN IF NOT EXISTS last_fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

COMMENT ON COLUMN sources.last_fetched_at IS 'آخر وقت تم سحب أخبار من هذا المصدر';

-- إنشاء index للـ query الأسرع
CREATE INDEX IF NOT EXISTS idx_sources_last_fetched_at ON sources(last_fetched_at DESC);
