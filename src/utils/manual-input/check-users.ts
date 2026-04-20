import pool from '../../config/database';

async function checkUsers() {
  try {
    // Get users table structure
    const cols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    console.log('Users columns:', cols.rows.map(r => r.column_name));
    
    // Get sample users
    const users = await pool.query('SELECT * FROM users LIMIT 10');
    console.log('\nSample users:', users.rows);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();
