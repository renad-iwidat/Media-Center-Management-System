import pool from '../config/database';

/**
 * Migration: Add administrative procedures tables
 * Creates tables for administrative procedures (Official Books Assignment, Announcements, Tenders, HR)
 * Only visible to assigned users and mentioned users
 * 
 * جداول خاصة بالإجراءات الإدارية - منفصلة تماماً عن نظام الأوردرات والمهام العادي
 * كل الجداول تبدأ بـ "admin_proc_" للتمييز عن جداول النظام العادي
 */
export async function addAdministrativeProceduresTables() {
  try {
    console.log('📝 Creating administrative procedures tables...');

    // 1. جدول الأقسام الإدارية (الأقسام الأربعة)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_categories (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        color VARCHAR(20),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_categories table created');

    // 2. جدول الطلبات الإدارية (Orders)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_orders (
        id BIGSERIAL PRIMARY KEY,
        category_id BIGINT NOT NULL REFERENCES admin_proc_categories(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status_id BIGINT NOT NULL REFERENCES order_statuses(id) ON DELETE RESTRICT,
        priority_id BIGINT REFERENCES priority_levels(id) ON DELETE SET NULL,
        deadline TIMESTAMP WITH TIME ZONE,
        created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        is_archived BOOLEAN DEFAULT false,
        archived_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_orders table created');

    // 3. جدول المهام الإدارية (Tasks)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_tasks (
        id BIGSERIAL PRIMARY KEY,
        admin_order_id BIGINT NOT NULL REFERENCES admin_proc_orders(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status_id BIGINT NOT NULL REFERENCES task_statuses(id) ON DELETE RESTRICT,
        priority_id BIGINT REFERENCES priority_levels(id) ON DELETE SET NULL,
        deadline TIMESTAMP WITH TIME ZONE,
        sequence_order INTEGER,
        created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        started_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        is_archived BOOLEAN DEFAULT false,
        archived_at TIMESTAMP WITH TIME ZONE,
        estimated_duration INTEGER,
        actual_duration INTEGER,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_tasks table created');

    // 4. جدول تعيينات المهام الإدارية (من يقدر يشوفها)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_task_assignments (
        id BIGSERIAL PRIMARY KEY,
        admin_task_id BIGINT NOT NULL REFERENCES admin_proc_tasks(id) ON DELETE CASCADE,
        assigned_to BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assigned_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(admin_task_id, assigned_to)
      );
    `);
    console.log('✅ admin_proc_task_assignments table created');

    // 5. جدول التعليقات الإدارية
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_task_comments (
        id BIGSERIAL PRIMARY KEY,
        admin_task_id BIGINT NOT NULL REFERENCES admin_proc_tasks(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        comment TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_task_comments table created');

    // 6. جدول الملفات المرفقة الإدارية
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_task_attachments (
        id BIGSERIAL PRIMARY KEY,
        admin_task_id BIGINT NOT NULL REFERENCES admin_proc_tasks(id) ON DELETE CASCADE,
        title VARCHAR(255),
        description TEXT,
        file_url VARCHAR(500) NOT NULL,
        file_type VARCHAR(50),
        file_size BIGINT,
        uploaded_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_task_attachments table created');

    // 7. جدول سجل التغييرات الإداري
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_task_history (
        id BIGSERIAL PRIMARY KEY,
        admin_task_id BIGINT NOT NULL REFERENCES admin_proc_tasks(id) ON DELETE CASCADE,
        old_status_id BIGINT REFERENCES task_statuses(id) ON DELETE SET NULL,
        new_status_id BIGINT NOT NULL REFERENCES task_statuses(id) ON DELETE RESTRICT,
        changed_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        notes TEXT
      );
    `);
    console.log('✅ admin_proc_task_history table created');

    // 8. جدول الأرشيف الإداري الخاص
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_archive (
        id BIGSERIAL PRIMARY KEY,
        admin_order_id BIGINT REFERENCES admin_proc_orders(id) ON DELETE SET NULL,
        admin_task_id BIGINT REFERENCES admin_proc_tasks(id) ON DELETE SET NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_data JSONB NOT NULL,
        archived_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        reason TEXT
      );
    `);
    console.log('✅ admin_proc_archive table created');

    // 9. جدول المنشنات الإدارية (Mentions)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_mentions (
        id BIGSERIAL PRIMARY KEY,
        comment_id BIGINT NOT NULL REFERENCES admin_proc_task_comments(id) ON DELETE CASCADE,
        mentioned_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentioned_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL,
        entity_id BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ admin_proc_mentions table created');

    // 10. جدول صلاحيات الوصول الإداري (مين يقدر يشوف الأقسام الإدارية)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_proc_access (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        granted_by BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        UNIQUE(user_id)
      );
    `);
    console.log('✅ admin_proc_access table created');

    // Create indexes for better performance
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_orders_category ON admin_proc_orders(category_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_orders_status ON admin_proc_orders(status_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_orders_created_by ON admin_proc_orders(created_by);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_orders_archived ON admin_proc_orders(is_archived);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_tasks_order ON admin_proc_tasks(admin_order_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_tasks_status ON admin_proc_tasks(status_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_tasks_archived ON admin_proc_tasks(is_archived);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_assignments_user ON admin_proc_task_assignments(assigned_to);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_assignments_task ON admin_proc_task_assignments(admin_task_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_comments_task ON admin_proc_task_comments(admin_task_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_attachments_task ON admin_proc_task_attachments(admin_task_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_history_task ON admin_proc_task_history(admin_task_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_mentions_user ON admin_proc_mentions(mentioned_user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_mentions_entity ON admin_proc_mentions(entity_type, entity_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_admin_proc_access_user ON admin_proc_access(user_id);`);

    console.log('✅ All indexes created successfully');

    // Insert the 4 administrative categories
    await pool.query(`
      INSERT INTO admin_proc_categories (name, description, icon, color) 
      VALUES 
        ('تكليف الكتب الرسمية', 'قسم تكليف الكتب الرسمية والمستندات', 'BookOpen', '#3B82F6'),
        ('الإعلانات', 'قسم الإعلانات والإخطارات الإدارية', 'Megaphone', '#10B981'),
        ('العطاءات', 'قسم العطاءات والمناقصات', 'TrendingUp', '#F59E0B'),
        ('الموارد البشرية', 'قسم الموارد البشرية والشؤون الإدارية', 'Users', '#8B5CF6')
      ON CONFLICT (name) DO NOTHING;
    `);
    console.log('✅ Administrative categories inserted');

    // Grant access to specific users (only the 6 authorized people)
    // المسموح لهم فقط:
    // 1. غازي مرتجى
    // 2. نغم كيلاني
    // 3. هيا المصري
    // 4. حنين بكر
    // 5. رناد عويضات
    // 6. علا عامر
    await pool.query(`
      INSERT INTO admin_proc_access (user_id, granted_by)
      SELECT u.id, u.id 
      FROM users u
      WHERE TRIM(u.name) ILIKE '%غازي مرتجى%'
         OR TRIM(u.name) = 'نغم كيلاني' OR TRIM(u.name) ILIKE 'نغم كيلاني%'
         OR TRIM(u.name) ILIKE '%هيا مصري%' OR TRIM(u.name) ILIKE '%هيا المصري%'
         OR TRIM(u.name) ILIKE '%حنين بكر%'
         OR TRIM(u.name) ILIKE '%رناد عويضات%'
         OR TRIM(u.name) ILIKE '%علا عامر%'
      ON CONFLICT (user_id) DO NOTHING;
    `);
    console.log('✅ Initial admin access granted to authorized users');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Administrative procedures tables already exist');
    } else {
      console.error('❌ Error creating administrative procedures tables:', error.message);
      throw error;
    }
  }
}

// Run migration
addAdministrativeProceduresTables().catch(console.error);
