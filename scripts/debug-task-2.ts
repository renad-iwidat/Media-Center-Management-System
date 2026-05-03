import pool from '../src/config/database';

async function debugTask() {
  const taskId = 2;
  
  console.log(`\n📋 Task ${taskId} Debug:\n`);
  
  // Get task info
  const taskResult = await pool.query(
    `SELECT t.id, t.title, t.status_id, ts.name as status_name
     FROM tasks t
     LEFT JOIN task_statuses ts ON t.status_id = ts.id
     WHERE t.id = $1`,
    [taskId]
  );
  
  if (taskResult.rows.length === 0) {
    console.log('❌ Task not found');
    process.exit(1);
  }
  
  const task = taskResult.rows[0];
  console.log(`Task: ${task.title}`);
  console.log(`Status: ${task.status_name}\n`);
  
  // Get attachments
  const attachmentsResult = await pool.query(
    `SELECT id, title, file_url, created_at
     FROM task_attachments
     WHERE task_id = $1
     ORDER BY created_at DESC`,
    [taskId]
  );
  
  console.log(`📎 Attachments (${attachmentsResult.rows.length}):`);
  if (attachmentsResult.rows.length === 0) {
    console.log('  ❌ No attachments found');
  } else {
    attachmentsResult.rows.forEach(att => {
      console.log(`  - ID: ${att.id}, Title: ${att.title}`);
      console.log(`    URL: ${att.file_url}`);
      console.log(`    Created: ${att.created_at}`);
    });
  }
  
  // Get content entries for attachments
  console.log(`\n📄 Content entries for attachments:`);
  
  for (const att of attachmentsResult.rows) {
    const contentResult = await pool.query(
      `SELECT c.id, c.title, c.is_archived, c.archived_at, c.owner_type, c.owner_id
       FROM content c
       WHERE c.owner_type = 'task_attachment' AND c.owner_id = $1`,
      [att.id]
    );
    
    if (contentResult.rows.length === 0) {
      console.log(`  ❌ Attachment ${att.id}: NO content entry`);
    } else {
      const content = contentResult.rows[0];
      console.log(`  ✅ Attachment ${att.id}:`);
      console.log(`     Content ID: ${content.id}`);
      console.log(`     Title: ${content.title}`);
      console.log(`     Archived: ${content.is_archived}`);
      console.log(`     Archived At: ${content.archived_at}`);
    }
  }
  
  // Get content linked to task
  console.log(`\n📄 Content linked to task via content_tasks:`);
  
  const linkedContentResult = await pool.query(
    `SELECT c.id, c.title, c.is_archived, c.owner_type
     FROM content c
     JOIN content_tasks ct ON c.id = ct.content_id
     WHERE ct.task_id = $1`,
    [taskId]
  );
  
  if (linkedContentResult.rows.length === 0) {
    console.log('  ❌ No content linked to task');
  } else {
    linkedContentResult.rows.forEach(c => {
      console.log(`  - ID: ${c.id}, Title: ${c.title}, Archived: ${c.is_archived}, Type: ${c.owner_type}`);
    });
  }
  
  process.exit(0);
}

debugTask();
