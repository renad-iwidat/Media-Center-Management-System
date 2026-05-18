import pool from '../config/database';

async function check() {
  try {
    const cols = await pool.query(
      `SELECT column_name, data_type FROM information_schema.columns 
       WHERE table_name = 'content' ORDER BY ordinal_position`
    );
    console.log('📋 Content table columns:');
    console.log(JSON.stringify(cols.rows, null, 2));

    const types = await pool.query('SELECT * FROM content_types ORDER BY id');
    console.log('\n📋 Content Types:');
    console.log(JSON.stringify(types.rows, null, 2));

    const statuses = await pool.query('SELECT * FROM content_statuses ORDER BY id');
    console.log('\n📋 Content Statuses:');
    console.log(JSON.stringify(statuses.rows, null, 2));

    const sample = await pool.query('SELECT * FROM content LIMIT 3');
    console.log('\n📋 Sample content:');
    console.log(JSON.stringify(sample.rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

check();
