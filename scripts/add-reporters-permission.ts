import pool from '../src/config/database';

async function addReportersPermission() {
  try {
    console.log('Adding reporters.view permission...');

    // 1. Check if permission exists
    const permResult = await pool.query(
      "SELECT id FROM permissions WHERE name = 'reporters.view'"
    );

    let permissionId: bigint;

    if (permResult.rows.length === 0) {
      // Create permission if it doesn't exist
      const createResult = await pool.query(
        "INSERT INTO permissions (name) VALUES ('reporters.view') RETURNING id"
      );
      permissionId = createResult.rows[0].id;
      console.log('✅ Created permission: reporters.view (ID:', permissionId, ')');
    } else {
      permissionId = permResult.rows[0].id;
      console.log('✅ Permission already exists: reporters.view (ID:', permissionId, ')');
    }

    // 2. Get all admin roles
    const rolesResult = await pool.query(
      "SELECT id, name FROM roles WHERE id = 22 OR name ILIKE '%admin%' OR name ILIKE '%مدير%'"
    );

    console.log('\nFound admin roles:');
    rolesResult.rows.forEach((r: any) => {
      console.log('  -', r.id, ':', r.name);
    });

    // 3. Add permission to each admin role
    for (const role of rolesResult.rows) {
      const checkResult = await pool.query(
        'SELECT role_id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
        [role.id, permissionId]
      );

      if (checkResult.rows.length === 0) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
          [role.id, permissionId]
        );
        console.log('✅ Added permission to role:', role.name);
      } else {
        console.log('⚠️  Permission already assigned to role:', role.name);
      }
    }

    console.log('\n✅ Done! reporters.view permission added to all admin roles');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

addReportersPermission();
