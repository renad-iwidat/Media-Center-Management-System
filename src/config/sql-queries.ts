/**
 * SQL Queries
 * استعلامات SQL للعمليات الأساسية
 */

/**
 * إنشاء أنواع المصادر
 */
export const INSERT_SOURCE_TYPES = `
INSERT INTO source_types (name) 
VALUES 
  ('RSS'),
  ('API'),
  ('Telegram'),
  ('Web Scraper')
ON CONFLICT (name) DO NOTHING
RETURNING *;
`;

/**
 * إدراج مصدر جديد
 * Parameters: source_type_id, url, name, is_active
 */
export const INSERT_SOURCE = `
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES ($1, $2, $3, $4, NOW())
RETURNING *;
`;

/**
 * إدراج مصادر متعددة
 * مثال:
 * INSERT INTO sources (source_type_id, url, name, is_active, created_at)
 * VALUES 
 *   (1, 'https://example.com/rss', 'مصدر 1', true, NOW()),
 *   (1, 'https://example2.com/rss', 'مصدر 2', true, NOW()),
 *   (2, 'https://api.example.com', 'API مصدر', true, NOW());
 */
export const INSERT_MULTIPLE_SOURCES = `
INSERT INTO sources (source_type_id, url, name, is_active, created_at)
VALUES 
  ($1, $2, $3, $4, NOW()),
  ($5, $6, $7, $8, NOW()),
  ($9, $10, $11, $12, NOW())
RETURNING *;
`;

/**
 * إدراج بيانات خام جديدة
 * Parameters: source_id, source_type_id, category_id, url, title, content, image_url, tags[], fetch_status
 */
export const INSERT_RAW_DATA = `
INSERT INTO raw_data (source_id, source_type_id, category_id, url, title, content, image_url, tags, fetch_status, fetched_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
RETURNING *;
`;

/**
 * إدراج تصنيف جديد
 * Parameters: name, slug, flow, is_active
 */
export const INSERT_CATEGORY = `
INSERT INTO categories (name, slug, flow, is_active)
VALUES ($1, $2, $3, $4)
RETURNING *;
`;

/**
 * إدراج سياسة تحرير جديدة
 * Parameters: media_unit_id, name, description, rules, is_active
 */
export const INSERT_EDITORIAL_POLICY = `
INSERT INTO editorial_policies (media_unit_id, name, description, rules, is_active, created_at)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING *;
`;

/**
 * إدراج عنصر في طابور التحرير
 * Parameters: media_unit_id, raw_data_id, policy_id, status
 */
export const INSERT_EDITORIAL_QUEUE = `
INSERT INTO editorial_queue (media_unit_id, raw_data_id, policy_id, status, created_at, updated_at)
VALUES ($1, $2, $3, $4, NOW(), NOW())
RETURNING *;
`;

/**
 * إدراج محتوى منشور جديد
 * Parameters: media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags[], is_active
 */
export const INSERT_PUBLISHED_ITEM = `
INSERT INTO published_items (media_unit_id, raw_data_id, queue_id, content_type_id, title, content, tags, is_active, published_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
RETURNING *;
`;

/**
 * استعلامات SELECT
 */

export const SELECT_ALL_SOURCE_TYPES = `
SELECT * FROM source_types ORDER BY id;
`;

export const SELECT_ALL_SOURCES = `
SELECT s.*, st.name as source_type_name 
FROM sources s 
LEFT JOIN source_types st ON s.source_type_id = st.id 
ORDER BY s.id;
`;

export const SELECT_ACTIVE_SOURCES = `
SELECT * FROM sources WHERE is_active = true ORDER BY id;
`;

export const SELECT_ALL_RAW_DATA = `
SELECT * FROM raw_data ORDER BY fetched_at DESC;
`;

export const SELECT_ALL_CATEGORIES = `
SELECT * FROM categories WHERE is_active = true ORDER BY name;
`;

export const SELECT_EDITORIAL_QUEUE = `
SELECT * FROM editorial_queue ORDER BY created_at DESC;
`;

export const SELECT_PUBLISHED_ITEMS = `
SELECT * FROM published_items WHERE is_active = true ORDER BY published_at DESC;
`;

/**
 * استعلامات UPDATE
 */

export const UPDATE_SOURCE = `
UPDATE sources 
SET name = $1, is_active = $2, url = $3
WHERE id = $4
RETURNING *;
`;

export const UPDATE_RAW_DATA_STATUS = `
UPDATE raw_data 
SET fetch_status = $1
WHERE id = $2
RETURNING *;
`;

export const UPDATE_EDITORIAL_QUEUE_STATUS = `
UPDATE editorial_queue 
SET status = $1, editor_notes = $2, updated_at = NOW()
WHERE id = $3
RETURNING *;
`;

/**
 * استعلامات DELETE
 */

export const DELETE_SOURCE = `
DELETE FROM sources WHERE id = $1 RETURNING *;
`;

export const DELETE_RAW_DATA = `
DELETE FROM raw_data WHERE id = $1 RETURNING *;
`;
