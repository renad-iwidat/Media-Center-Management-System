-- ============================================================
-- إنشاء جدول geographic_scopes
-- النطاقات الجغرافية للأخبار (من NewsDesk API)
-- ============================================================

CREATE TABLE IF NOT EXISTS geographic_scopes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(50) NOT NULL UNIQUE,
  name_ar VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL DEFAULT '',
  scope_level VARCHAR(20) NOT NULL DEFAULT 'local',  -- local, regional, international
  country_code VARCHAR(5) DEFAULT NULL,
  region_slug VARCHAR(50) DEFAULT NULL,
  sort_order INTEGER DEFAULT 999,
  is_active BOOLEAN DEFAULT true
);

-- ══════════════════════════════════════════════════════════════
-- إدخال البيانات
-- ══════════════════════════════════════════════════════════════

INSERT INTO geographic_scopes (id, slug, name_ar, name_en, scope_level, country_code, region_slug, sort_order) VALUES
  -- محلي (دول)
  (1,  'local-ps',         'محلي - فلسطين',         'Local - Palestine',        'local',         'PS', NULL,      10),
  (2,  'local-il',         'محلي - إسرائيل',        'Local - Israel',           'local',         'IL', NULL,      11),
  (3,  'local-jo',         'محلي - الأردن',         'Local - Jordan',           'local',         'JO', NULL,      20),
  (4,  'local-eg',         'محلي - مصر',            'Local - Egypt',            'local',         'EG', NULL,      30),
  (5,  'local-lb',         'محلي - لبنان',          'Local - Lebanon',          'local',         'LB', NULL,      40),
  (6,  'local-sy',         'محلي - سوريا',          'Local - Syria',            'local',         'SY', NULL,      50),
  (7,  'local-iq',         'محلي - العراق',         'Local - Iraq',             'local',         'IQ', NULL,      60),
  (8,  'local-sa',         'محلي - السعودية',       'Local - Saudi Arabia',     'local',         'SA', NULL,      70),
  (9,  'local-ae',         'محلي - الإمارات',       'Local - UAE',              'local',         'AE', NULL,      80),
  (10, 'local-qa',         'محلي - قطر',            'Local - Qatar',            'local',         'QA', NULL,      90),
  (11, 'local-kw',         'محلي - الكويت',         'Local - Kuwait',           'local',         'KW', NULL,      100),
  (12, 'local-bh',         'محلي - البحرين',        'Local - Bahrain',          'local',         'BH', NULL,      110),
  (13, 'local-om',         'محلي - عُمان',          'Local - Oman',             'local',         'OM', NULL,      120),
  (14, 'local-ye',         'محلي - اليمن',          'Local - Yemen',            'local',         'YE', NULL,      130),
  (15, 'local-ly',         'محلي - ليبيا',          'Local - Libya',            'local',         'LY', NULL,      140),
  (16, 'local-tn',         'محلي - تونس',           'Local - Tunisia',          'local',         'TN', NULL,      150),
  (17, 'local-dz',         'محلي - الجزائر',        'Local - Algeria',          'local',         'DZ', NULL,      160),
  (18, 'local-ma',         'محلي - المغرب',         'Local - Morocco',          'local',         'MA', NULL,      170),
  (19, 'local-sd',         'محلي - السودان',        'Local - Sudan',            'local',         'SD', NULL,      180),
  (20, 'local-tr',         'محلي - تركيا',          'Local - Turkey',           'local',         'TR', NULL,      190),
  (21, 'local-ir',         'محلي - إيران',          'Local - Iran',             'local',         'IR', NULL,      200),
  (22, 'local-so',         'محلي - الصومال',        'Local - Somalia',          'local',         'SO', NULL,      210),
  -- إقليمي
  (23, 'regional-levant',  'إقليمي - الشام',        'Regional - Levant',        'regional',      NULL, 'levant',  310),
  (24, 'regional-gulf',    'إقليمي - الخليج',       'Regional - Gulf',          'regional',      NULL, 'gulf',    320),
  (25, 'regional-maghreb', 'إقليمي - المغرب العربي','Regional - Maghreb',       'regional',      NULL, 'maghreb', 330),
  (26, 'regional-nile',    'إقليمي - حوض النيل',    'Regional - Nile Basin',    'regional',      NULL, 'nile',    340),
  (27, 'regional-arab',    'إقليمي - عربي عام',     'Regional - Arab World',    'regional',      NULL, 'arab',    350),
  (28, 'regional-mideast', 'إقليمي - الشرق الأوسط', 'Regional - Middle East',   'regional',      NULL, 'mideast', 360),
  -- دولي
  (29, 'intl-europe',      'دولي - أوروبا',         'International - Europe',   'international', NULL, 'europe',  410),
  (30, 'intl-us',          'دولي - أمريكا الشمالية','International - North America','international',NULL,'americas',420),
  (31, 'intl-asia',        'دولي - آسيا',           'International - Asia',     'international', NULL, 'asia',    430),
  (32, 'intl-africa',      'دولي - أفريقيا',        'International - Africa',   'international', NULL, 'africa',  440),
  (33, 'intl-latam',       'دولي - أمريكا اللاتينية','International - Latin America','international',NULL,'latam', 450),
  (34, 'intl-global',      'دولي - عالمي',          'International - Global',   'international', NULL, 'global',  499)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  scope_level = EXCLUDED.scope_level,
  country_code = EXCLUDED.country_code,
  region_slug = EXCLUDED.region_slug,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

-- تحديث الـ sequence
SELECT setval('geographic_scopes_id_seq', (SELECT MAX(id) FROM geographic_scopes));

-- ══════════════════════════════════════════════════════════════
-- إضافة geo_scope_id لجدول raw_data (FK)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE raw_data ADD COLUMN IF NOT EXISTS geo_scope_id INTEGER DEFAULT NULL;

-- FK constraint
ALTER TABLE raw_data 
  DROP CONSTRAINT IF EXISTS fk_raw_data_geo_scope;
ALTER TABLE raw_data 
  ADD CONSTRAINT fk_raw_data_geo_scope 
  FOREIGN KEY (geo_scope_id) REFERENCES geographic_scopes(id);

-- Index
CREATE INDEX IF NOT EXISTS idx_raw_data_geo_scope_id ON raw_data(geo_scope_id) WHERE geo_scope_id IS NOT NULL;

-- ══════════════════════════════════════════════════════════════
-- ربط الأخبار الموجودة بالـ geo_scope_id (من geo_scope_slug)
-- ══════════════════════════════════════════════════════════════

UPDATE raw_data r
SET geo_scope_id = gs.id
FROM geographic_scopes gs
WHERE r.geo_scope_slug = gs.slug
  AND r.geo_scope_id IS NULL
  AND r.geo_scope_slug != '';
