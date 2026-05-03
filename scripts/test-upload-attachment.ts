import pool from '../src/config/database';
import fs from 'fs';
import path from 'path';

async function testUploadAttachment() {
  try {
    console.log('🧪 Testing attachment upload with content creation...\n');

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

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for attachment upload');

    // Simulate file upload using the TaskService
    const { TaskService } = await import('../src/services/management/TaskService');
    const taskService = new TaskService();

    console.log('📤 Uploading attachment...');
    
    // For testing, we'll just create the attachment directly
    const attachment = await pool.query(`
      INSERT INTO task_attachments (task_id, file_url, file_type, uploaded_by, title, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      task.id,
      'https://media-center-management-system.s3.eu-north-1.amazonaws.com/tasks/' + task.id + '/test-file.txt',
      'text/plain',
      74, // user_id
      'Test Attachment',
      'This is a test attachment'
    ]);

    console.log(`✅ Attachment created: ${attachment.rows[0].id}\n`);

    // Now check if content entry was created
    // Note: In the real flow, this would be done by TaskService.addAttachment
    // But since we're testing directly, we need to simulate it

    console.log('🔍 Checking for content entry...');
    
    const contentResult = await pool.query(`
      SELECT c.id, c.title, c.owner_type, c.owner_id
      FROM content c
      WHERE c.owner_type = 'task_attachment' 
      AND c.owner_id = $1
    `, [attachment.rows[0].id]);

    if (contentResult.rows.length > 0) {
      console.log(`✅ Content entry found: ${contentResult.rows[0].id}`);
      console.log(`   Title: ${contentResult.rows[0].title}`);
      console.log(`   Owner Type: ${contentResult.rows[0].owner_type}`);
      console.log(`   Owner ID: ${contentResult.rows[0].owner_id}`);
    } else {
      console.log(`❌ No content entry found for attachment`);
      console.log(`   This means the TaskService.addAttachment method needs to be called`);
    }

    // Clean up
    fs.unlinkSync(testFilePath);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUploadAttachment();
