import pool from '../src/config/database';
import { TaskAutomationService } from '../src/services/management/TaskAutomationService';

async function testArchiveFlow() {
  try {
    console.log('🧪 Testing archive flow for attachments...\n');

    // Get a task with attachments that has content entries
    const taskResult = await pool.query(`
      SELECT DISTINCT t.id, t.title, t.status_id, ts.name as status_name
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE EXISTS (
        SELECT 1 FROM task_attachments ta
        WHERE ta.task_id = t.id
        AND EXISTS (
          SELECT 1 FROM content c
          WHERE c.owner_type = 'task_attachment'
          AND c.owner_id = ta.id
        )
      )
      ORDER BY t.id DESC
      LIMIT 1
    `);

    if (taskResult.rows.length === 0) {
      console.log('❌ No tasks with attachments and content entries found');
      process.exit(1);
    }

    const task = taskResult.rows[0];
    console.log(`📋 Task: ${task.id} - ${task.title}`);
    console.log(`   Status: ${task.status_name}\n`);

    // Get content entries for this task's attachments
    const contentResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived, c.archived_at
      FROM content c
      WHERE c.owner_type = 'task_attachment'
      AND c.owner_id IN (
        SELECT id FROM task_attachments WHERE task_id = $1
      )
    `, [task.id]);

    console.log(`📄 Content entries (${contentResult.rows.length}):`);
    contentResult.rows.forEach(c => {
      console.log(`   - ${c.id}: ${c.title}`);
      console.log(`     Archived: ${c.is_archived}, At: ${c.archived_at}`);
    });

    // Now simulate task completion by calling markTaskContentAsFinal
    console.log(`\n🔄 Simulating task completion (calling markTaskContentAsFinal)...`);
    
    await TaskAutomationService.markTaskContentAsFinal(BigInt(task.id));

    console.log(`✅ markTaskContentAsFinal completed\n`);

    // Check if content is now archived
    console.log('🔍 Checking if content is archived...');
    
    const archivedResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived, c.archived_at
      FROM content c
      WHERE c.owner_type = 'task_attachment'
      AND c.owner_id IN (
        SELECT id FROM task_attachments WHERE task_id = $1
      )
    `, [task.id]);

    console.log(`\n📄 Content entries after archiving:`);
    archivedResult.rows.forEach(c => {
      console.log(`   - ${c.id}: ${c.title}`);
      console.log(`     Archived: ${c.is_archived}, At: ${c.archived_at}`);
    });

    // Check if they appear in the archive query
    console.log(`\n🔍 Checking if content appears in archive query...`);
    
    const archiveQueryResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived
      FROM content c
      WHERE c.is_archived = true
      AND c.owner_type = 'task_attachment'
      AND c.owner_id IN (
        SELECT id FROM task_attachments WHERE task_id = $1
      )
    `, [task.id]);

    if (archiveQueryResult.rows.length > 0) {
      console.log(`✅ Content appears in archive query:`);
      archiveQueryResult.rows.forEach(c => {
        console.log(`   - ${c.id}: ${c.title}`);
      });
    } else {
      console.log(`❌ Content does NOT appear in archive query`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

testArchiveFlow();
