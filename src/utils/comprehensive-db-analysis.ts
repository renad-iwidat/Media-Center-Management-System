import { getPool } from '../config/database';

interface TableColumn {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableInfo {
  table_name: string;
  columns: TableColumn[];
}

const comprehensiveAnalysis = async () => {
  const pool = getPool();

  try {
    console.log('\n========== COMPREHENSIVE DATABASE ANALYSIS ==========\n');

    // Get all tables
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const allTables: TableInfo[] = [];

    for (const tableRow of tablesResult.rows) {
      const tableName = tableRow.table_name;

      const columnsResult = await pool.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      allTables.push({
        table_name: tableName,
        columns: columnsResult.rows,
      });
    }

    // Print all tables with their columns
    console.log('📚 ALL TABLES AND COLUMNS:\n');
    allTables.forEach(table => {
      console.log(`📋 ${table.table_name.toUpperCase()}`);
      console.log('─'.repeat(80));
      table.columns.forEach(col => {
        console.log(`  • ${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | Nullable: ${col.is_nullable}`);
      });
      console.log('');
    });

    // Now analyze what's needed vs what exists
    console.log('\n========== REQUIREMENTS ANALYSIS ==========\n');

    const requirements = {
      'PROGRAMS': {
        needed: [
          'اسم البرنامج (title)',
          'موضوع البرنامج (description)',
          'عدد الحلقات (episode_count)',
          'المذيع (presenter_id)',
          'المعد (producer_id)',
          'وقت البث (air_time)',
          'ملاحظات (notes)',
        ],
        table: allTables.find(t => t.table_name === 'programs'),
      },
      'EPISODES': {
        needed: [
          'رقم الحلقة (episode_number)',
          'تاريخ الحلقة (air_date)',
          'موضوع الحلقة (topic)',
          'السكريبت (script_url)',
          'ملاحظات (notes)',
          'ضيوف الحلقة (via episode_guests)',
        ],
        table: allTables.find(t => t.table_name === 'episodes'),
      },
      'GUESTS': {
        needed: [
          'اسم الضيف (name)',
          'وظيفة الضيف (title)',
          'رقم الضيف (phone)',
          'السيرة الذاتية (bio)',
        ],
        table: allTables.find(t => t.table_name === 'guests'),
      },
      'USERS': {
        needed: [
          'اسم الموظف (name)',
          'البريد الإلكتروني (email)',
          'الوظيفة (role_id)',
          'أيام الدوام (work_days)',
          'ساعات الدوام (start_time, end_time)',
        ],
        table: allTables.find(t => t.table_name === 'users'),
      },
      'DESKS': {
        needed: [
          'اسم الديسك (name)',
          'وصف الديسك (description)',
          'مسؤول الديسك (manager_id)',
        ],
        table: allTables.find(t => t.table_name === 'desks'),
      },
      'TEAMS': {
        needed: [
          'اسم الفريق (name)',
          'الديسك التابع له (desk_id)',
          'مسؤول الفريق (manager_id)',
          'أعضاء الفريق (via team_users)',
        ],
        table: allTables.find(t => t.table_name === 'teams'),
      },
      'EDITORIAL_POLICIES': {
        needed: [
          'اسم السياسة (name)',
          'الوحدة الإعلامية (media_unit_id)',
          'وصف السياسة (description)',
          'قواعد السياسة (rules)',
          'هل السياسة نشطة (is_active)',
        ],
        table: allTables.find(t => t.table_name === 'editorial_policies'),
      },
    };

    for (const [key, req] of Object.entries(requirements)) {
      console.log(`\n📌 ${key}:`);
      console.log('─'.repeat(80));
      
      if (!req.table) {
        console.log('  ❌ TABLE NOT FOUND\n');
        continue;
      }

      const existingColumns = req.table.columns.map(c => c.column_name);
      
      req.needed.forEach(need => {
        const columnName = need.match(/\((.*?)\)/)?.[1];
        if (columnName && existingColumns.includes(columnName)) {
          console.log(`  ✅ ${need}`);
        } else if (columnName) {
          console.log(`  ❌ ${need}`);
        } else {
          console.log(`  ⚠️  ${need}`);
        }
      });
    }

    // Check for junction/bridge tables
    console.log('\n\n========== JUNCTION TABLES (Many-to-Many) ==========\n');
    const junctionTables = allTables.filter(t => 
      t.columns.length <= 3 && 
      t.columns.every(c => c.data_type === 'bigint' || c.column_name.includes('_id'))
    );

    junctionTables.forEach(table => {
      console.log(`📌 ${table.table_name}`);
      console.log(`   Columns: ${table.columns.map(c => c.column_name).join(', ')}`);
      console.log('');
    });

    // Check for tables that might contain schedule/timing info
    console.log('\n========== TABLES WITH TIMING/SCHEDULE INFO ==========\n');
    const timingTables = allTables.filter(t => 
      t.columns.some(c => 
        c.column_name.includes('time') || 
        c.column_name.includes('date') ||
        c.column_name.includes('schedule') ||
        c.column_name.includes('start') ||
        c.column_name.includes('end')
      )
    );

    timingTables.forEach(table => {
      const timingCols = table.columns.filter(c =>
        c.column_name.includes('time') || 
        c.column_name.includes('date') ||
        c.column_name.includes('schedule') ||
        c.column_name.includes('start') ||
        c.column_name.includes('end')
      );
      console.log(`📌 ${table.table_name}`);
      timingCols.forEach(col => {
        console.log(`   • ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    });

    // Check for tables with user/person references
    console.log('\n========== TABLES WITH USER/PERSON REFERENCES ==========\n');
    const userRefTables = allTables.filter(t =>
      t.columns.some(c => 
        c.column_name.includes('user_id') ||
        c.column_name.includes('_by') ||
        c.column_name.includes('presenter') ||
        c.column_name.includes('producer') ||
        c.column_name.includes('manager') ||
        c.column_name.includes('assigned')
      )
    );

    userRefTables.forEach(table => {
      const userCols = table.columns.filter(c =>
        c.column_name.includes('user_id') ||
        c.column_name.includes('_by') ||
        c.column_name.includes('presenter') ||
        c.column_name.includes('producer') ||
        c.column_name.includes('manager') ||
        c.column_name.includes('assigned')
      );
      console.log(`📌 ${table.table_name}`);
      userCols.forEach(col => {
        console.log(`   • ${col.column_name} (${col.data_type})`);
      });
      console.log('');
    });

    console.log('\n========== ANALYSIS COMPLETE ==========\n');

  } catch (error) {
    console.error('Error analyzing database:', error);
  } finally {
    await pool.end();
  }
};

comprehensiveAnalysis();
