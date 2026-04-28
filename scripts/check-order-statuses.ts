import pool from '../src/config/database';
async function check() {
  try {
    const r1 = await pool.query('SELECT * FROM order_statuses ORDER BY id');
    console.log('Order Statuses:', r1.rows);
    const r2 = await pool.query('SELECT * FROM task_types ORDER BY id');
    console.log('Task Types:', r2.rows);
    const r3 = await pool.query('SELECT * FROM priority_levels ORDER BY id');
    console.log('Priority Levels:', r3.rows);
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
