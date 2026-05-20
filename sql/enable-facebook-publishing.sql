-- ═══════════════════════════════════════════════════════════════════════════
-- تفعيل النشر على فيسبوك
-- Enable Facebook Publishing
-- ═══════════════════════════════════════════════════════════════════════════
--
-- المتطلبات:
-- 1. تشغيل migration نظام النشر مسبقاً (يُنشئ جدول platform_configs)
--    npx ts-node src/utils/run-publishing-migration.ts
-- 2. وجود FACEBOOK_PAGE_ID و FACEBOOK_ACCESS_TOKEN في ملف .env
--    (الـ provider يستخدمهم كـ fallback إذا credentials فاضية)
-- 3. وجود سجل واحد على الأقل في جدول media_units
--
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. تأكدي إن جدول platform_configs موجود
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'platform_configs') THEN
    RAISE EXCEPTION 'جدول platform_configs غير موجود. شغّلي migration النشر أولاً';
  END IF;
END $$;

-- 2. اعرضي الـ media_units المتاحة (للاختيار)
SELECT id, name, is_active FROM media_units ORDER BY id;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. أدخلي إعداد فيسبوك (غيّري media_unit_id حسب الـ ID الصحيح من الاستعلام أعلاه)
-- ─────────────────────────────────────────────────────────────────────────────

-- الخيار (أ): credentials فاضية — الـ provider يستعمل قيم .env تلقائياً (موصى به)
INSERT INTO platform_configs (platform, name, credentials, is_enabled, media_unit_id)
VALUES (
  'facebook',
  'صفحة فيسبوك الرئيسية',
  '{}'::jsonb,
  true,
  1   -- ← غيّري هذا حسب media_unit الصحيح
)
ON CONFLICT (platform, media_unit_id, name) DO UPDATE
  SET is_enabled = EXCLUDED.is_enabled,
      updated_at = NOW();

-- الخيار (ب): تخزين الاعتمادات مباشرة في DB (لو بدك credentials مختلفة عن .env)
-- INSERT INTO platform_configs (platform, name, credentials, is_enabled, media_unit_id)
-- VALUES (
--   'facebook',
--   'صفحة فيسبوك الرئيسية',
--   '{"page_id":"961852527016202","access_token":"<TOKEN_HERE>"}'::jsonb,
--   true,
--   1
-- )
-- ON CONFLICT (platform, media_unit_id, name) DO UPDATE
--   SET credentials = EXCLUDED.credentials,
--       is_enabled = EXCLUDED.is_enabled,
--       updated_at = NOW();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. تحققي من الإدخال
-- ─────────────────────────────────────────────────────────────────────────────
SELECT id, platform, name, is_enabled, media_unit_id, created_at
FROM platform_configs
WHERE platform = 'facebook';

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. (اختياري) تفعيل/إيقاف لاحقاً
-- ─────────────────────────────────────────────────────────────────────────────
-- UPDATE platform_configs SET is_enabled = false WHERE platform = 'facebook' AND id = <ID>;
-- UPDATE platform_configs SET is_enabled = true  WHERE platform = 'facebook' AND id = <ID>;
