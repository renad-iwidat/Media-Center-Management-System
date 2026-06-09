import pool from '../config/database';

/**
 * Migration: Recurring Daily Tasks (المهام اليومية الثابتة)
 *
 * ينشئ جداول المهام اليومية الثابتة - منفصلة تماماً عن جداول tasks / orders.
 * كل الجداول تبدأ بـ "daily_task_" للتمييز عن نظام المهام العادي.
 *
 * - daily_task_templates: قالب ثابت لكل مهمة يومية مُسند لموظف (يتكرر كل يوم).
 * - daily_task_completions: سجل إنجاز لكل (قالب × يوم تشغيلي) يُنشأ فقط عند وضع علامة.
 *
 * كما يضيف صلاحيتين جديدتين: daily_tasks.manage و daily_tasks.view_all.
 */
export async function addRecurringDailyTasksTables() {
  try {
    console.log('📝 Creating recurring daily tasks tables...');

    // 1. جدول قوالب المهام اليومية
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_task_templates (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        assigned_to BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sequence_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        deleted_at TIMESTAMP WITH TIME ZONE,
        created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ daily_task_templates table created');

    // 2. جدول سجلات الإنجاز اليومي
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_task_completions (
        id BIGSERIAL PRIMARY KEY,
        template_id BIGINT NOT NULL REFERENCES daily_task_templates(id) ON DELETE CASCADE,
        business_day DATE NOT NULL,
        is_completed BOOLEAN NOT NULL DEFAULT true,
        marked_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        marked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(template_id, business_day)
      );
    `);
    console.log('✅ daily_task_completions table created');

    // 3. الفهارس
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_daily_templates_assignee ON daily_task_templates(assigned_to, is_active, sequence_order);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_daily_completions_lookup ON daily_task_completions(business_day, template_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_daily_completions_template ON daily_task_completions(template_id);`);
    console.log('✅ daily task indexes created');

    // 4. إضافة الصلاحيات الجديدة (idempotent)
    const permissionNames = ['daily_tasks.manage', 'daily_tasks.view_all'];
    for (const name of permissionNames) {
      const existing = await pool.query('SELECT id FROM permissions WHERE name = $1', [name]);
      let permissionId: bigint;
      if (existing.rows.length === 0) {
        const created = await pool.query('INSERT INTO permissions (name) VALUES ($1) RETURNING id', [name]);
        permissionId = created.rows[0].id;
        console.log(`✅ Created permission: ${name}`);
      } else {
        permissionId = existing.rows[0].id;
        console.log(`⚠️  Permission already exists: ${name}`);
      }

      // منح الصلاحية لأدوار الإدارة (نفس نمط بقية النظام)
      const adminRoles = await pool.query(
        "SELECT id, name FROM roles WHERE id = 22 OR name ILIKE '%admin%' OR name ILIKE '%مدير%'"
      );
      for (const role of adminRoles.rows) {
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [role.id, permissionId]
        );
      }
    }
    console.log('✅ Daily task permissions granted to admin roles');

    console.log('🎉 Recurring daily tasks migration completed successfully');
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      console.log('⚠️  Recurring daily tasks tables already exist');
    } else {
      console.error('❌ Error creating recurring daily tasks tables:', error.message);
      throw error;
    }
  }
}

// Run migration
addRecurringDailyTasksTables()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    pool.end();
  });
