import pool from '../src/config/database';
async function check() {
  try {
    const result = await pool.query(
      "SELECT u.*, r.name as role_name FROM users u LEFT JOIN roles r ON u.role_id = r.id WHERE u.name LIKE '%خلف%'"
    );
    console.log('Khalaf:', JSON.stringify(result.rows, null, 2));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
