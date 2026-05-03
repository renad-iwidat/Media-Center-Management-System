import pool from '../src/config/database';
import { TaskService } from '../src/services/management/TaskService';

async function testNewAttachmentFlow() {
  try {
    console.log('🧪 Testing new attachment flow with content creation...\n');

    // Get a task that is not Done
    const taskResult = await pool.query(`
      SELECT t.id, t.title, t.status_id, ts.name as status_name
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE ts.name != 'Done'
      ORDER BY t.id DESC
      LIMIT 1
    `);

    if (taskResult.rows.length === 0) {
      console.log('❌ No non-Done tasks found');
      process.exit(1);
    }

    const task = taskResult.rows[0];
    console.log(`📋 Task: ${task.id} - ${task.title}`);
    console.log(`   Status: ${task.status_name}\n`);

    // Create TaskService instance
    const taskService = new TaskService();

    console.log('📤 Calling TaskService.addAttachment...');
    
    // Call the new addAttachment method
    const attachment = await taskService.addAttachment(
      BigInt(task.id),
      BigInt(74), // user_id
      'https://media-center-management-system.s3.eu-north-1.amazonaws.com/tasks/' + task.id + '/test-file.txt',
      'text/plain',
      'Test Attachment from New Flow',
      'This is a test attachment using the new flow'
    );

    console.log(`✅ Attachment created: ${attachment.id}\n`);

    // Check if content entry was created
    console.log('🔍 Checking for content entry...');
    
    const contentResult = await pool.query(`
      SELECT c.id, c.title, c.owner_type, c.owner_id, c.task_id
      FROM content c
      WHERE c.owner_type = 'task_attachment' 
      AND c.owner_id = $1
    `, [attachment.id]);

    if (contentResult.rows.length > 0) {
      const content = contentResult.rows[0];
      console.log(`✅ Content entry found: ${content.id}`);
      console.log(`   Title: ${content.title}`);
      console.log(`   Owner Type: ${content.owner_type}`);
      console.log(`   Owner ID: ${content.owner_id}`);
      console.log(`   Task ID: ${content.task_id}`);

      // Check if content is linked to task
      const linkResult = await pool.query(`
        SELECT ct.content_id, ct.task_id, ct.usage_type, ct.linked_at
        FROM content_tasks ct
        WHERE ct.content_id = $1 AND ct.task_id = $2
      `, [content.id, task.id]);

      if (linkResult.rows.length > 0) {
        console.log(`\n✅ Content is linked to task:`);
        console.log(`   Content ID: ${linkResult.rows[0].content_id}`);
        console.log(`   Task ID: ${linkResult.rows[0].task_id}`);
        console.log(`   Usage Type: ${linkResult.rows[0].usage_type}`);
        console.log(`   Linked At: ${linkResult.rows[0].linked_at}`);
      } else {
        console.log(`\n❌ Content is NOT linked to task`);
      }
    } else {
      console.log(`❌ No content entry found for attachment`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

testNewAttachmentFlow();
