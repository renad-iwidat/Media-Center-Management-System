import pool from '../src/config/database';
async function c() {
  const r = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'content' ORDER BY ordinal_position`);
  console.log(r.rows.map((x:any)=>x.column_name).join(', '));
  
  const desks = await pool.query(`SELECT d.id, d.name, COUNT(c.id) as content_count FROM desks d LEFT JOIN tasks t ON t.order_id IN (SELECT id FROM orders WHERE desk_id = d.id) LEFT JOIN content c ON c.task_id = t.id GROUP BY d.id, d.name HAVING COUNT(c.id) > 0 ORDER BY content_count DESC`);
  console.log('\nContent by desk:');
  console.log(JSON.stringify(desks.rows, null, 2));
  
  process.exit(0);
}
c();
