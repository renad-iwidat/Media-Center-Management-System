-- ============================================================
-- تحديث وصف إعدادات النظام
-- لتتناسب مع السحب من API بدلاً من RSS
-- ============================================================

UPDATE system_settings SET description = 'تشغيل/إيقاف السحب التلقائي من NewsDesk API' WHERE key = 'scheduler_enabled';
UPDATE system_settings SET description = 'تشغيل/إيقاف التصنيف الآلي للأخبار الجديدة' WHERE key = 'classifier_enabled';
UPDATE system_settings SET description = 'تشغيل/إيقاف فلو توجيه الأخبار للمسارات' WHERE key = 'flow_enabled';
UPDATE system_settings SET description = 'الفاصل الزمني بين كل دورة سحب بالدقائق' WHERE key = 'scheduler_interval_minutes';
UPDATE system_settings SET description = 'عدد الأخبار المسحوبة في كل دورة (حجم الصفحة من الـ API)' WHERE key = 'articles_per_source';
