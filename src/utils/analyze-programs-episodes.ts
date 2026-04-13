import { getPool } from '../config/database';

const analyzeTablesStructure = async () => {
  const pool = getPool();

  try {
    console.log('\n========== DETAILED TABLE ANALYSIS ==========\n');

    // Get programs table structure
    console.log('📋 PROGRAMS TABLE STRUCTURE:');
    console.log('─'.repeat(60));
    const programsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'programs'
      ORDER BY ordinal_position
    `);

    console.log('Columns:');
    programsResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable} | Default: ${col.column_default || 'None'}`);
    });

    // Get episodes table structure
    console.log('\n📋 EPISODES TABLE STRUCTURE:');
    console.log('─'.repeat(60));
    const episodesResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'episodes'
      ORDER BY ordinal_position
    `);

    console.log('Columns:');
    episodesResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable} | Default: ${col.column_default || 'None'}`);
    });

    // Get guests table structure
    console.log('\n📋 GUESTS TABLE STRUCTURE:');
    console.log('─'.repeat(60));
    const guestsResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'guests'
      ORDER BY ordinal_position
    `);

    console.log('Columns:');
    guestsResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable} | Default: ${col.column_default || 'None'}`);
    });

    // Get users table structure (for reference)
    console.log('\n📋 USERS TABLE STRUCTURE (for reference):');
    console.log('─'.repeat(60));
    const usersResult = await pool.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('Columns:');
    usersResult.rows.forEach(col => {
      console.log(`  • ${col.column_name.padEnd(20)} | ${col.data_type.padEnd(15)} | Nullable: ${col.is_nullable} | Default: ${col.column_default || 'None'}`);
    });

    // Check relationships using PostgreSQL syntax
    console.log('\n🔗 RELATIONSHIPS (Foreign Keys):');
    console.log('─'.repeat(60));
    
    const constraintsResult = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS referenced_table_name,
        ccu.column_name AS referenced_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('programs', 'episodes', 'guests')
      ORDER BY tc.table_name
    `);

    if (constraintsResult.rows.length > 0) {
      constraintsResult.rows.forEach(constraint => {
        console.log(`  • ${constraint.table_name}.${constraint.column_name} → ${constraint.referenced_table_name}.${constraint.referenced_column_name}`);
      });
    } else {
      console.log('  No foreign key constraints found');
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('─'.repeat(60));
    console.log('\nPROGRAMS has:');
    programsResult.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name}`);
    });

    console.log('\nEPISODES has:');
    episodesResult.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name}`);
    });

    console.log('\nGUESTS has:');
    guestsResult.rows.forEach(col => {
      console.log(`  ✓ ${col.column_name}`);
    });

    console.log('\n========== ANALYSIS COMPLETE ==========\n');

  } catch (error) {
    console.error('Error analyzing tables:', error);
  } finally {
    await pool.end();
  }
};

analyzeTablesStructure();
