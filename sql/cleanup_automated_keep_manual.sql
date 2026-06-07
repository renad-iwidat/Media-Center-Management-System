-- =============================================================================
-- Cleanup: remove ALL automated / news-ingestion data
--          while keeping the MANUAL-INPUT workflow fully operational.
--
-- Manual-input source types (MUST be preserved, never deleted/detached):
--   6 = user_input_text
--   7 = user_input_audio
--   8 = user_input_video
--
-- "Manual set" anchor used everywhere below:  source_type_id NOT IN (6,7,8)
--   => every statement deletes ONLY non-manual rows. Anything tied to 6/7/8
--      (rows, FKs, mappings, uploaded files, categories, media units) is left
--      completely untouched.
--
-- Verified against the live schema before writing:
--   * raw_data has 5 MANUAL rows (type 6) referencing categories 1,2,9,11
--     and media_units 1,2,7 -> these are preserved by the NOT IN (6,7,8) filter.
--   * editorial_queue has 8 rows and published_items has 1 row derived from
--     those manual raw_data rows -> preserved by the subquery filter below.
--   * categories and media_units are intentionally NOT deleted: manual rows
--     depend on them and ~15 tables reference media_units (ON DELETE NO ACTION).
--     Deleting them would break the manual workflow and/or violate FKs.
--
-- Almost every FK here is ON DELETE NO ACTION, so the delete ORDER matters:
--   children (rows that point AT a table) are removed before that table.
--
-- Run inside a transaction. Review the verification block, then COMMIT.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- STEP 1 — content_source
-- Why: content_source.published_item_id -> published_items (ON DELETE CASCADE).
--      We remove the mapping rows that belong to AUTOMATED published_items now,
--      explicitly, so the cleanup is controlled rather than relying on cascade.
-- Manual safety: only mappings whose published_item comes from non-manual
--      raw_data are removed; the manual published_item (raw_data type 6) stays.
-- -----------------------------------------------------------------------------
DELETE FROM content_source
WHERE published_item_id IN (
  SELECT pi.id
  FROM published_items pi
  JOIN raw_data rd ON rd.id = pi.raw_data_id
  WHERE rd.source_type_id NOT IN (6, 7, 8)
);

-- -----------------------------------------------------------------------------
-- STEP 2 — auto_publish_log
-- Why: auto_publish_log.raw_data_id -> raw_data (ON DELETE NO ACTION).
--      Must clear log rows pointing at automated raw_data BEFORE deleting it.
-- Manual safety: only logs tied to non-manual raw_data are removed.
-- -----------------------------------------------------------------------------
DELETE FROM auto_publish_log
WHERE raw_data_id IN (
  SELECT id FROM raw_data WHERE source_type_id NOT IN (6, 7, 8)
);

-- -----------------------------------------------------------------------------
-- STEP 3 — published_items
-- Why: published_items.raw_data_id -> raw_data (NO ACTION) and
--      published_items.queue_id  -> editorial_queue (NO ACTION).
--      Remove published items built from automated raw_data before we touch
--      raw_data / editorial_queue.
-- Manual safety: the single published_item derived from manual raw_data
--      (raw_data type 6) is preserved by the NOT IN (6,7,8) filter.
-- -----------------------------------------------------------------------------
DELETE FROM published_items
WHERE raw_data_id IN (
  SELECT id FROM raw_data WHERE source_type_id NOT IN (6, 7, 8)
);

-- -----------------------------------------------------------------------------
-- STEP 4 — editorial_queue
-- Why: editorial_queue.raw_data_id -> raw_data (NO ACTION). Clear queue rows
--      built from automated raw_data. (Automated published_items that pointed
--      here were already removed in STEP 3.)
-- Manual safety: the 8 queue rows derived from manual raw_data are preserved.
-- -----------------------------------------------------------------------------
DELETE FROM editorial_queue
WHERE raw_data_id IN (
  SELECT id FROM raw_data WHERE source_type_id NOT IN (6, 7, 8)
);

-- -----------------------------------------------------------------------------
-- STEP 5 — raw_data
-- Why: the core ingestion table. Now that every child (auto_publish_log,
--      published_items, editorial_queue) no longer references automated rows,
--      we can delete the automated rows themselves.
-- Manual safety: source_type_id NOT IN (6,7,8) keeps all 5 manual rows.
-- Note: raw_data.uploaded_file_id -> uploaded_files is ON DELETE SET NULL,
--      so deleting automated rows never deletes any uploaded file.
-- -----------------------------------------------------------------------------
DELETE FROM raw_data
WHERE source_type_id NOT IN (6, 7, 8);

-- -----------------------------------------------------------------------------
-- STEP 6 — media_unit_sources (source-mapping table)
-- Why: removes the automated source <-> media-unit mappings.
--      media_unit_sources.source_id -> sources (ON DELETE CASCADE), but we
--      filter explicitly so manual source mappings would survive (there are
--      none today, but this keeps the statement correct and future-proof).
-- Manual safety: mappings for manual sources (14,15,16) are excluded.
-- -----------------------------------------------------------------------------
DELETE FROM media_unit_sources
WHERE source_id IN (
  SELECT id FROM sources WHERE source_type_id NOT IN (6, 7, 8)
);

-- -----------------------------------------------------------------------------
-- STEP 7 — sources
-- Why: remove automated sources. Safe now because:
--      - automated raw_data (NO ACTION) already deleted (STEP 5)
--      - automated media_unit_sources already deleted (STEP 6)
--      - uploaded_files.source_id only references manual sources (14,15,16)
-- Manual safety: NOT IN (6,7,8) keeps manual sources 14,15,16 intact.
-- -----------------------------------------------------------------------------
DELETE FROM sources
WHERE source_type_id NOT IN (6, 7, 8);

-- -----------------------------------------------------------------------------
-- STEP 8 — source_types
-- Why: remove the non-manual type definitions (1=RSS, 2=API, 3=Telegram,
--      4=Web Scraper, 5=Manual-legacy). Safe now because every table that
--      references source_types (raw_data, sources, uploaded_files) only holds
--      rows of types 6/7/8 after the steps above.
-- Manual safety: 6,7,8 are explicitly excluded and remain untouched.
-- -----------------------------------------------------------------------------
DELETE FROM source_types
WHERE id NOT IN (6, 7, 8);

-- =============================================================================
-- VERIFICATION  (review BEFORE committing)
-- Expected:
--   * automated counts = 0
--   * manual counts unchanged:
--       raw_data type6 = 5, sources types 6/7/8 = 1 each,
--       source_types remaining = exactly 6,7,8,
--       manual-derived editorial_queue = 8, published_items = 1,
--       categories and media_units fully intact.
-- =============================================================================
SELECT 'raw_data_total'              AS metric, COUNT(*) AS value FROM raw_data
UNION ALL SELECT 'raw_data_manual(6,7,8)',      COUNT(*) FROM raw_data WHERE source_type_id IN (6,7,8)
UNION ALL SELECT 'raw_data_automated_LEFT',     COUNT(*) FROM raw_data WHERE source_type_id NOT IN (6,7,8)
UNION ALL SELECT 'sources_total',               COUNT(*) FROM sources
UNION ALL SELECT 'sources_manual(6,7,8)',       COUNT(*) FROM sources WHERE source_type_id IN (6,7,8)
UNION ALL SELECT 'source_types_remaining',      COUNT(*) FROM source_types
UNION ALL SELECT 'editorial_queue_total',       COUNT(*) FROM editorial_queue
UNION ALL SELECT 'published_items_total',       COUNT(*) FROM published_items
UNION ALL SELECT 'media_unit_sources_total',    COUNT(*) FROM media_unit_sources
UNION ALL SELECT 'categories_PRESERVED',        COUNT(*) FROM categories
UNION ALL SELECT 'media_units_PRESERVED',       COUNT(*) FROM media_units
UNION ALL SELECT 'uploaded_files_PRESERVED',    COUNT(*) FROM uploaded_files;

-- If the numbers look correct:
--   COMMIT;
-- If anything is off:
--   ROLLBACK;

-- (left intentionally open — review the SELECT output, then COMMIT or ROLLBACK)
