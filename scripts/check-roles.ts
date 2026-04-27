import pool from '../src/config/database';
async function check() {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY id');
    console.log('Roles:', result.rows);
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
