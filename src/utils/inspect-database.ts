import { getPool } from '../config/database';

interface Column {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length: number | null;
}

interface Table {
  table_name: string;
  columns: Column[];
}

interface Schema {
  schema_name: string;
  tables: Table[];
}

const inspectDatabase = async () => {
  const pool = getPool();

  try {
    // Get all schemas
    const schemasResult = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1')
      ORDER BY schema_name
    `);

    const schemas: Schema[] = [];

    for (const schemaRow of schemasResult.rows) {
      const schemaName = schemaRow.schema_name;

      // Get all tables in this schema
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `, [schemaName]);

      const tables: Table[] = [];

      for (const tableRow of tablesResult.rows) {
        const tableName = tableRow.table_name;

        // Get all columns for this table
        const columnsResult = await pool.query(`
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default,
            character_maximum_length
          FROM information_schema.columns
          WHERE table_schema = $1 AND table_name = $2
          ORDER BY ordinal_position
        `, [schemaName, tableName]);

        tables.push({
          table_name: tableName,
          columns: columnsResult.rows,
        });
      }

      schemas.push({
        schema_name: schemaName,
        tables,
      });
    }

    // Print the schema information
    console.log('\n========== DATABASE SCHEMA INSPECTION ==========\n');

    for (const schema of schemas) {
      console.log(`\n📦 SCHEMA: ${schema.schema_name}`);
      console.log('='.repeat(60));

      for (const table of schema.tables) {
        console.log(`\n  📋 TABLE: ${table.table_name}`);
        console.log('  ' + '-'.repeat(56));
        console.log('  Column Name                | Type              | Nullable | Default');
        console.log('  ' + '-'.repeat(56));

        for (const column of table.columns) {
          const colName = column.column_name.padEnd(25);
          const dataType = column.data_type.padEnd(17);
          const nullable = column.is_nullable === 'YES' ? 'Yes' : 'No';
          const defaultVal = column.column_default ? column.column_default.substring(0, 20) : '-';

          console.log(`  ${colName} | ${dataType} | ${nullable.padEnd(8)} | ${defaultVal}`);
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Database inspection completed\n');

  } catch (error) {
    console.error('Error inspecting database:', error);
  } finally {
    await pool.end();
  }
};

inspectDatabase();
