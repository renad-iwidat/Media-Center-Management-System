/**
 * Diagnose DB — temporary script
 */
import { query, closePool } from '../../config/database';

async function main() {
  console.log('🔎 أعمدة media_units:');
  try {
    const r = await query(`SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns WHERE table_name='media_units' ORDER BY ordinal_position`);
    for (const row of r.rows) {
      console.log(`   ${row.column_name} ${row.data_type} nullable=${row.is_nullable} default=${row.column_default ?? ''}`);
    }
  } catch (e) { console.log('   ERROR:', e instanceof Error ? e.message : e); }

  await closePool();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
