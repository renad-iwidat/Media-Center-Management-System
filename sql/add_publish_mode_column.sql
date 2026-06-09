-- إضافة عمود publish_mode لجدول auto_publish_targets
-- هذا العمود يحدد طريقة النشر: automated (سكيدولر) أو manual (المحرر فقط)

DO $$
BEGIN
  -- إضافة عمود publish_mode إذا لم يكن موجوداً
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'auto_publish_targets' AND column_name = 'publish_mode'
  ) THEN
    ALTER TABLE auto_publish_targets 
    ADD COLUMN publish_mode VARCHAR(20) DEFAULT 'automated';
    
    RAISE NOTICE 'تم إضافة عمود publish_mode بنجاح';
  ELSE
    RAISE NOTICE 'عمود publish_mode موجود بالفعل';
  END IF;
END $$;
