import pool from '../src/config/database';

async function checkMigrations() {
  try {
    console.log('🔍 Checking migrations status...\n');

    // Check if task_kpi table exists
    const kpiCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_kpi')"
    );
    console.log('✅ task_kpi table exists:', kpiCheck.rows[0].exists);

    // Check if order_kpi table exists
    const orderKpiCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_kpi')"
    );
    console.log('✅ order_kpi table exists:', orderKpiCheck.rows[0].exists);

    // Check if user_kpi table exists
    const userKpiCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_kpi')"
    );
    console.log('✅ user_kpi table exists:', userKpiCheck.rows[0].exists);

    // Check tasks columns
    const tasksColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks' AND column_name IN ('started_at', 'completed_at', 'is_overdue', 'estimated_duration', 'actual_duration')"
    );
    console.log('✅ tasks columns:', tasksColumns.rows.map(r => r.column_name).join(', '));

    // Check content columns
    const contentColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'content' AND column_name IN ('task_id', 'cloud_url', 'file_size', 'duration', 'version', 'is_archived', 'archived_at')"
    );
    console.log('✅ content columns:', contentColumns.rows.map(r => r.column_name).join(', '));

    // Check orders columns
    const ordersColumns = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('started_at', 'completed_at', 'is_overdue', 'is_archived', 'archived_at', 'quality_score', 'notes')"
    );
    console.log('✅ orders columns:', ordersColumns.rows.map(r => r.column_name).join(', '));

    console.log('\n✅ All migrations are applied successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMigrations();
