import { Pool, PoolClient } from 'pg';
import { environment } from './environment';

/**
 * PostgreSQL Connection Pool
 * إدارة الاتصالات مع قاعدة البيانات
 */
const pool = new Pool({
  connectionString: environment.DATABASE_URL,
  max: 10, // عدد الاتصالات المتزامنة
  // مهم: نخلي الـ pool يسكّر الاتصال الخامل قبل ما Render يقطعه من جهته
  // (Render بيقطع الاتصالات الخاملة، فلو خلّيناها طويلة بيتسلّم اتصال "ميت" للطلب التالي)
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 30000, // وقت انتظار الحصول على اتصال
  statement_timeout: 60000, // وقت انتظار تنفيذ الاستعلام
  query_timeout: 60000, // وقت انتظار الاستعلام
  keepAlive: true, // حافظ على الاتصال حياً (TCP keepalive)
  keepAliveInitialDelayMillis: 10000,
  allowExitOnIdle: false,
  // SSL مطلوب على Render — صريح لتفادي مشاكل الشهادات
  ssl: environment.DATABASE_URL.includes('render.com')
    ? { rejectUnauthorized: false }
    : undefined,
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
 * تنفيذ query مع retry محسن
 */
export async function query(text: string, params?: any[]): Promise<any> {
  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ خطأ في تنفيذ Query (محاولة ${attempt}/${maxRetries}):`, error);
      
      // تحقق من نوع الخطأ
      if (error.code === 'ENOTFOUND') {
        console.error('🌐 مشكلة في DNS - تحقق من الاتصال بالإنترنت');
      } else if (error.code === 'ECONNREFUSED') {
        console.error('🔒 رفض الاتصال - تحقق من حالة قاعدة البيانات');
      } else if (error.message?.includes('timeout')) {
        console.error('⏱️ انتهت مهلة الانتظار - الشبكة بطيئة');
      }
      
      // انتظر قبل المحاولة التالية (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        console.log(`⏳ انتظار ${delay}ms قبل المحاولة التالية...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // إذا فشلت كل المحاولات، اطبع نصائح للحل
  console.error('\n🔍 نصائح لحل مشكلة قاعدة البيانات:');
  console.error('1. تحقق من حالة قاعدة البيانات في Render Dashboard');
  console.error('2. جرب تشغيل: node test-db-connection.js');
  console.error('3. تحقق من الاتصال بالإنترنت');
  console.error('4. جرب إيقاف VPN إذا كنت تستخدمه');

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
