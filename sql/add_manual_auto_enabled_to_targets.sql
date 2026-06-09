-- ============================================================
-- Migration: استبدال is_enabled بـ manual_enabled + auto_enabled
--
-- الفكرة:
--   manual_enabled = true  → المحرر يقدر ينشر يدوياً على هذا الموقع
--   auto_enabled   = true  → السكيدولر ينشر تلقائياً على هذا الموقع
--
-- ممكن توقف الاثنين = ما في أي نشر على الموقع نهائياً
-- ممكن تفعّل واحد وتوقف الثاني = تتحكم بكل نوع على حدة
-- ينطبق على كل المواقع (هنا غزة، النجاح، وأي موقع تضيفه مستقبلاً)
-- ============================================================

-- 1. إضافة العمودين الجديدين
ALTER TABLE auto_publish_targets
  ADD COLUMN IF NOT EXISTS manual_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS auto_enabled   BOOLEAN NOT NULL DEFAULT false;

-- 2. نقل قيمة is_enabled الحالية إلى auto_enabled
--    (السجلات المفعّلة حالياً كانت تلقائية، ننقل قيمتها)
UPDATE auto_publish_targets
SET auto_enabled = is_enabled;

-- 3. النشر اليدوي — نفعّله لكل السجلات الموجودة
--    (بما أن is_enabled كانت تعني "مفعّل للنظام"، نفعّل اليدوي للكل)
UPDATE auto_publish_targets
SET manual_enabled = true;

-- 4. إزالة العمود القديم is_enabled
--    (نعلّق هذا السطر إذا في كود قديم لسه بيستخدمه — نفعّله بعد التحقق)
-- ALTER TABLE auto_publish_targets DROP COLUMN IF EXISTS is_enabled;

-- ============================================================
-- تحديثات خاصة بالمواقع الحالية
-- ============================================================

-- موقع هنا غزة — يدوي وتلقائي مفعّلان
UPDATE auto_publish_targets
SET manual_enabled = true,
    auto_enabled   = true
WHERE name = 'موقع هنا غزة';

-- موقع النجاح — يدوي فقط مفعّل، تلقائي متوقف
UPDATE auto_publish_targets
SET manual_enabled = true,
    auto_enabled   = false
WHERE name = 'موقع النجاح';

-- ============================================================
-- إضافة index للأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_auto_publish_targets_auto_enabled
  ON auto_publish_targets(auto_enabled)
  WHERE auto_enabled = true;

CREATE INDEX IF NOT EXISTS idx_auto_publish_targets_manual_enabled
  ON auto_publish_targets(manual_enabled)
  WHERE manual_enabled = true;

-- ============================================================
-- التحقق من النتيجة
-- ============================================================
SELECT
  apt.id,
  apt.name,
  mu.name AS media_unit,
  apt.manual_enabled AS "يدوي مفعّل",
  apt.auto_enabled   AS "تلقائي مفعّل",
  apt.is_enabled     AS "is_enabled (قديم)"
FROM auto_publish_targets apt
JOIN media_units mu ON mu.id = apt.media_unit_id
ORDER BY apt.name;
