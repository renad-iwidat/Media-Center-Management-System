import pool from '../src/config/database';

async function seedTaskTypes() {
  try {
    console.log('🌱 Seeding task types...');

    // تحقق من وجود الجدول
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_types'
      )`
    );

    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating task_types table...');
      await pool.query(`
        CREATE TABLE IF NOT EXISTS task_types (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          category VARCHAR(50) NOT NULL,
          color VARCHAR(7),
          icon VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ task_types table created');
    }

    // تحقق من وجود البيانات
    const countResult = await pool.query('SELECT COUNT(*) as count FROM task_types');
    const count = parseInt(countResult.rows[0].count);

    if (count === 0) {
      console.log('📝 Inserting task types...');
      
      const taskTypes = [
        { name: 'تصوير', category: 'shooting', color: '#3b82f6', icon: '📹' },
        { name: 'اخبارية', category: 'reporting', color: '#a855f7', icon: '📰' },
        { name: 'أخرى', category: 'other', color: '#64748b', icon: '📋' }
      ];

      for (const type of taskTypes) {
        await pool.query(
          `INSERT INTO task_types (name, category, color, icon) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (name) DO NOTHING`,
          [type.name, type.category, type.color, type.icon]
        );
        console.log(`✅ Added: ${type.name}`);
      }

      console.log('✅ Task types seeded successfully');
    } else {
      console.log(`ℹ️  Task types already exist (${count} records)`);
    }

    // عرض البيانات
    const result = await pool.query('SELECT * FROM task_types ORDER BY id');
    console.log('\n📊 Current task types:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ Error seeding task types:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedTaskTypes();
