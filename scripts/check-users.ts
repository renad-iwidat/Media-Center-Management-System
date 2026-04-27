import pool from '../src/config/database';
async function check() {
  try {
    const result = await pool.query(
      'SELECT u.id, u.name, u.email, u.role_id, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id ORDER BY u.id'
    );
    console.log('Users (' + result.rows.length + '):');
    result.rows.forEach((r: any) => console.log(' ', r.id, '|', r.name, '|', r.email, '|', r.role_name));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
