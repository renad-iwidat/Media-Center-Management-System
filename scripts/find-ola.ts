import pool from '../src/config/database';

async function findOla() {
  try {
    const res = await pool.query(
      `SELECT id, name, email FROM users 
       WHERE name ILIKE '%علا%' OR name ILIKE '%ola%' OR email ILIKE '%ola%'
       ORDER BY name`
    );
    
    console.log('\n📋 المستخدمون المطابقون:\n');
    res.rows.forEach((user: any) => {
      console.log(`ID: ${user.id} | الاسم: ${user.name} | البريد: ${user.email}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

findOla();
