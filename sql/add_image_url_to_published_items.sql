-- إضافة عمود image_url لجدول published_items
ALTER TABLE published_items
ADD COLUMN IF NOT EXISTS image_url TEXT;
