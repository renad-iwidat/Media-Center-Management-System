-- ============================================================================
-- 1. إضافة عمود is_modifying
-- ============================================================================
-- true = السياسة بتعدّل النص (replace, rewrite, cleanup, ...)
-- false = السياسة بتفحص بس (classify, validate, ...)

ALTER TABLE editorial_policies
ADD COLUMN IF NOT EXISTS is_modifying BOOLEAN NOT NULL DEFAULT TRUE;

-- تحديث السياسات الموجودة حالياً
UPDATE editorial_policies SET is_modifying = TRUE
WHERE task_type IN ('replace', 'remove', 'rewrite', 'cleanup', 'formatting', 'balance', 'disclaimer');

UPDATE editorial_policies SET is_modifying = FALSE
WHERE task_type IN ('content_validation', 'classify', 'terminology_check', 'validate');

-- ============================================================================
-- 2. توحيد output_schema حسب النوع
-- ============================================================================

-- Schema موحد لسياسات التعديل
UPDATE editorial_policies
SET output_schema = '{"modified_text": "string", "changes": "array", "total_changes": "number", "notes": "string"}'::jsonb
WHERE is_modifying = TRUE;

-- Schema موحد لسياسات الفحص
UPDATE editorial_policies
SET output_schema = '{"status": "string", "issues": "array", "summary": "string", "details": "object"}'::jsonb
WHERE is_modifying = FALSE;
