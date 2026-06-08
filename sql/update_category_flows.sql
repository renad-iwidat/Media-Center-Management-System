-- =============================================================================
-- تحديث عمود flow لجدول categories
-- =============================================================================
-- يُنفَّذ مرة واحدة بعد تغيير DEFAULT_FLOW في category-flow.config.ts
--
-- المنطق:
--   editorial  ← slugs محددة فقط: politics, security, society, other, religion
--   automated  ← كل ما عداها (بما فيها أي slug جديد من الـ API)
-- =============================================================================

-- فقط 3 تصنيفات تحريرية: سياسي + عسكري + ديني
-- كل الباقي (بما فيهم أي slug جديد من الـ API) = automated

UPDATE categories
SET flow = CASE
    WHEN slug IN ('politics', 'security', 'religion')
        THEN 'editorial'
    ELSE 'automated'
END
WHERE is_active = true;

-- التحقق من النتيجة
SELECT slug, name, flow
FROM categories
WHERE is_active = true
ORDER BY flow, slug;
