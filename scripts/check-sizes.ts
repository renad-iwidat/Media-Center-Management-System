import pool from '../src/config/database';
async function c() {
  const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'task_attachments'`);
  console.log('task_attachments columns:', cols.rows.map((x:any)=>x.column_name));

  const r2 = await pool.query(`SELECT COUNT(*) as cnt, SUM(file_size) as total FROM admin_proc_task_attachments WHERE file_size > 0`);
  console.log('admin_attachments with size:', r2.rows[0]);

  const r4 = await pool.query(`SELECT id, file_size FROM admin_proc_task_attachments`);
  console.log('admin file_sizes:', r4.rows);
  
  process.exit(0);
}
c();
