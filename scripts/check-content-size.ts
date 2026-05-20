import pool from '../src/config/database';
async function c() {
  const r = await pool.query(`SELECT COUNT(*) as total, COUNT(file_size) as with_size, SUM(COALESCE(file_size, 0)) as total_size FROM content`);
  console.log('Content stats:', r.rows[0]);
  
  const sample = await pool.query(`SELECT id, title, file_size, cloud_url FROM content WHERE file_size IS NOT NULL LIMIT 5`);
  console.log('\nWith file_size:', sample.rows);
  
  const noSize = await pool.query(`SELECT id, title, cloud_url FROM content WHERE file_size IS NULL LIMIT 5`);
  console.log('\nWithout file_size:', noSize.rows);
  
  // Check admin attachments size
  const admin = await pool.query(`SELECT COUNT(*) as total, SUM(COALESCE(file_size, 0)) as total_size FROM admin_proc_task_attachments`);
  console.log('\nAdmin attachments:', admin.rows[0]);
  
  // Check task_attachments
  const taskAtt = await pool.query(`SELECT COUNT(*) as total FROM task_attachments`);
  console.log('\nTask attachments:', taskAtt.rows[0]);
  
  process.exit(0);
}
c();
