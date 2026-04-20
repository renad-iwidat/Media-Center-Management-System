import pool from '../src/config/database';
import fs from 'fs';
import path from 'path';

interface MigrationResult {
  file: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  error?: string;
}

async function checkIfTableExists(tableName: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function checkIfColumnExists(tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)",
      [tableName, columnName]
    );
    return result.rows[0].exists;
  } catch (error) {
    return false;
  }
}

async function runMigrations() {
  const results: MigrationResult[] = [];
  
  try {
    console.log('🚀 Starting migrations...\n');
    console.log('📋 Checking database connection...');
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!\n');

    const migrationsDir = path.join(__dirname, '../.kiro/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📊 Found ${migrationFiles.length} migration files\n`);

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`⏳ Processing: ${file}`);
      
      try {
        // Check if migration is already applied
        let shouldSkip = false;
        
        if (file.includes('001_add_task_tracking_columns')) {
          shouldSkip = await checkIfColumnExists('tasks', 'started_at');
        } else if (file.includes('002_add_content_metadata_columns')) {
          shouldSkip = await checkIfColumnExists('content', 'task_id');
        } else if (file.includes('003_enhance_task_relations')) {
          shouldSkip = await checkIfColumnExists('task_relations', 'relation_type');
        } else if (file.includes('004_enhance_content_tasks')) {
          shouldSkip = await checkIfColumnExists('content_tasks', 'usage_type');
        } else if (file.includes('005_add_order_tracking_columns')) {
          shouldSkip = await checkIfColumnExists('orders', 'started_at');
        } else if (file.includes('006_create_task_kpi_table')) {
          shouldSkip = await checkIfTableExists('task_kpi');
        } else if (file.includes('007_create_order_kpi_table')) {
          shouldSkip = await checkIfTableExists('order_kpi');
        } else if (file.includes('008_create_user_kpi_table')) {
          shouldSkip = await checkIfTableExists('user_kpi');
        }

        if (shouldSkip) {
          console.log(`⏭️  Skipped: ${file} (already applied)\n`);
          results.push({
            file,
            status: 'skipped',
            message: 'Already applied'
          });
          continue;
        }

        await pool.query(sql);
        console.log(`✅ Completed: ${file}\n`);
        results.push({
          file,
          status: 'success',
          message: 'Applied successfully'
        });
      } catch (error: any) {
        console.error(`❌ Error in ${file}:`, error.message);
        console.error(`Details: ${error.detail || 'No additional details'}\n`);
        results.push({
          file,
          status: 'error',
          message: 'Failed to apply',
          error: error.message
        });
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    const successful = results.filter(r => r.status === 'success').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed = results.filter(r => r.status === 'error').length;

    console.log(`✅ Successful: ${successful}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('='.repeat(60) + '\n');

    if (failed > 0) {
      console.log('❌ Some migrations failed:');
      results.filter(r => r.status === 'error').forEach(r => {
        console.log(`  - ${r.file}: ${r.error}`);
      });
      process.exit(1);
    } else {
      console.log('✅ All migrations completed successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Migration process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();
