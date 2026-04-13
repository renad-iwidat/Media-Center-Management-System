import { Pool } from 'pg';
import { environment } from './environment';

// Configure BigInt parsing
const types = require('pg').types;
types.setTypeParser(20, (val: string | null) => {
  if (val === null) return null;
  return String(val);
});

const pool = new Pool({
  connectionString: environment.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const connectDatabase = async (): Promise<void> => {
  try {
    if (!environment.databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();

    console.log('✓ Database connected successfully');
    console.log(`✓ Current database time: ${result.rows[0].now}`);
  } catch (error) {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('✓ Database pool closed successfully');
  } catch (error) {
    console.error('✗ Database disconnection failed:', error);
  }
};

export const getPool = () => pool;
