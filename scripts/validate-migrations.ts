import pool from '../src/config/database';
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  check: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

async function validateMigrations() {
  const results: ValidationResult[] = [];

  try {
    console.log('🔍 Validating migration environment...\n');

    // 1. Check database connection
    try {
      await pool.query('SELECT NOW()');
      results.push({
        check: 'Database Connection',
        status: 'pass',
        message: 'Connected successfully'
      });
    } catch (error: any) {
      results.push({
        check: 'Database Connection',
        status: 'fail',
        message: `Failed: ${error.message}`
      });
    }

    // 2. Check if migration files exist
    const migrationsDir = path.join(__dirname, '../.kiro/migrations');
    try {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
      if (files.length === 8) {
        results.push({
          check: 'Migration Files',
          status: 'pass',
          message: `Found all 8 migration files`
        });
      } else {
        results.push({
          check: 'Migration Files',
          status: 'fail',
          message: `Expected 8 files, found ${files.length}`
        });
      }
    } catch (error: any) {
      results.push({
        check: 'Migration Files',
        status: 'fail',
        message: `Directory not found: ${error.message}`
      });
    }

    // 3. Check if base tables exist
    const baseTables = ['tasks', 'content', 'orders', 'users', 'task_relations', 'content_tasks'];
    for (const table of baseTables) {
      try {
        const result = await pool.query(
          "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
          [table]
        );
        if (result.rows[0].exists) {
          results.push({
            check: `Table: ${table}`,
            status: 'pass',
            message: 'Exists'
          });
        } else {
          results.push({
            check: `Table: ${table}`,
            status: 'fail',
            message: 'Does not exist'
          });
        }
      } catch (error: any) {
        results.push({
          check: `Table: ${table}`,
          status: 'fail',
          message: `Error: ${error.message}`
        });
      }
    }

    // 4. Check migration status
    const migrationChecks = [
      { name: 'tasks.started_at', table: 'tasks', column: 'started_at' },
      { name: 'content.task_id', table: 'content', column: 'task_id' },
      { name: 'orders.started_at', table: 'orders', column: 'started_at' },
      { name: 'task_kpi table', table: 'task_kpi', column: null },
      { name: 'order_kpi table', table: 'order_kpi', column: null },
      { name: 'user_kpi table', table: 'user_kpi', column: null }
    ];

    for (const check of migrationChecks) {
      try {
        let exists = false;
        if (check.column) {
          const result = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2)",
            [check.table, check.column]
          );
          exists = result.rows[0].exists;
        } else {
          const result = await pool.query(
            "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)",
            [check.table]
          );
          exists = result.rows[0].exists;
        }

        results.push({
          check: `Migration: ${check.name}`,
          status: exists ? 'warning' : 'pass',
          message: exists ? 'Already applied' : 'Ready to apply'
        });
      } catch (error: any) {
        results.push({
          check: `Migration: ${check.name}`,
          status: 'fail',
          message: `Error: ${error.message}`
        });
      }
    }

    // 5. Check user permissions
    try {
      await pool.query('CREATE TEMPORARY TABLE test_permissions (id INT)');
      await pool.query('DROP TABLE test_permissions');
      results.push({
        check: 'User Permissions',
        status: 'pass',
        message: 'Has CREATE/DROP permissions'
      });
    } catch (error: any) {
      results.push({
        check: 'User Permissions',
        status: 'fail',
        message: `Insufficient permissions: ${error.message}`
      });
    }

    // Print results
    console.log('='.repeat(70));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(70) + '\n');

    results.forEach(r => {
      const icon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⚠️ ';
      console.log(`${icon} ${r.check.padEnd(30)} | ${r.message}`);
    });

    console.log('\n' + '='.repeat(70));

    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const warnings = results.filter(r => r.status === 'warning').length;

    console.log(`✅ Passed: ${passed} | ⚠️  Warnings: ${warnings} | ❌ Failed: ${failed}`);
    console.log('='.repeat(70) + '\n');

    if (failed > 0) {
      console.log('❌ Validation failed! Fix the issues above before running migrations.');
      process.exit(1);
    } else if (warnings > 0) {
      console.log('⚠️  Some migrations are already applied. They will be skipped.');
      console.log('✅ Ready to run migrations!\n');
      process.exit(0);
    } else {
      console.log('✅ All validations passed! Ready to run migrations.\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation process failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

validateMigrations();
