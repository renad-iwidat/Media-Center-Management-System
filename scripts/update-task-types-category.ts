import pool from '../src/config/database';

async function updateTaskTypesCategory() {
  try {
    console.log('🔄 Updating task types with reporting category...\n');

    // تحقق من وجود عمود category
    const columnCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'task_types' AND column_name = 'category'
      )`
    );

    if (!columnCheck.rows[0].exists) {
      console.log('📝 Adding category column to task_types table...');
      await pool.query(`
        ALTER TABLE task_types 
        ADD COLUMN category VARCHAR(50) DEFAULT 'other'
      `);
      console.log('✅ Category column added');
    }

    // الأنواع المتعلقة بـ الأخبار
    const reportingTypes = ['كتابة', 'تحرير', 'نشر'];

    console.log('\n📝 Updating task types...');
    
    for (const typeName of reportingTypes) {
      const result = await pool.query(
        `UPDATE task_types 
         SET category = 'reporting'
         WHERE name = $1
         RETURNING *`,
        [typeName]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Updated: ${typeName} → reporting`);
      } else {
        console.log(`⚠️  Not found: ${typeName}`);
      }
    }

    // عرض جميع الأنواع
    console.log('\n📊 Current task types:');
    const allTypes = await pool.query('SELECT * FROM task_types ORDER BY id');
    console.table(allTypes.rows);

    // عرض الأنواع الاخبارية فقط
    console.log('\n📰 Reporting task types:');
    const reportingTypesResult = await pool.query(
      "SELECT * FROM task_types WHERE category = 'reporting' ORDER BY id"
    );
    console.table(reportingTypesResult.rows);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateTaskTypesCategory();
