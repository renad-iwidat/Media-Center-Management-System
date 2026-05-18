import pool from '../config/database';

async function check() {
  try {
    const cols = await pool.query(
      `SELECT table_name, column_name FROM information_schema.columns 
       WHERE table_name IN ('programs', 'desks') ORDER BY table_name, ordinal_position`
    );
    console.log('📋 Columns:');
    cols.rows.forEach(r => console.log(`   ${r.table_name}.${r.column_name}`));

    const programs = await pool.query('SELECT * FROM programs LIMIT 2');
    console.log('\n📺 Programs sample:');
    console.log(JSON.stringify(programs.rows, null, 2));

    const desks = await pool.query('SELECT * FROM desks LIMIT 2');
    console.log('\n🏢 Desks sample:');
    console.log(JSON.stringify(desks.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
