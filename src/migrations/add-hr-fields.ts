import pool from '../config/database';

/**
 * Migration: إضافة حقول الموارد البشرية (إجازات ومغادرات) على جدول الطلبات الإدارية
 */
export async function addHRFields() {
  try {
    console.log('📝 Adding HR fields to admin_proc_orders...');

    // نوع طلب الموارد البشرية (إجازة / مغادرة)
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS hr_type VARCHAR(50);
    `);
    console.log('✅ hr_type column added');

    // نوع الإجازة (سنوية / مرضية / بدون راتب / طارئة / أمومة / أخرى)
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
    `);
    console.log('✅ leave_type column added');

    // الموظف المعني (اللي بيطلب الإجازة)
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS employee_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ employee_id column added');

    // تاريخ البداية
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS start_date DATE;
    `);
    console.log('✅ start_date column added');

    // تاريخ النهاية
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS end_date DATE;
    `);
    console.log('✅ end_date column added');

    // عدد الأيام
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS days_count NUMERIC(5,1);
    `);
    console.log('✅ days_count column added');

    // وقت المغادرة - من
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS leave_time_from TIME;
    `);
    console.log('✅ leave_time_from column added');

    // وقت المغادرة - إلى
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS leave_time_to TIME;
    `);
    console.log('✅ leave_time_to column added');

    // السبب
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS reason TEXT;
    `);
    console.log('✅ reason column added');

    // البديل (الموظف اللي بيغطي)
    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS substitute_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
    `);
    console.log('✅ substitute_id column added');

    // Indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_orders_hr_type ON admin_proc_orders(hr_type);
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_orders_employee ON admin_proc_orders(employee_id);
    `);
    console.log('✅ Indexes created');

    console.log('\n🎉 HR fields added successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Columns already exist');
    } else {
      console.error('❌ Error adding HR fields:', error.message);
      throw error;
    }
  }
}

addHRFields().catch(console.error);
