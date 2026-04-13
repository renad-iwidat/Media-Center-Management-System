import { getPool } from '../config/database';

const analyzeRolesStructure = async () => {
  const pool = getPool();

  try {
    console.log('\n========== ANALYZING ROLES STRUCTURE ==========\n');

    // Get USERS table
    console.log('📋 USERS TABLE:');
    console.log('─'.repeat(80));
    const usersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    usersResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type}`);
    });

    // Get ROLES table
    console.log('\n📋 ROLES TABLE:');
    console.log('─'.repeat(80));
    const rolesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'roles'
      ORDER BY ordinal_position
    `);
    rolesResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type}`);
    });

    // Get PERMISSIONS table
    console.log('\n📋 PERMISSIONS TABLE:');
    console.log('─'.repeat(80));
    const permissionsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'permissions'
      ORDER BY ordinal_position
    `);
    permissionsResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type}`);
    });

    // Get ROLE_PERMISSIONS table
    console.log('\n📋 ROLE_PERMISSIONS TABLE (Junction):');
    console.log('─'.repeat(80));
    const rolePermissionsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'role_permissions'
      ORDER BY ordinal_position
    `);
    rolePermissionsResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type}`);
    });

    // Get actual data from ROLES
    console.log('\n📊 ACTUAL ROLES DATA:');
    console.log('─'.repeat(80));
    const rolesDataResult = await pool.query(`
      SELECT id, name, description FROM roles LIMIT 10
    `);
    if (rolesDataResult.rows.length > 0) {
      console.log('ID | Name | Description');
      rolesDataResult.rows.forEach(role => {
        console.log(`${role.id} | ${role.name} | ${role.description || 'N/A'}`);
      });
    } else {
      console.log('  (No roles data found)');
    }

    // Get actual data from USERS
    console.log('\n📊 ACTUAL USERS DATA:');
    console.log('─'.repeat(80));
    const usersDataResult = await pool.query(`
      SELECT u.id, u.name, u.email, u.role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LIMIT 5
    `);
    if (usersDataResult.rows.length > 0) {
      console.log('ID | Name | Email | Role_ID | Role_Name');
      usersDataResult.rows.forEach(user => {
        console.log(`${user.id} | ${user.name} | ${user.email} | ${user.role_id || 'NULL'} | ${user.role_name || 'NULL'}`);
      });
    } else {
      console.log('  (No users data found)');
    }

    // Show the relationship diagram
    console.log('\n\n========== RELATIONSHIP DIAGRAM ==========\n');
    console.log(`
    USERS
    ├── id (BIGINT) - معرف المستخدم
    ├── name (TEXT) - اسم المستخدم
    ├── email (TEXT) - البريد الإلكتروني
    ├── role_id (BIGINT) ──────────┐
    └── created_at                 │
                                   │ FOREIGN KEY
                                   ↓
                                ROLES
                                ├── id (BIGINT)
                                ├── name (TEXT) - اسم الرول
                                └── description (TEXT)
                                   ↑
                                   │ MANY-TO-MANY
                                   │
                            ROLE_PERMISSIONS
                            ├── role_id (BIGINT)
                            └── permission_id (BIGINT)
                                   ↑
                                   │
                            PERMISSIONS
                            ├── id (BIGINT)
                            ├── name (TEXT)
                            └── description (TEXT)
    `);

    // Explain the problem
    console.log('\n========== THE PROBLEM WITH CURRENT STRUCTURE ==========\n');
    console.log(`
    المشكلة:
    ─────────
    
    الـ role_id في جدول users يشير لـ roles.id
    
    لكن الـ roles الموجودة هي أدوار عامة مثل:
    • Admin
    • Editor
    • Manager
    • Viewer
    
    هذي الأدوار تحدد الصلاحيات العامة للمستخدم في النظام.
    
    لكن احنا بنحتاج نعرف:
    • مين المقدم (Presenter) للبرنامج؟
    • مين المعد (Producer) للبرنامج؟
    • مين المساعد (Assistant) للبرنامج؟
    
    هذي أدوار خاصة بالبرنامج، مش أدوار عامة في النظام!
    
    مثال:
    ──────
    
    User: أحمد
    • role_id = 2 (Editor) ← هذا الرول العام
    
    لكن في البرنامج "برنامج الأخبار":
    • أحمد هو المقدم (Presenter)
    
    وفي البرنامج "برنامج الرياضة":
    • أحمد هو المعد (Producer)
    
    إذن نفس الشخص له أدوار مختلفة في برامج مختلفة!
    
    الحل:
    ──────
    نحتاج جدول منفصل يربط:
    • البرنامج
    • المستخدم
    • الدور الخاص به في هذا البرنامج
    `);

    console.log('\n========== ANALYSIS COMPLETE ==========\n');

  } catch (error) {
    console.error('Error analyzing roles:', error);
  } finally {
    await pool.end();
  }
};

analyzeRolesStructure();
