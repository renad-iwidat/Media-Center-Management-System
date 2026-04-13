import { getPool } from '../config/database';

const applyDatabaseChanges = async () => {
  const pool = getPool();

  try {
    console.log('\n========== APPLYING DATABASE CHANGES ==========\n');

    // 1. Add air_time to PROGRAMS
    console.log('1️⃣  Adding air_time to PROGRAMS...');
    try {
      await pool.query(`
        ALTER TABLE programs ADD COLUMN air_time TIME;
      `);
      console.log('   ✅ air_time added to programs\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  air_time already exists in programs\n');
      } else {
        throw error;
      }
    }

    // 2. Add phone to GUESTS
    console.log('2️⃣  Adding phone to GUESTS...');
    try {
      await pool.query(`
        ALTER TABLE guests ADD COLUMN phone TEXT;
      `);
      console.log('   ✅ phone added to guests\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  phone already exists in guests\n');
      } else {
        throw error;
      }
    }

    // 3. Add work_days, start_time, end_time to USERS
    console.log('3️⃣  Adding schedule columns to USERS...');
    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN work_days TEXT;
      `);
      console.log('   ✅ work_days added to users');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  work_days already exists in users');
      } else {
        throw error;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN start_time TIME;
      `);
      console.log('   ✅ start_time added to users');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  start_time already exists in users');
      } else {
        throw error;
      }
    }

    try {
      await pool.query(`
        ALTER TABLE users ADD COLUMN end_time TIME;
      `);
      console.log('   ✅ end_time added to users\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  end_time already exists in users\n');
      } else {
        throw error;
      }
    }

    // 4. Create program_roles table
    console.log('4️⃣  Creating program_roles table...');
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS program_roles (
          id BIGSERIAL PRIMARY KEY,
          program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
          user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
      console.log('   ✅ program_roles table created\n');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ⚠️  program_roles table already exists\n');
      } else {
        throw error;
      }
    }

    // Verify changes
    console.log('========== VERIFYING CHANGES ==========\n');

    // Check PROGRAMS
    console.log('📋 PROGRAMS table columns:');
    const programsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'programs'
      ORDER BY ordinal_position
    `);
    programsResult.rows.forEach(row => {
      console.log(`   • ${row.column_name}`);
    });

    // Check GUESTS
    console.log('\n📋 GUESTS table columns:');
    const guestsResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'guests'
      ORDER BY ordinal_position
    `);
    guestsResult.rows.forEach(row => {
      console.log(`   • ${row.column_name}`);
    });

    // Check USERS
    console.log('\n📋 USERS table columns:');
    const usersResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    usersResult.rows.forEach(row => {
      console.log(`   • ${row.column_name}`);
    });

    // Check program_roles
    console.log('\n📋 PROGRAM_ROLES table columns:');
    const programRolesResult = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'program_roles'
      ORDER BY ordinal_position
    `);
    if (programRolesResult.rows.length > 0) {
      programRolesResult.rows.forEach(row => {
        console.log(`   • ${row.column_name}`);
      });
    } else {
      console.log('   (Table not found)');
    }

    console.log('\n========== ALL CHANGES APPLIED SUCCESSFULLY ==========\n');

  } catch (error) {
    console.error('Error applying database changes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

applyDatabaseChanges();
