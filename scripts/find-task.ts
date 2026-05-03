import pool from '../src/config/database';

async function findTask() {
  const r = await pool.query(
    `SELECT t.id, t.title, t.status_id, ts.name as status_name
     FROM tasks t
     LEFT JOIN task_statuses ts ON t.status_id = ts.id
     WHERE t.title ILIKE '%تصوير%' OR t.title ILIKE '%تست%'
     ORDER BY t.id DESC
     LIMIT 10`
  );
  
  console.log('Tasks found:');
  r.rows.forEach(row => {
    console.log(`  ID: ${row.id}, Title: ${row.title}, Status: ${row.status_name}`);
  });
  
  process.exit(0);
}

findTask();
