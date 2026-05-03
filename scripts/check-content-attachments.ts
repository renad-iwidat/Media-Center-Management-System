import pool from '../src/config/database';

async function check() {
  try {
    console.log('Checking latest task with attachments...\n');

    // Get the latest task with attachments
    const latestTaskResult = await pool.query(`
      SELECT DISTINCT t.id, t.title, t.status_id, t.completed_at
      FROM tasks t
      JOIN task_attachments ta ON t.id = ta.task_id
      ORDER BY t.id DESC
      LIMIT 1
    `);

    if (latestTaskResult.rows.length === 0) {
      console.log('❌ No tasks with attachments found');
      await pool.end();
      return;
    }

    const taskId = latestTaskResult.rows[0].id;
    console.log(`📋 Latest Task: ${taskId} (${latestTaskResult.rows[0].title})`);
    console.log(`   Status ID: ${latestTaskResult.rows[0].status_id}`);
    console.log(`   Completed At: ${latestTaskResult.rows[0].completed_at}\n`);

    // Check content linked to this task
    const contentResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived, c.is_final, c.archived_at
      FROM content c
      JOIN content_tasks ct ON c.id = ct.content_id
      WHERE ct.task_id = $1
    `, [taskId]);

    console.log('📄 Content linked to this task:');
    if (contentResult.rows.length === 0) {
      console.log('  ❌ No content linked to this task');
    } else {
      contentResult.rows.forEach((row: any) => {
        console.log(`  - ID: ${row.id}, Title: ${row.title}`);
        console.log(`    Archived: ${row.is_archived}, Final: ${row.is_final}`);
        console.log(`    Archived At: ${row.archived_at}`);
      });
    }

    console.log('\n📎 Attachments for this task:');
    const attachmentsResult = await pool.query(`
      SELECT id, file_url, file_type, uploaded_by, created_at, title, description
      FROM task_attachments
      WHERE task_id = $1
    `, [taskId]);

    if (attachmentsResult.rows.length === 0) {
      console.log('  ❌ No attachments for this task');
    } else {
      attachmentsResult.rows.forEach((row: any) => {
        console.log(`  - ID: ${row.id}`);
        console.log(`    Title: ${row.title || 'N/A'}`);
        console.log(`    Description: ${row.description || 'N/A'}`);
        console.log(`    File Type: ${row.file_type}`);
        console.log(`    Uploaded By: ${row.uploaded_by}`);
        console.log(`    Created At: ${row.created_at}`);
        console.log(`    URL: ${row.file_url.substring(0, 80)}...`);
      });
    }

    // Check task status name
    const statusResult = await pool.query(`
      SELECT name FROM task_statuses WHERE id = $1
    `, [latestTaskResult.rows[0].status_id]);

    console.log(`\n✅ Task Status: ${statusResult.rows[0]?.name || 'Unknown'}`);

  } catch (e: any) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

check();
