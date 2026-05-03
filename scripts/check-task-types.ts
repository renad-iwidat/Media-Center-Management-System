import pool from '../src/config/database';

async function checkTaskTypes() {
  try {
    console.log('📋 Checking task types in database...\n');

    const result = await pool.query('SELECT * FROM task_types ORDER BY id');
    
    if (result.rows.length === 0) {
      console.log('❌ No task types found');
    } else {
      console.log('✅ Found task types:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkTaskTypes();
