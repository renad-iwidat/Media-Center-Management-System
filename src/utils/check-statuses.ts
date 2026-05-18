import pool from '../config/database';
async function check() {
  const r = await pool.query('SELECT * FROM task_statuses ORDER BY id');
  console.log(JSON.stringify(r.rows, null, 2));
  await pool.end();
}
check();
