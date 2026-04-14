/**
 * Migration: Convert program_roles.role (text) to role_id (bigint)
 * 
 * Steps:
 * 1. Add role_id column
 * 2. Map existing text roles to role IDs
 * 3. Update all records
 * 4. Drop old role column
 * 5. Add foreign key constraint
 * 
 * Run: npx ts-node src/utils/migrate-program-roles-to-role-id.ts
 */

import { getPool } from '../config/database';

async function migrate() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    console.log('🚀 Starting migration: program_roles.role → role_id\n');

    await client.query('BEGIN');

    // Step 1: Add role_id column (nullable for now)
    console.log('1️⃣ Adding role_id column...');
    await client.query(`
      ALTER TABLE program_roles 
      ADD COLUMN IF NOT EXISTS role_id BIGINT;
    `);
    console.log('   ✅ Column added\n');

    // Step 2: Get all unique roles from program_roles
    console.log('2️⃣ Mapping existing roles...');
    const { rows: existingRoles } = await client.query(`
      SELECT DISTINCT role FROM program_roles WHERE role IS NOT NULL;
    `);
    console.log(`   Found ${existingRoles.length} unique roles\n`);

    // Step 3: For each role text, find or create role in roles table
    const roleMapping: { [key: string]: string } = {};
    
    for (const { role } of existingRoles) {
      // Check if role exists in roles table
      const { rows } = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        [role]
      );

      let roleId: string;
      if (rows.length > 0) {
        roleId = rows[0].id;
        console.log(`   ✓ Found existing role: "${role}" (ID: ${roleId})`);
      } else {
        // Create new role
        const { rows: newRole } = await client.query(
          'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
          [role, `Role: ${role}`]
        );
        roleId = newRole[0].id;
        console.log(`   + Created new role: "${role}" (ID: ${roleId})`);
      }

      roleMapping[role] = roleId;
    }
    console.log('');

    // Step 4: Update program_roles with role_id
    console.log('3️⃣ Updating program_roles records...');
    let updated = 0;
    for (const [roleName, roleId] of Object.entries(roleMapping)) {
      const { rowCount } = await client.query(
        'UPDATE program_roles SET role_id = $1 WHERE role = $2',
        [roleId, roleName]
      );
      updated += rowCount || 0;
      console.log(`   ✓ Updated ${rowCount} records: "${roleName}" → ${roleId}`);
    }
    console.log(`   ✅ Total updated: ${updated} records\n`);

    // Step 5: Make role_id NOT NULL
    console.log('4️⃣ Making role_id NOT NULL...');
    await client.query(`
      ALTER TABLE program_roles 
      ALTER COLUMN role_id SET NOT NULL;
    `);
    console.log('   ✅ Done\n');

    // Step 6: Add foreign key constraint
    console.log('5️⃣ Adding foreign key constraint...');
    await client.query(`
      ALTER TABLE program_roles 
      ADD CONSTRAINT fk_program_roles_role 
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT;
    `);
    console.log('   ✅ Foreign key added\n');

    // Step 7: Drop old role column
    console.log('6️⃣ Dropping old role column...');
    await client.query(`
      ALTER TABLE program_roles 
      DROP COLUMN IF EXISTS role;
    `);
    console.log('   ✅ Column dropped\n');

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!\n');

    // Show summary
    const { rows: summary } = await client.query(`
      SELECT 
        COUNT(*) as total_program_roles,
        COUNT(DISTINCT role_id) as unique_roles
      FROM program_roles;
    `);
    console.log('📊 Summary:');
    console.log(`   Total program roles: ${summary[0].total_program_roles}`);
    console.log(`   Unique roles: ${summary[0].unique_roles}`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
migrate().catch(console.error);
