import { getPool } from '../config/database';

interface TableInfo {
  table_name: string;
  columns: string[];
}

const checkExistingTables = async () => {
  const pool = getPool();

  try {
    console.log('\n========== CHECKING EXISTING TABLES ==========\n');

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;

      // Get columns for each table
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      tables.push({
        table_name: tableName,
        columns: columnsResult.rows.map(r => r.column_name),
      });
    }

    // Print all tables
    console.log('📊 ALL EXISTING TABLES:\n');
    tables.forEach(table => {
      console.log(`📋 ${table.table_name}`);
      console.log(`   Columns: ${table.columns.join(', ')}`);
      console.log('');
    });

    // Check for specific tables we're looking for
    console.log('\n========== CHECKING FOR REQUIRED TABLES ==========\n');

    const requiredTables = [
      { name: 'employee_schedules', description: 'Employee work schedules' },
      { name: 'program_details', description: 'Program additional details' },
      { name: 'program_team_members', description: 'Program team members' },
      { name: 'episode_details', description: 'Episode additional details' },
    ];

    requiredTables.forEach(required => {
      const found = tables.find(t => t.table_name === required.name);
      if (found) {
        console.log(`✓ ${required.name} - EXISTS`);
        console.log(`  Columns: ${found.columns.join(', ')}\n`);
      } else {
        console.log(`✗ ${required.name} - MISSING (${required.description})\n`);
      }
    });

    // Check for phone column in guests table
    console.log('========== CHECKING GUESTS TABLE ==========\n');
    const guestsTable = tables.find(t => t.table_name === 'guests');
    if (guestsTable) {
      console.log('✓ guests table EXISTS');
      console.log(`  Columns: ${guestsTable.columns.join(', ')}`);
      if (guestsTable.columns.includes('phone')) {
        console.log('  ✓ phone column EXISTS\n');
      } else {
        console.log('  ✗ phone column MISSING\n');
      }
    }

    // Check related tables that might contain similar data
    console.log('========== CHECKING RELATED TABLES ==========\n');
    
    const relatedTables = [
      'users',
      'programs',
      'episodes',
      'guests',
      'tasks',
      'content',
      'shootings',
    ];

    relatedTables.forEach(tableName => {
      const found = tables.find(t => t.table_name === tableName);
      if (found) {
        console.log(`📋 ${tableName}`);
        console.log(`   Columns: ${found.columns.join(', ')}\n`);
      }
    });

    console.log('========== ANALYSIS COMPLETE ==========\n');

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
};

checkExistingTables();
