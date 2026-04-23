import { getPool } from '../config/database';

async function getManagers() {
  const pool = getPool();
  
  try {
    // Get all users
    const users = await pool.query('SELECT id, name, email FROM users ORDER BY id');
    console.log('\n=== جميع الموظفين ===');
    console.log(users.rows);
    
    // Get managers from desks
    const deskManagers = await pool.query('SELECT DISTINCT manager_id FROM desks WHERE manager_id IS NOT NULL');
    console.log('\n=== معرفات المديرين في الأقسام ===');
    console.log(deskManagers.rows);
    
    // Get managers from teams
    const teamManagers = await pool.query('SELECT DISTINCT manager_id FROM teams WHERE manager_id IS NOT NULL');
    console.log('\n=== معرفات المديرين في الفرق ===');
    console.log(teamManagers.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getManagers();
