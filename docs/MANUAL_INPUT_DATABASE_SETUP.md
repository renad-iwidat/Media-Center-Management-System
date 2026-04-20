# Manual Input Database Setup - إعداد قاعدة البيانات للإدخال اليدوي

## ملخص التغييرات

تم إنشاء 3 أنواع مصادر منفصلة للإدخال اليدوي:
- **Manual Input - Text** (نص)
- **Manual Input - Audio** (صوت)
- **Manual Input - Video** (فيديو)

---

## الخطوة 1: حذف النوع القديم

### 1.1 حذف البيانات المرتبطة (إن وجدت)
```sql
DELETE FROM raw_data 
WHERE source_id = 13 OR source_type_id = 5;
```

### 1.2 حذف المصدر القديم من جدول sources
```sql
DELETE FROM sources 
WHERE id = 13 AND source_type_id = 5;
```
**النتيجة:** تم حذف `User Manual Input` (ID: 13)

### 1.3 حذف نوع المصدر القديم من source_types
```sql
DELETE FROM source_types 
WHERE id = 5 AND name = 'user_input';
```
**النتيجة:** تم حذف `user_input` (ID: 5)

---

## الخطوة 2: إضافة الأنواع الجديدة

### 2.1 إضافة أنواع المصادر في source_types
```sql
-- نوع مصدر النص
INSERT INTO source_types (name) 
VALUES ('user_input_text');

-- نوع مصدر الصوت
INSERT INTO source_types (name) 
VALUES ('user_input_audio');

-- نوع مصدر الفيديو
INSERT INTO source_types (name) 
VALUES ('user_input_video');
```

**النتيجة:**
| id | name              |
|----|-------------------|
| 6  | user_input_text   |
| 7  | user_input_audio  |
| 8  | user_input_video  |

---

## الخطوة 3: إضافة المصادر

### 3.1 إضافة مصدر النص
```sql
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES (6, NULL, 'Manual Input - Text', true, NOW());
```
**النتيجة:** تم إنشاء مصدر `Manual Input - Text` (ID: 14)

### 3.2 إضافة مصدر الصوت
```sql
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES (7, NULL, 'Manual Input - Audio', true, NOW());
```
**النتيجة:** تم إنشاء مصدر `Manual Input - Audio` (ID: 15)

### 3.3 إضافة مصدر الفيديو
```sql
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES (8, NULL, 'Manual Input - Video', true, NOW());
```
**النتيجة:** تم إنشاء مصدر `Manual Input - Video` (ID: 16)

---

## النتيجة النهائية

### جدول source_types
```sql
SELECT id, name 
FROM source_types 
WHERE name LIKE '%user_input%'
ORDER BY id;
```

| id | name              |
|----|-------------------|
| 6  | user_input_text   |
| 7  | user_input_audio  |
| 8  | user_input_video  |

---

### جدول sources
```sql
SELECT s.id, s.name, st.name as source_type_name, s.is_active
FROM sources s
JOIN source_types st ON s.source_type_id = st.id
WHERE st.name IN ('user_input_text', 'user_input_audio', 'user_input_video')
ORDER BY s.id;
```

| id | name                  | source_type_name  | is_active |
|----|-----------------------|-------------------|-----------|
| 14 | Manual Input - Text   | user_input_text   | true      |
| 15 | Manual Input - Audio  | user_input_audio  | true      |
| 16 | Manual Input - Video  | user_input_video  | true      |

---

## الاستخدام

### للنص:
```sql
INSERT INTO raw_data (
  source_id, 
  source_type_id, 
  category_id, 
  title, 
  content, 
  fetch_status, 
  created_by
)
VALUES (
  14,              -- Manual Input - Text
  6,               -- user_input_text
  1,               -- category_id
  'عنوان الخبر',
  'محتوى الخبر',
  'fetched',
  1                -- user_id
);
```

### للصوت:
```sql
INSERT INTO raw_data (
  source_id, 
  source_type_id, 
  category_id, 
  title, 
  content,
  image_url,       -- يمكن استخدامه لحفظ رابط S3
  fetch_status, 
  created_by
)
VALUES (
  15,              -- Manual Input - Audio
  7,               -- user_input_audio
  1,               -- category_id
  'صوت من المراسل',
  NULL,            -- سيتم ملؤه بعد التحويل
  's3://bucket/audio/file.mp3',
  'pending',       -- بانتظار التحويل
  1                -- user_id
);
```

### للفيديو:
```sql
INSERT INTO raw_data (
  source_id, 
  source_type_id, 
  category_id, 
  title, 
  content,
  image_url,       -- يمكن استخدامه لحفظ رابط S3
  fetch_status, 
  created_by
)
VALUES (
  16,              -- Manual Input - Video
  8,               -- user_input_video
  1,               -- category_id
  'فيديو من المراسل',
  NULL,            -- سيتم ملؤه بعد التحويل
  's3://bucket/video/file.mp4',
  'pending',       -- بانتظار التحويل
  1                -- user_id
);
```

---

## التحقق من الإعداد

### التحقق من أنواع المصادر:
```sql
SELECT * FROM source_types 
WHERE name LIKE '%user_input%'
ORDER BY id;
```

### التحقق من المصادر:
```sql
SELECT s.*, st.name as source_type_name
FROM sources s
JOIN source_types st ON s.source_type_id = st.id
WHERE st.name LIKE '%user_input%'
ORDER BY s.id;
```

### عد السجلات لكل نوع:
```sql
SELECT 
  s.name as source_name,
  COUNT(rd.id) as count
FROM sources s
LEFT JOIN raw_data rd ON s.id = rd.source_id
WHERE s.id IN (14, 15, 16)
GROUP BY s.id, s.name
ORDER BY s.id;
```

---

## ملاحظات مهمة

1. **source_id** يحدد نوع الإدخال:
   - 14 = نص
   - 15 = صوت
   - 16 = فيديو

2. **fetch_status** للصوت والفيديو:
   - `'pending'` - بانتظار التحويل
   - `'processing'` - جاري التحويل
   - `'fetched'` - تم التحويل وجاهز للفلو

3. **image_url** يمكن استخدامه مؤقتاً لحفظ رابط S3 للصوت/فيديو

4. **content** يبقى NULL للصوت/فيديو حتى يتم التحويل لنص

---

## السكربتات المستخدمة

- **الحذف:** `src/utils/manual-input/cleanup-old-user-input.ts`
- **الإضافة:** `src/utils/manual-input/setup-manual-input-sources.ts`
- **التحليل:** `src/utils/manual-input/analyze-schema.ts`
