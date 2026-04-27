import pool from '../src/config/database';
async function check() {
  try {
    const result = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Tables:');
    result.rows.forEach((r: any) => console.log(' -', r.table_name));
  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
