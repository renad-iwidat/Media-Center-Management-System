-- إضافة أعمدة تتبع المستخدمين لربط نظام الأخبار بنظام الإدارة
-- Add user tracking columns to link news system with management system

-- إضافة أعمدة على جدول طابور التحرير
-- Add columns to editorial queue table
ALTER TABLE editorial_queue 
ADD COLUMN IF NOT EXISTS task_id BIGINT,
ADD COLUMN IF NOT EXISTS user_id BIGINT;

-- إضافة أعمدة على جدول المنشورات
-- Add columns to published items table
ALTER TABLE published_items 
ADD COLUMN IF NOT EXISTS task_id BIGINT,
ADD COLUMN IF NOT EXISTS approved_by BIGINT;

-- ملاحظة: جدول ai_usage_logs يحتوي أصلاً على user_identifier وسنستخدمه لحفظ رقم المستخدم
-- Note: ai_usage_logs table already has user_identifier and we'll use it to store user ID

-- إضافة فهارس لتحسين الأداء
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_editorial_queue_task_id ON editorial_queue(task_id);
CREATE INDEX IF NOT EXISTS idx_editorial_queue_user_id ON editorial_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_published_items_task_id ON published_items(task_id);
CREATE INDEX IF NOT EXISTS idx_published_items_approved_by ON published_items(approved_by);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_identifier ON ai_usage_logs(user_identifier);

-- إضافة تعليقات على الأعمدة الجديدة
-- Add comments to new columns
COMMENT ON COLUMN editorial_queue.task_id IS 'معرف المهمة من نظام الإدارة - Task ID from management system';
COMMENT ON COLUMN editorial_queue.user_id IS 'معرف المستخدم الذي عدل الخبر - User ID who edited the article';
COMMENT ON COLUMN published_items.task_id IS 'معرف المهمة من نظام الإدارة - Task ID from management system';
COMMENT ON COLUMN published_items.approved_by IS 'معرف المستخدم الذي وافق على النشر - User ID who approved publication';
COMMENT ON COLUMN ai_usage_logs.user_identifier IS 'معرف المستخدم الذي استخدم الذكاء الاصطناعي - User ID who used AI feature';