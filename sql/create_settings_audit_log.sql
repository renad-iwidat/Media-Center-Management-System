-- ============================================================
-- Settings Audit Log Table
-- جدول تتبع تغييرات الإعدادات — مين غيّر شو ومتى
-- ============================================================

CREATE TABLE IF NOT EXISTS settings_audit_log (
  id            SERIAL PRIMARY KEY,
  setting_key   VARCHAR(150) NOT NULL,          -- مفتاح الإعداد (مثل scheduler_enabled)
  old_value     TEXT,                            -- القيمة القديمة
  new_value     TEXT NOT NULL,                   -- القيمة الجديدة
  action_type   VARCHAR(50) NOT NULL DEFAULT 'update', -- نوع العملية: update, toggle, create
  changed_by    INTEGER,                         -- user_id اللي عمل التغيير
  changed_by_email VARCHAR(255),                 -- إيميل المستخدم (للعرض السريع)
  changed_by_role  VARCHAR(100),                 -- دور المستخدم وقت التغيير
  description   TEXT,                            -- وصف التغيير (اختياري)
  ip_address    VARCHAR(45),                     -- IP المستخدم (اختياري)
  created_at    TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_key ON settings_audit_log(setting_key);
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_user ON settings_audit_log(changed_by);
CREATE INDEX IF NOT EXISTS idx_settings_audit_log_date ON settings_audit_log(created_at DESC);

-- ============================================================
-- أيضاً: إضافة عمود updated_by لجدول system_settings
-- ============================================================
ALTER TABLE system_settings
  ADD COLUMN IF NOT EXISTS updated_by INTEGER,
  ADD COLUMN IF NOT EXISTS updated_by_email VARCHAR(255);
