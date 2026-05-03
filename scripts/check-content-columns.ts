import pool from '../src/config/database';

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='content' 
      ORDER BY ordinal_position
    `);

    console.log('📋 Content table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    // Check specific columns we need
    const requiredColumns = ['owner_type', 'owner_id', 'task_id', 'cloud_url', 'file_size'];
    const existingColumns = result.rows.map(r => r.column_name);
    
    console.log('\n✅ Required columns check:');
    requiredColumns.forEach(col => {
      if (existingColumns.includes(col)) {
        console.log(`  ✓ ${col}`);
      } else {
        console.log(`  ✗ ${col} - MISSING`);
      }
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkColumns();
