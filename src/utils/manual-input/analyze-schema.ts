import pool from '../../config/database';

/**
 * تحليل السكيما الكاملة لفهم البنية
 */

async function analyzeSchema() {
  console.log('🔍 تحليل السكيما الكاملة...\n');

  try {
    // 1. جداول النظام الرئيسية
    console.log('📊 الجداول الرئيسية:\n');
    
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('الجداول:', tables.rows.map(r => r.table_name).join(', '));

    // 2. جدول source_types
    console.log('\n\n📋 جدول source_types:');
    const sourceTypes = await pool.query('SELECT * FROM source_types ORDER BY id');
    console.log(sourceTypes.rows);

    // 3. جدول sources
    console.log('\n\n📋 جدول sources:');
    const sources = await pool.query(`
      SELECT s.*, st.name as source_type_name 
      FROM sources s 
      JOIN source_types st ON s.source_type_id = st.id 
      ORDER BY s.id
    `);
    console.log(sources.rows);

    // 4. هيكل جدول raw_data
    console.log('\n\n📋 هيكل جدول raw_data:');
    const rawDataColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'raw_data'
      ORDER BY ordinal_position
    `);
    console.log(rawDataColumns.rows);

    // 5. جدول content_types (إذا موجود)
    console.log('\n\n📋 جدول content_types (إذا موجود):');
    try {
      const contentTypes = await pool.query('SELECT * FROM content_types ORDER BY id');
      console.log(contentTypes.rows);
    } catch (e) {
      console.log('❌ الجدول غير موجود');
    }

    // 6. جدول media_units
    console.log('\n\n📋 جدول media_units:');
    const mediaUnits = await pool.query('SELECT * FROM media_units ORDER BY id');
    console.log(mediaUnits.rows);

    // 7. جدول categories
    console.log('\n\n📋 جدول categories:');
    const categories = await pool.query('SELECT * FROM categories ORDER BY id');
    console.log(categories.rows);

    // 8. هيكل جدول published_items
    console.log('\n\n📋 هيكل جدول published_items:');
    const publishedColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'published_items'
      ORDER BY ordinal_position
    `);
    console.log(publishedColumns.rows);

    console.log('\n✅ انتهى التحليل!');
    
  } catch (error) {
    console.error('❌ خطأ أثناء التحليل:', error);
  } finally {
    await pool.end();
  }
}

analyzeSchema();
