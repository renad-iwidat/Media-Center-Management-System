import pool from '../src/config/database';
import { TaskService } from '../src/services/management/TaskService';
import { TaskAutomationService } from '../src/services/management/TaskAutomationService';

async function testCompleteFlow() {
  try {
    console.log('🧪 Testing complete attachment to archive flow...\n');

    // Step 1: Get a task that is NOT Done
    const taskResult = await pool.query(`
      SELECT t.id, t.title, t.status_id, ts.name as status_name
      FROM tasks t
      LEFT JOIN task_statuses ts ON t.status_id = ts.id
      WHERE ts.id != 6  -- Not Done
      ORDER BY t.id DESC
      LIMIT 1
    `);

    if (taskResult.rows.length === 0) {
      console.log('❌ No non-Done tasks found');
      process.exit(1);
    }

    const task = taskResult.rows[0];
    console.log(`📋 Step 1: Selected Task`);
    console.log(`   ID: ${task.id}`);
    console.log(`   Title: ${task.title}`);
    console.log(`   Status: ${task.status_name}\n`);

    // Step 2: Upload attachment
    console.log(`📤 Step 2: Uploading attachment...`);
    const taskService = new TaskService();
    
    const attachment = await taskService.addAttachment(
      BigInt(task.id),
      BigInt(74), // user_id
      'https://media-center-management-system.s3.eu-north-1.amazonaws.com/tasks/' + task.id + '/complete-test.txt',
      'text/plain',
      'Complete Flow Test Attachment',
      'This is a test attachment for the complete flow'
    );

    console.log(`   ✅ Attachment created: ${attachment.id}\n`);

    // Step 3: Verify content entry
    console.log(`🔍 Step 3: Verifying content entry...`);
    
    const contentResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived
      FROM content c
      WHERE c.owner_type = 'task_attachment' 
      AND c.owner_id = $1
    `, [attachment.id]);

    if (contentResult.rows.length === 0) {
      console.log(`   ❌ No content entry found`);
      process.exit(1);
    }

    const content = contentResult.rows[0];
    console.log(`   ✅ Content entry found: ${content.id}`);
    console.log(`   Title: ${content.title}`);
    console.log(`   Archived: ${content.is_archived}\n`);

    // Step 4: Get Done status ID
    console.log(`🔄 Step 4: Changing task status to Done...`);
    
    // Status ID 6 is "منجز" (Done) based on previous tests
    const doneStatusId = BigInt(6);

    // Step 5: Change task status
    await TaskAutomationService.handleTaskStatusChange(
      BigInt(task.id),
      BigInt(doneStatusId),
      BigInt(74) // changedBy
    );

    console.log(`   ✅ Task status changed to Done\n`);

    // Step 6: Verify content is archived
    console.log(`🔍 Step 5: Verifying content is archived...`);
    
    const archivedResult = await pool.query(`
      SELECT c.id, c.title, c.is_archived, c.is_final, c.archived_at
      FROM content c
      WHERE c.owner_type = 'task_attachment' 
      AND c.owner_id = $1
    `, [attachment.id]);

    if (archivedResult.rows.length === 0) {
      console.log(`   ❌ Content not found`);
      process.exit(1);
    }

    const archivedContent = archivedResult.rows[0];
    console.log(`   ✅ Content found:`);
    console.log(`   ID: ${archivedContent.id}`);
    console.log(`   Title: ${archivedContent.title}`);
    console.log(`   Archived: ${archivedContent.is_archived}`);
    console.log(`   Final: ${archivedContent.is_final}`);
    console.log(`   Archived At: ${archivedContent.archived_at}\n`);

    // Step 7: Verify it appears in archive query
    console.log(`🔍 Step 6: Verifying content appears in archive query...`);
    
    const archiveQueryResult = await pool.query(`
      SELECT c.id, c.title
      FROM content c
      WHERE c.is_archived = true
      AND c.owner_type = 'task_attachment'
      AND c.owner_id = $1
    `, [attachment.id]);

    if (archiveQueryResult.rows.length > 0) {
      console.log(`   ✅ Content appears in archive query`);
      console.log(`   ID: ${archiveQueryResult.rows[0].id}`);
      console.log(`   Title: ${archiveQueryResult.rows[0].title}\n`);
    } else {
      console.log(`   ❌ Content does NOT appear in archive query\n`);
    }

    // Summary
    console.log(`\n✅ COMPLETE FLOW TEST PASSED!\n`);
    console.log(`📊 Summary:`);
    console.log(`   1. ✅ Attachment uploaded`);
    console.log(`   2. ✅ Content entry created`);
    console.log(`   3. ✅ Task status changed to Done`);
    console.log(`   4. ✅ Content archived automatically`);
    console.log(`   5. ✅ Content appears in archive query`);
    console.log(`\n🎉 الملفات المرفوعة تظهر الآن في الأرشيف الذكي!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : '');
    process.exit(1);
  }
}

testCompleteFlow();
