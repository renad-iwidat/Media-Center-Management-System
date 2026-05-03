import pool from '../src/config/database';

async function check() {
  try {
    console.log('Checking task_attachments table structure...\n');

    // Get table structure
    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'task_attachments'
      ORDER BY ordinal_position
    `);

    if (result.rows.length === 0) {
      console.log('❌ task_attachments table does not exist');
    } else {
      console.log('✅ task_attachments table structure:');
      console.log('');
      result.rows.forEach((col: any) => {
        console.log(`  ${col.column_name}`);
        console.log(`    Type: ${col.data_type}`);
        console.log(`    Nullable: ${col.is_nullable}`);
        console.log(`    Default: ${col.column_default || 'none'}`);
        console.log('');
      });
    }

    // Get sample data
    const sampleResult = await pool.query(`
      SELECT * FROM task_attachments LIMIT 5
    `);

    console.log(`\nSample data (${sampleResult.rows.length} rows):`);
    if (sampleResult.rows.length > 0) {
      console.log(JSON.stringify(sampleResult.rows[0], null, 2));
    } else {
      console.log('No data in table');
    }
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
