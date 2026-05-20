import pool from '../src/config/database';

async function check() {
  const r = await pool.query(
    `SELECT id, title, hr_type, category_id, employee_id FROM admin_proc_orders WHERE category_id = 4 OR hr_type IS NOT NULL`
  );
  console.log('Leave requests:', r.rows.length);
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check();
