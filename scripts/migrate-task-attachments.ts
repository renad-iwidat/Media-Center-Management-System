import pool from '../src/config/database';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Add title and description to task_attachments...');

    // Check if columns already exist
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'task_attachments' 
      AND column_name IN ('title', 'description')
    `);

    const existingColumns = checkResult.rows.map((r: any) => r.column_name);
    console.log('Existing columns:', existingColumns);

    // Add title column if it doesn't exist
    if (!existingColumns.includes('title')) {
      console.log('Adding title column...');
      await client.query(`
        ALTER TABLE task_attachments 
        ADD COLUMN title VARCHAR(255)
      `);
      console.log('✅ title column added');
    } else {
      console.log('⏭️  title column already exists');
    }

    // Add description column if it doesn't exist
    if (!existingColumns.includes('description')) {
      console.log('Adding description column...');
      await client.query(`
        ALTER TABLE task_attachments 
        ADD COLUMN description TEXT
      `);
      console.log('✅ description column added');
    } else {
      console.log('⏭️  description column already exists');
    }

    console.log('✅ Migration completed successfully');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
