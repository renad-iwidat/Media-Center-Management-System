import pool from '../src/config/database';
async function check() {
  try {
    const result = await pool.query('SELECT * FROM task_statuses ORDER BY id');
    console.log('Task Statuses:', result.rows);
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
