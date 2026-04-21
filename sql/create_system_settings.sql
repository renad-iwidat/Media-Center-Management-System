-- ============================================================
-- System Settings Table
-- جدول إعدادات النظام — يخزن الـ flags اللي بتتحكم بالسيرفسز
-- ============================================================

CREATE TABLE IF NOT EXISTS system_settings (
  key         VARCHAR(100) PRIMARY KEY,
  value       TEXT         NOT NULL,
  description TEXT,
  updated_at  TIMESTAMP    DEFAULT NOW()
);

-- القيم الافتراضية
INSERT INTO system_settings (key, value, description) VALUES
  ('scheduler_enabled',          'true',  'تشغيل/إيقاف السحب التلقائي للأخبار'),
  ('classifier_enabled',         'true',  'تشغيل/إيقاف التصنيف الآلي للأخبار'),
  ('flow_enabled',               'true',  'تشغيل/إيقاف فلو توجيه الأخبار للمسارات'),
  ('scheduler_interval_minutes', '15',    'الفاصل الزمني بين كل دورة سحب بالدقائق (مثال: 10، 15، 30، 60)'),
  ('articles_per_source',        '20',    'عدد الأخبار المسحوبة من كل مصدر في كل دورة')
ON CONFLICT (key) DO NOTHING;
