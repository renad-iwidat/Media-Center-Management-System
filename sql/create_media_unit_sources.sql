-- ============================================================
-- Migration: إنشاء جدول ربط المصادر بالوحدات الإعلامية
-- 
-- الهدف: كل وحدة إعلامية يكون عندها مصادرها الخاصة
-- السحب يصير بناءً على الوحدة الإعلامية
-- ============================================================

-- ══════════════════════════════════════════════════════════════
-- 1. جدول الربط media_unit_sources (Many-to-Many)
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS media_unit_sources (
  id              SERIAL PRIMARY KEY,
  media_unit_id   INTEGER NOT NULL REFERENCES media_units(id) ON DELETE CASCADE,
  source_id       INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  priority        INTEGER DEFAULT 1,           -- أولوية المصدر ضمن الوحدة (1 = أعلى)
  is_active       BOOLEAN DEFAULT true,        -- هل الربط نشط؟
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- منع التكرار: نفس المصدر مع نفس الوحدة مرة واحدة فقط
  UNIQUE(media_unit_id, source_id)
);

COMMENT ON TABLE media_unit_sources IS 'جدول ربط المصادر بالوحدات الإعلامية — كل وحدة لها مصادرها';
COMMENT ON COLUMN media_unit_sources.priority IS 'أولوية المصدر ضمن الوحدة (1 = أعلى أولوية)';

-- ══════════════════════════════════════════════════════════════
-- 2. Indexes
-- ══════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_media_unit_sources_unit 
  ON media_unit_sources(media_unit_id) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_media_unit_sources_source 
  ON media_unit_sources(source_id) WHERE is_active = true;

-- ══════════════════════════════════════════════════════════════
-- 3. إضافة عمود media_unit_id لجدول raw_data
--    لربط الخبر بالوحدة الإعلامية التي سحبته
-- ══════════════════════════════════════════════════════════════

ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS media_unit_id INTEGER REFERENCES media_units(id);

CREATE INDEX IF NOT EXISTS idx_raw_data_media_unit 
  ON raw_data(media_unit_id) WHERE media_unit_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- 4. إضافة slug لجدول media_units (للربط مع NewsDesk API)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE media_units ADD COLUMN IF NOT EXISTS slug VARCHAR(255) DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_units_slug 
  ON media_units(slug) WHERE slug != '';

-- ══════════════════════════════════════════════════════════════
-- 5. تحديث الوحدات الموجودة بـ slugs
-- ══════════════════════════════════════════════════════════════

UPDATE media_units SET slug = 'alnajah' WHERE name LIKE '%النجاح%' AND slug = '';
UPDATE media_units SET slug = 'huna-gaza' WHERE name LIKE '%هنا غزة%' AND slug = '';
