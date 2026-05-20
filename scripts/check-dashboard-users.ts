import pool from '../src/config/database';

async function check() {
  const r = await pool.query(
    `SELECT id, name FROM users WHERE name LIKE '%نغم%' OR name LIKE '%لمى%' OR name LIKE '%جوهري%' OR name LIKE '%كيلاني%'`
  );
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}

check();
