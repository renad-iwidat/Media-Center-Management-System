import pool from '../src/config/database';

async function checkStatuses() {
  const r = await pool.query('SELECT id, name FROM task_statuses ORDER BY id');
  console.log('Task Statuses:');
  r.rows.forEach(row => {
    console.log(`  ${row.id}: ${row.name}`);
  });
  process.exit(0);
}

checkStatuses();
