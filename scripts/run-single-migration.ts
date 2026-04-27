import pool from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function run() {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: ts-node scripts/run-single-migration.ts <filename>');
    process.exit(1);
  }

  const filePath = path.join(__dirname, 'migrations', file);
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  try {
    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log('Running migration:', file);
    await pool.query(sql);
    console.log('Migration completed successfully');
  } catch (error: any) {
    console.error('Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

run();
