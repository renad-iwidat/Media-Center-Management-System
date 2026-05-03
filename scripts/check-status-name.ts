import pool from '../src/config/database';

async function checkStatusName() {
  const r = await pool.query('SELECT id, name FROM task_statuses WHERE id = 6');
  console.log('Status 6:');
  console.log(r.rows[0]);
  
  // Check if it contains "Done" or "منجز"
  const name = r.rows[0].name;
  console.log('\nName bytes:', Buffer.from(name).toString('hex'));
  console.log('Name length:', name.length);
  console.log('Name includes "Done":', name.includes('Done'));
  console.log('Name includes "منجز":', name.includes('منجز'));
  
  process.exit(0);
}

checkStatusName();
