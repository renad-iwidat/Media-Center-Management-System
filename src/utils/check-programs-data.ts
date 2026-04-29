import pool from '../config/database';

async function checkProgramsData() {
  try {
    console.log('🔍 جاري التحقق من جدول البرامج...\n');

    // 1. التحقق من وجود الجدول
    console.log('1️⃣ التحقق من وجود جدول programs:');
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'programs'
      )`
    );
    console.log(`   ✅ الجدول موجود: ${tableCheck.rows[0].exists}\n`);

    // 2. التحقق من عدد السجلات
    console.log('2️⃣ عدد السجلات في جدول programs:');
    const countResult = await pool.query('SELECT COUNT(*) as count FROM programs');
    const count = countResult.rows[0].count;
    console.log(`   📊 عدد البرامج: ${count}\n`);

    // 3. عرض هيكل الجدول
    console.log('3️⃣ هيكل جدول programs:');
    const schemaResult = await pool.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_name = 'programs'
       ORDER BY ordinal_position`
    );
    console.log('   الأعمدة:');
    schemaResult.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log();

    // 4. عرض عينة من البيانات
    if (count > 0) {
      console.log('4️⃣ عينة من البيانات:');
      const dataResult = await pool.query(
        'SELECT * FROM programs LIMIT 5'
      );
      console.log('   البيانات:');
      dataResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`);
      });
      console.log();
    } else {
      console.log('4️⃣ لا توجد بيانات في جدول programs\n');
    }

    // 5. التحقق من الـ Query في ProgramModel
    console.log('5️⃣ اختبار Query من ProgramModel:');
    const queryTest = await pool.query(
      'SELECT * FROM programs ORDER BY title ASC LIMIT $1 OFFSET $2',
      [10, 0]
    );
    console.log(`   ✅ Query نجح - عدد النتائج: ${queryTest.rows.length}\n`);

    // 6. التحقق من الـ JOIN مع media_units
    console.log('6️⃣ اختبار Query مع JOIN (من ProgramService):');
    const joinTest = await pool.query(
      `SELECT p.*, m.name as media_unit_name
       FROM programs p LEFT JOIN media_units m ON p.media_unit_id = m.id
       ORDER BY p.created_at DESC`
    );
    console.log(`   ✅ Query نجح - عدد النتائج: ${joinTest.rows.length}`);
    if (joinTest.rows.length > 0) {
      console.log(`   عينة: ${JSON.stringify(joinTest.rows[0], null, 2)}\n`);
    } else {
      console.log('   لا توجد بيانات\n');
    }

    // 7. التحقق من الـ Query مع program_roles
    console.log('7️⃣ اختبار Query مع program_roles (من ProgramService):');
    if (count > 0) {
      const firstProgram = await pool.query('SELECT id FROM programs LIMIT 1');
      const programId = firstProgram.rows[0].id;
      
      const rolesTest = await pool.query(
        `SELECT pr.*, r.name as role_name, u.name as user_name, u.email
         FROM program_roles pr
         INNER JOIN roles r ON pr.role_id = r.id
         INNER JOIN users u ON pr.user_id = u.id
         WHERE pr.program_id = $1 ORDER BY r.name`,
        [programId]
      );
      console.log(`   ✅ Query نجح - عدد الأدوار: ${rolesTest.rows.length}\n`);
    } else {
      console.log('   لا توجد برامج للاختبار\n');
    }

    console.log('✅ انتهى الفحص بنجاح!');
    process.exit(0);
  } catch (error) {
    console.error('❌ خطأ:', error);
    process.exit(1);
  }
}

checkProgramsData();
