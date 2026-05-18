import pool from '../config/database';

/**
 * Migration: Add mentions table for tracking @mentions in comments
 * Tracks who mentioned whom and in which comment
 */
export async function addMentionsTable() {
  try {
    console.log('📝 Creating mentions table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS mentions (
        id BIGSERIAL PRIMARY KEY,
        comment_id BIGINT NOT NULL,
        mentioned_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        mentioned_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        entity_type VARCHAR(50) NOT NULL, -- 'task' or 'order'
        entity_id BIGINT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Foreign key to comments (will be added after comment table exists)
        CONSTRAINT fk_mentions_comment FOREIGN KEY (comment_id) 
          REFERENCES task_comments(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Mentions table created successfully');

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_mentions_mentioned_user 
      ON mentions(mentioned_user_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_mentions_entity 
      ON mentions(entity_type, entity_id);
    `);

    console.log('✅ Indexes created for mentions table');

  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Mentions table already exists');
    } else {
      console.error('❌ Error creating mentions table:', error.message);
      throw error;
    }
  }
}

// Run migration
addMentionsTable().catch(console.error);
