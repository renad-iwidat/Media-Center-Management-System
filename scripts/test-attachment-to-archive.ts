import pool from '../src/config/database';

async function testAttachmentToArchive() {
  try {
    console.log('🧪 Testing attachment to archive integration...\n');

    // Get the latest task with attachments
    const taskResult = await pool.query(`
      SELECT t.id, t.title, t.status_id, ts.name as status_name
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE EXISTS (SELECT 1 FROM task_attachments WHERE task_id = t.id)
      ORDER BY t.id DESC
      LIMIT 1
    `);

    if (taskResult.rows.length === 0) {
      console.log('❌ No tasks with attachments found');
      process.exit(1);
    }

    const task = taskResult.rows[0];
    console.log(`📋 Task: ${task.id} - ${task.title}`);
    console.log(`   Status: ${task.status_name}\n`);

    // Get attachments
    const attachmentsResult = await pool.query(`
      SELECT id, title, file_url
      FROM task_attachments
      WHERE task_id = $1
      ORDER BY created_at DESC
    `, [task.id]);

    console.log(`📎 Attachments (${attachmentsResult.rows.length}):`);
    attachmentsResult.rows.forEach(att => {
      console.log(`   - ${att.id}: ${att.title}`);
    });

    // Check if content entries exist for these attachments
    console.log('\n🔍 Checking for content entries...');
    
    for (const attachment of attachmentsResult.rows) {
      const contentResult = await pool.query(`
        SELECT c.id, c.title, c.is_archived, c.archived_at
        FROM content c
        WHERE c.owner_type = 'task_attachment' 
        AND c.owner_id = $1
      `, [attachment.id]);

      if (contentResult.rows.length > 0) {
        const content = contentResult.rows[0];
        console.log(`   ✅ Attachment ${attachment.id} has content entry:`);
        console.log(`      Content ID: ${content.id}`);
        console.log(`      Title: ${content.title}`);
        console.log(`      Archived: ${content.is_archived}`);
        console.log(`      Archived At: ${content.archived_at}`);
      } else {
        console.log(`   ❌ Attachment ${attachment.id} has NO content entry`);
      }
    }

    // Check if task is Done
    if (task.status_name === 'Done') {
      console.log('\n✅ Task is Done - content should be archived');
      
      // Check if content is archived
      const archivedResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM content c
        WHERE c.owner_type = 'task_attachment'
        AND c.owner_id IN (
          SELECT id FROM task_attachments WHERE task_id = $1
        )
        AND c.is_archived = true
      `, [task.id]);

      const archivedCount = parseInt(archivedResult.rows[0].count);
      console.log(`   Archived content: ${archivedCount}/${attachmentsResult.rows.length}`);
    } else {
      console.log(`\n⏳ Task is not Done yet (Status: ${task.status_name})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAttachmentToArchive();
