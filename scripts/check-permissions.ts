import pool from '../src/config/database';
async function check() {
  try {
    // Check permissions table structure
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'permissions' ORDER BY ordinal_position"
    );
    console.log('=== permissions columns ===');
    cols.rows.forEach((r: any) => console.log(' ', r.column_name, '-', r.data_type));

    // Check permissions data
    const perms = await pool.query('SELECT * FROM permissions ORDER BY id');
    console.log('\n=== permissions data ===');
    perms.rows.forEach((r: any) => console.log(' ', JSON.stringify(r)));

    // Check role_permissions structure
    const rpCols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'role_permissions' ORDER BY ordinal_position"
    );
    console.log('\n=== role_permissions columns ===');
    rpCols.rows.forEach((r: any) => console.log(' ', r.column_name, '-', r.data_type));

    // Check role_permissions data
    const rp = await pool.query('SELECT * FROM role_permissions ORDER BY role_id, permission_id');
    console.log('\n=== role_permissions data (' + rp.rows.length + ' rows) ===');
    rp.rows.slice(0, 20).forEach((r: any) => console.log(' ', JSON.stringify(r)));
    if (rp.rows.length > 20) console.log('  ... and', rp.rows.length - 20, 'more');

    // Check roles with permission_level if exists
    const rolesCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'roles'"
    );
    console.log('\n=== roles columns ===');
    rolesCols.rows.forEach((r: any) => console.log(' ', r.column_name));

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}
check();
