# استعلامات قاعدة البيانات للصور
# Database Queries for Images

## 📋 Queries جاهزة للاستخدام

### 1. عرض جميع الصور المرفوعة
```sql
SELECT 
  uf.id,
  uf.original_filename,
  ROUND(uf.file_size::numeric / 1024 / 1024, 2) as size_mb,
  uf.mime_type,
  uf.s3_url,
  u.name as uploaded_by_name,
  m.name as media_unit_name,
  uf.uploaded_at
FROM uploaded_files uf
LEFT JOIN users u ON uf.uploaded_by = u.id
LEFT JOIN media_units m ON uf.media_unit_id = m.id
WHERE uf.file_type = 'image'
ORDER BY uf.uploaded_at DESC;
```

### 2. عرض آخر 10 صور مرفوعة
```sql
SELECT 
  id,
  original_filename,
  ROUND(file_size::numeric / 1024 / 1024, 2) as size_mb,
  s3_url,
  uploaded_at
FROM uploaded_files
WHERE file_type = 'image'
ORDER BY uploaded_at DESC
LIMIT 10;
```

### 3. عرض الأخبار التي تحتوي على صور
```sql
SELECT 
  r.id,
  r.title,
  r.image_url,
  u.name as correspondent_name,
  m.name as media_unit_name,
  r.fetched_at
FROM raw_data r
LEFT JOIN users u ON r.created_by = u.id
LEFT JOIN media_units m ON r.media_unit_id = m.id
WHERE r.image_url IS NOT NULL
  AND r.image_url LIKE '%manual-input-image%'
ORDER BY r.fetched_at DESC;
```

### 4. إحصائيات الصور حسب المراسل
```sql
SELECT 
  u.name as correspondent_name,
  COUNT(*) as total_images,
  SUM(uf.file_size) as total_size_bytes,
  ROUND(SUM(uf.file_size)::numeric / 1024 / 1024, 2) as total_size_mb,
  MIN(uf.uploaded_at) as first_upload,
  MAX(uf.uploaded_at) as last_upload
FROM uploaded_files uf
JOIN users u ON uf.uploaded_by = u.id
WHERE uf.file_type = 'image'
GROUP BY u.id, u.name
ORDER BY total_images DESC;
```

### 5. إحصائيات الصور حسب الوحدة الإعلامية
```sql
SELECT 
  m.name as media_unit_name,
  COUNT(*) as total_images,
  ROUND(SUM(uf.file_size)::numeric / 1024 / 1024, 2) as total_size_mb
FROM uploaded_files uf
JOIN media_units m ON uf.media_unit_id = m.id
WHERE uf.file_type = 'image'
GROUP BY m.id, m.name
ORDER BY total_images DESC;
```

### 6. عرض جميع أنواع الملفات (صوت، فيديو، صور)
```sql
SELECT 
  file_type,
  COUNT(*) as count,
  ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_size_mb,
  MIN(uploaded_at) as first_upload,
  MAX(uploaded_at) as last_upload
FROM uploaded_files
GROUP BY file_type
ORDER BY file_type;
```

### 7. البحث عن صورة معينة بالاسم
```sql
SELECT 
  id,
  original_filename,
  s3_url,
  uploaded_at
FROM uploaded_files
WHERE file_type = 'image'
  AND original_filename ILIKE '%search_term%'
ORDER BY uploaded_at DESC;
```

### 8. عرض الصور المرفوعة اليوم
```sql
SELECT 
  uf.id,
  uf.original_filename,
  u.name as uploaded_by,
  uf.uploaded_at
FROM uploaded_files uf
LEFT JOIN users u ON uf.uploaded_by = u.id
WHERE uf.file_type = 'image'
  AND DATE(uf.uploaded_at) = CURRENT_DATE
ORDER BY uf.uploaded_at DESC;
```

### 9. عرض الصور الكبيرة (أكبر من 5 MB)
```sql
SELECT 
  id,
  original_filename,
  ROUND(file_size::numeric / 1024 / 1024, 2) as size_mb,
  s3_url
FROM uploaded_files
WHERE file_type = 'image'
  AND file_size > 5 * 1024 * 1024
ORDER BY file_size DESC;
```

### 10. عرض تفاصيل صورة معينة بالـ ID
```sql
SELECT 
  uf.*,
  u.name as uploaded_by_name,
  u.email as uploaded_by_email,
  m.name as media_unit_name,
  s.name as source_name,
  st.name as source_type_name
FROM uploaded_files uf
LEFT JOIN users u ON uf.uploaded_by = u.id
LEFT JOIN media_units m ON uf.media_unit_id = m.id
LEFT JOIN sources s ON uf.source_id = s.id
LEFT JOIN source_types st ON uf.source_type_id = st.id
WHERE uf.id = 123; -- غير الرقم للـ ID اللي بدك إياه
```

---

## 🔧 Queries للصيانة

### حذف صورة معينة
```sql
-- احذف من uploaded_files
DELETE FROM uploaded_files
WHERE id = 123 AND file_type = 'image';

-- ملاحظة: لازم تحذف الملف من S3 يدوياً
```

### تحديث معلومات صورة
```sql
UPDATE uploaded_files
SET 
  processing_status = 'completed',
  processed_at = NOW()
WHERE id = 123 AND file_type = 'image';
```

### البحث عن صور بدون مراسل
```sql
SELECT *
FROM uploaded_files
WHERE file_type = 'image'
  AND uploaded_by IS NULL;
```

### البحث عن صور بدون وحدة إعلامية
```sql
SELECT *
FROM uploaded_files
WHERE file_type = 'image'
  AND media_unit_id IS NULL;
```

---

## 📊 Queries للتقارير

### تقرير شهري للصور
```sql
SELECT 
  DATE_TRUNC('month', uploaded_at) as month,
  COUNT(*) as total_images,
  ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_size_mb
FROM uploaded_files
WHERE file_type = 'image'
GROUP BY DATE_TRUNC('month', uploaded_at)
ORDER BY month DESC;
```

### تقرير يومي للصور
```sql
SELECT 
  DATE(uploaded_at) as date,
  COUNT(*) as total_images,
  ROUND(SUM(file_size)::numeric / 1024 / 1024, 2) as total_size_mb
FROM uploaded_files
WHERE file_type = 'image'
  AND uploaded_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(uploaded_at)
ORDER BY date DESC;
```

### أكثر المراسلين رفعاً للصور
```sql
SELECT 
  u.name,
  COUNT(*) as total_images,
  ROUND(AVG(uf.file_size)::numeric / 1024 / 1024, 2) as avg_size_mb
FROM uploaded_files uf
JOIN users u ON uf.uploaded_by = u.id
WHERE uf.file_type = 'image'
GROUP BY u.id, u.name
ORDER BY total_images DESC
LIMIT 10;
```

---

## 💡 نصائح

1. **للبحث السريع:** استخدم indexes الموجودة على `file_type` و `uploaded_by`
2. **للتقارير:** استخدم `DATE_TRUNC` للتجميع حسب الفترة الزمنية
3. **للصيانة:** احذف الصور القديمة من S3 أولاً قبل حذفها من قاعدة البيانات
4. **للأداء:** استخدم `LIMIT` عند عرض قوائم طويلة

---

## 🔍 كيف تستخدمي هاي Queries:

### في pgAdmin أو أي SQL Client:
1. افتحي الاتصال بقاعدة البيانات
2. انسخي Query من الأعلى
3. شغليها
4. شوفي النتائج

### من Terminal:
```bash
psql -d your_database -c "SELECT * FROM uploaded_files WHERE file_type = 'image';"
```

### من الكود (TypeScript):
```typescript
const result = await pool.query(`
  SELECT * FROM uploaded_files 
  WHERE file_type = 'image' 
  ORDER BY uploaded_at DESC 
  LIMIT 10
`);
console.log(result.rows);
```
