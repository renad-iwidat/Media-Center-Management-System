import pool from '../src/config/database';

async function findUsers() {
  try {
    const res = await pool.query(
      `SELECT id, name, email FROM users 
       WHERE name ILIKE '%حنين%' OR name ILIKE '%haneen%' OR name ILIKE '%بكر%' OR name ILIKE '%bakr%'
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

findUsers();
