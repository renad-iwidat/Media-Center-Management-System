-- ============================================================
-- Migration: إضافة صلاحيات الأخبار والذكاء الاصطناعي
-- Date: 2026-06-10
-- ============================================================

-- 1. إضافة الصلاحيات الجديدة
INSERT INTO permissions (name, description) VALUES
  ('news.view',        'عرض الأخبار والإحصائيات والأرشيف'),
  ('news.edit',        'تحرير ومراجعة الأخبار (غير مكتملة + قائمة التحرير)'),
  ('news.publish',     'نشر الأخبار على المنصات الخارجية'),
  ('news.settings',    'إعدادات الأخبار: مصادر السحب + السياسات التحريرية'),
  ('ai.use',           'استخدام أدوات الذكاء الاصطناعي'),
  ('ai.transcription', 'استخدام التفريغ الصوتي الذكي'),
  ('ai.analytics.view','عرض تحليلات استخدام الذكاء الاصطناعي')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- 2. ربط الصلاحيات بالأدوار
-- ============================================================

-- مدير المركز (22): كل شيء
INSERT INTO role_permissions (role_id, permission_id)
SELECT 22, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','news.settings','ai.use','ai.transcription','ai.analytics.view')
ON CONFLICT DO NOTHING;

-- مدقق لغوي (18): تحرير + نشر + إعدادات (منال)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 18, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','news.settings','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مطور ذكاء اصطناعي (21): كل شي أخبار + AI + إعدادات (خلف)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 21, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','news.settings','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مهندس/ة ذكاء اصطناعي (1): كل الأخبار + AI + إعدادات (رغد + رناد)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','news.settings','ai.use','ai.transcription','ai.analytics.view')
ON CONFLICT DO NOTHING;

-- محرر سوشال ميديا (16): تحرير + نشر
INSERT INTO role_permissions (role_id, permission_id)
SELECT 16, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- سوشال ميديا (13): نشر + عرض
INSERT INTO role_permissions (role_id, permission_id)
SELECT 13, id FROM permissions
WHERE name IN ('news.view','news.publish','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- معد/ة ومقدم برامج (11): تحرير + نشر
INSERT INTO role_permissions (role_id, permission_id)
SELECT 11, id FROM permissions
WHERE name IN ('news.view','news.edit','news.publish','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مترجم (17): تحرير + عرض
INSERT INTO role_permissions (role_id, permission_id)
SELECT 17, id FROM permissions
WHERE name IN ('news.view','news.edit','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- فني صوت (5): AI فقط
INSERT INTO role_permissions (role_id, permission_id)
SELECT 5, id FROM permissions
WHERE name IN ('ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مونتير (15): AI فقط
INSERT INTO role_permissions (role_id, permission_id)
SELECT 15, id FROM permissions
WHERE name IN ('ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مهندس/ة برمجيات (2): AI + تحليلات
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name IN ('ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- مصور (10), جرافيك (14), مخرج (19), Makeup (20), موظف إداري (9): AI minimum
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r
CROSS JOIN permissions p
WHERE r.id IN (10, 14, 19, 20, 9)
AND p.name IN ('ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- رؤية شاملة (23): أخبار عرض + AI
INSERT INTO role_permissions (role_id, permission_id)
SELECT 23, id FROM permissions
WHERE name IN ('news.view','ai.use','ai.transcription')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. تأكيد: التحقق من النتائج
-- ============================================================
-- SELECT r.name as role, array_agg(p.name ORDER BY p.name) as permissions
-- FROM role_permissions rp
-- JOIN roles r ON r.id = rp.role_id
-- JOIN permissions p ON p.id = rp.permission_id
-- WHERE p.name LIKE 'news.%' OR p.name LIKE 'ai.%'
-- GROUP BY r.name ORDER BY r.name;
