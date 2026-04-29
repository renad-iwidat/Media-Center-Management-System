import pool from '../config/database';

async function checkOrderDates() {
  try {
    console.log('🔍 جاري فحص تنسيق التواريخ في الأوردرات...\n');

    const result = await pool.query(
      `SELECT 
        o.id,
        o.title,
        o.deadline,
        o.created_at,
        o.deadline::text as deadline_text,
        o.created_at::text as created_at_text
       FROM orders o
       LIMIT 3`
    );

    result.rows.forEach((row, idx) => {
      console.log(`${idx + 1}. ${row.title}`);
      console.log(`   - deadline (raw): ${row.deadline}`);
      console.log(`   - deadline (text): ${row.deadline_text}`);
      console.log(`   - created_at (raw): ${row.created_at}`);
      console.log(`   - created_at (text): ${row.created_at_text}\n`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

checkOrderDates();
