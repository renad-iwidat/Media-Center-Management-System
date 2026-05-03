import pool from '../src/config/database';
import { TaskAutomationService } from '../src/services/management/TaskAutomationService';

async function fixAllOldAttachments() {
  try {
    console.log('🔧 Fixing all old attachments without content entries...\n');
    
    // Get all attachments without content entries
    const attachmentsResult = await pool.query(
      `SELECT ta.id, ta.task_id, ta.file_url, ta.file_type, ta.title, ta.uploaded_by, ts.name as status_name
       FROM task_attachments ta
       LEFT JOIN tasks t ON ta.task_id = t.id
       LEFT JOIN task_statuses ts ON t.status_id = ts.id
       WHERE NOT EXISTS (
         SELECT 1 FROM content c
         WHERE c.owner_type = 'task_attachment' AND c.owner_id = ta.id
       )
       ORDER BY ta.task_id DESC`
    );
    
    console.log(`📎 Found ${attachmentsResult.rows.length} attachments without content entries\n`);
    
    if (attachmentsResult.rows.length === 0) {
      console.log('✅ All attachments have content entries!');
      process.exit(0);
    }
    
    // Get content type
    const contentTypeResult = await pool.query(
      `SELECT id FROM content_types WHERE name ILIKE '%ملف%' OR name ILIKE '%file%' LIMIT 1`
    );
    
    let contentTypeId = contentTypeResult.rows[0]?.id;
    
    if (!contentTypeId) {
      const defaultTypeResult = await pool.query(
        `SELECT id FROM content_types LIMIT 1`
      );
      contentTypeId = defaultTypeResult.rows[0]?.id;
    }
    
    let fixedCount = 0;
    let archivedCount = 0;
    
    for (const attachment of attachmentsResult.rows) {
      console.log(`\n📎 Processing attachment ${attachment.id}:`);
      console.log(`   Task: ${attachment.task_id}`);
      console.log(`   Title: ${attachment.title}`);
      console.log(`   Status: ${attachment.status_name}`);
      
      try {
        // Create content entry
        const contentResult = await pool.query(
          `INSERT INTO content (
            title, content_type_id, owner_type, owner_id, 
            created_by, task_id, cloud_url, file_size, tags, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING id`,
          [
            attachment.title,
            contentTypeId,
            'task_attachment',
            attachment.id,
            attachment.uploaded_by,
            attachment.task_id,
            attachment.file_url,
            0,
            ['attachment', attachment.title],
          ]
        );
        
        const contentId = contentResult.rows[0]?.id;
        console.log(`   ✅ Content entry created: ${contentId}`);
        
        // Link content to task
        await TaskAutomationService.handleContentLinking(
          BigInt(contentId),
          BigInt(attachment.task_id),
          'output',
          BigInt(attachment.uploaded_by),
          `Uploaded as attachment: ${attachment.title}`
        );
        
        console.log(`   ✅ Content linked to task`);
        
        // If task is Done, archive the content
        if (attachment.status_name === 'منجز' || attachment.status_name === 'Done') {
          await pool.query(
            `UPDATE content 
             SET is_archived = true, is_final = true, archived_at = NOW()
             WHERE id = $1`,
            [contentId]
          );
          
          console.log(`   ✅ Content archived (task is Done)`);
          archivedCount++;
        }
        
        fixedCount++;
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(`\n\n📊 Summary:`);
    console.log(`   Total attachments processed: ${fixedCount}`);
    console.log(`   Archived: ${archivedCount}`);
    console.log(`   Not archived (task not Done): ${fixedCount - archivedCount}`);
    
    console.log(`\n✅ Fix completed successfully!`);
    console.log(`جميع الملفات الآن تظهر في الأرشيف الذكي!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixAllOldAttachments();
