-- ============================================================
-- محاذاة slugs التصنيفات مع NewsDesk API
-- 
-- هاد بيحدّث الـ slug فقط — ما بيغيّر الاسم أو الـ flow
-- عشان الـ category_id يتربط تلقائياً لما الخبر يوصل من الـ API
-- ============================================================

-- التصنيفات يلي بتتطابق أصلاً (ما بنلمسها):
-- economy (id=3) ✅
-- sports (id=4) ✅
-- health (id=5) ✅
-- environment (id=9) ✅

-- التصنيفات يلي بدها تحديث slug:
UPDATE categories SET slug = 'politics' WHERE id = 11;   -- سياسي: political → politics
UPDATE categories SET slug = 'technology' WHERE id = 6;  -- علوم وتكنولوجيا: science-tech → technology
UPDATE categories SET slug = 'culture' WHERE id = 7;     -- فن و ثقافة: entertainment & culture → culture
UPDATE categories SET slug = 'society' WHERE id = 1;     -- محلي: local → society
UPDATE categories SET slug = 'other' WHERE id = 2;       -- دولي: world → other

-- ملاحظة: التصنيفات التالية من الـ API ما إلها مقابل محلي حالياً:
-- security (أمن وعسكري) — رح يروح لـ category_id = NULL ويتصنف بالـ AI المحلي
-- religion (دين) — نفس الشي
