import { Pool, PoolClient } from 'pg';
import { environment } from './environment';

/**
 * PostgreSQL Connection Pool
 * إدارة الاتصالات مع قاعدة البيانات
 */
const pool = new Pool({
  connectionString: environment.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

pool.on('error', (err) => {
  console.error('❌ خطأ في Pool:', err);
});

/**
 * اختبار الاتصال بقاعدة البيانات
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح:', result.rows[0]);
    client.release();
  } catch (error) {
    console.error('❌ فشل الاتصال بقاعدة البيانات:', error);
    throw error;
  }
}

/**
 * تنفيذ query مع retry
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ خطأ في تنفيذ Query (محاولة ${attempt}/${maxRetries}):`, error);
      
      // انتظر قبل المحاولة التالية
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError;
}

/**
 * الحصول على client للعمليات المعقدة
 */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * إغلاق Pool
 */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;