import pool from '../config/database';

/**
 * Migration: View-All permissions for tasks & orders (رؤية شاملة)
 *
 * يضيف صلاحيتين: tasks.viewAll و orders.viewAll.
 * - تُمنح لدور "مدير المركز" (role 22).
 * - تُنشأ دور خاص "رؤية شاملة" يحمل الصلاحيتين، ويُسند للأشخاص المحددين:
 *   غازي مرتجى، نغم كيلاني، هيا مصري — دون التأثير على باقي الموظفين الإداريين.
 *
 * باقي الموظفين بدون هذه الصلاحية يرون فقط ما أنشأوه أو أُسند إليهم أو ذُكروا فيه.
 */
export async function addViewAllPermissions() {
  try {
    console.log('📝 Adding view-all permissions for tasks & orders...');

    // 1. إنشاء/جلب الصلاحيتين
    const permNames = ['tasks.viewAll', 'orders.viewAll'];
    const permIds: Record<string, bigint> = {};
    for (const name of permNames) {
      const existing = await pool.query('SELECT id FROM permissions WHERE name = $1', [name]);
      if (existing.rows.length === 0) {
        const created = await pool.query('INSERT INTO permissions (name) VALUES ($1) RETURNING id', [name]);
        permIds[name] = created.rows[0].id;
        console.log(`✅ Created permission: ${name}`);
      } else {
        permIds[name] = existing.rows[0].id;
        console.log(`⚠️  Permission already exists: ${name}`);
      }
    }

    // 2. منح الصلاحيتين لدور مدير المركز (role 22)
    const centerManagerRole = await pool.query(
      "SELECT id FROM roles WHERE id = 22 OR name ILIKE '%مدير المركز%'"
    );
    for (const role of centerManagerRole.rows) {
      for (const name of permNames) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [role.id, permIds[name]]
        );
      }
    }
    console.log('✅ Granted view-all permissions to مدير المركز role');

    // 3. إنشاء/جلب دور "رؤية شاملة"
    let viewAllRoleId: bigint;
    const existingRole = await pool.query("SELECT id FROM roles WHERE name = $1", ['رؤية شاملة']);
    if (existingRole.rows.length === 0) {
      const createdRole = await pool.query(
        'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id',
        ['رؤية شاملة', 'صلاحية رؤية كل الطلبات والمهام (تُسند لأشخاص محددين)']
      );
      viewAllRoleId = createdRole.rows[0].id;
      console.log('✅ Created role: رؤية شاملة');
    } else {
      viewAllRoleId = existingRole.rows[0].id;
      console.log('⚠️  Role already exists: رؤية شاملة');
    }

    // ربط الصلاحيتين بدور "رؤية شاملة"
    for (const name of permNames) {
      await pool.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [viewAllRoleId, permIds[name]]
      );
    }

    // 4. إسناد دور "رؤية شاملة" للأشخاص المحددين (مطابقة دقيقة بالاسم)
    const targetUsers = await pool.query(
      `SELECT id, name FROM users
       WHERE name ILIKE '%غازي%مرتجى%'
          OR name ILIKE '%نغم%كيلاني%'
          OR name ILIKE '%هيا%مصري%'`
    );
    for (const u of targetUsers.rows) {
      await pool.query(
        'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [u.id, viewAllRoleId]
      );
      console.log(`✅ Granted رؤية شاملة to: ${u.name}`);
    }

    console.log('🎉 View-all permissions migration completed successfully');
  } catch (error: any) {
    console.error('❌ Error adding view-all permissions:', error.message);
    throw error;
  }
}

addViewAllPermissions()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
  });
