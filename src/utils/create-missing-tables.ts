import { getPool } from '../config/database';

const createMissingTables = async () => {
  const pool = getPool();

  try {
    console.log('\n📋 Creating missing tables...\n');

    // 1. Create employee_schedules table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employee_schedules (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        work_days TEXT COMMENT 'Comma-separated days: Saturday,Sunday,Monday',
        start_time TIME,
        end_time TIME,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ employee_schedules table created');

    // 2. Create program_details table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program_details (
        id BIGSERIAL PRIMARY KEY,
        program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        episode_count INTEGER,
        presenter_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        producer_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        air_time TIME,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ program_details table created');

    // 3. Create program_team_members table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS program_team_members (
        id BIGSERIAL PRIMARY KEY,
        program_id BIGINT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ program_team_members table created');

    // 4. Create episode_details table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS episode_details (
        id BIGSERIAL PRIMARY KEY,
        episode_id BIGINT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
        topic TEXT,
        script_url TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✓ episode_details table created');

    // 5. Add phone column to guests table if it doesn't exist
    const guestsTableCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'guests' AND column_name = 'phone'
    `);

    if (guestsTableCheck.rows.length === 0) {
      await pool.query(`
        ALTER TABLE guests ADD COLUMN phone TEXT;
      `);
      console.log('✓ phone column added to guests table');
    } else {
      console.log('✓ phone column already exists in guests table');
    }

    console.log('\n✓ All missing tables created successfully\n');

  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
};

createMissingTables();
