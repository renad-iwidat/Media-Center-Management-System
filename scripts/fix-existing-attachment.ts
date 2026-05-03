import pool from '../src/config/database';
import { TaskAutomationService } from '../src/services/management/TaskAutomationService';

async function fixExistingAttachment() {
  try {
    console.log('🔧 Fixing existing attachment for task 2...\n');
    
    // Get the attachment
    const attachmentResult = await pool.query(
      `SELECT id, task_id, file_url, file_type, title, uploaded_by
       FROM task_attachments
       WHERE task_id = 2 AND id = 11`
    );
    
    if (attachmentResult.rows.length === 0) {
      console.log('❌ Attachment not found');
      process.exit(1);
    }
    
    const attachment = attachmentResult.rows[0];
    console.log(`📎 Found attachment:`);
    console.log(`   ID: ${attachment.id}`);
    console.log(`   Title: ${attachment.title}`);
    console.log(`   File URL: ${attachment.file_url}\n`);
    
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
    
    console.log(`📝 Creating content entry...`);
    
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
    console.log(`✅ Content entry created: ID ${contentId}\n`);
    
    // Link content to task
    console.log(`🔗 Linking content to task...`);
    
    await TaskAutomationService.handleContentLinking(
      BigInt(contentId),
      BigInt(attachment.task_id),
      'output',
      BigInt(attachment.uploaded_by),
      `Uploaded as attachment: ${attachment.title}`
    );
    
    console.log(`✅ Content linked to task\n`);
    
    // Now archive the content since task is Done
    console.log(`📦 Archiving content (task is Done)...`);
    
    await pool.query(
      `UPDATE content 
       SET is_archived = true, is_final = true, archived_at = NOW()
       WHERE id = $1`,
      [contentId]
    );
    
    console.log(`✅ Content archived\n`);
    
    // Verify
    console.log(`🔍 Verifying...`);
    
    const verifyResult = await pool.query(
      `SELECT c.id, c.title, c.is_archived, c.archived_at
       FROM content c
       WHERE c.owner_type = 'task_attachment' AND c.owner_id = $1`,
      [attachment.id]
    );
    
    if (verifyResult.rows.length > 0) {
      const content = verifyResult.rows[0];
      console.log(`✅ Content found in database:`);
      console.log(`   ID: ${content.id}`);
      console.log(`   Title: ${content.title}`);
      console.log(`   Archived: ${content.is_archived}`);
      console.log(`   Archived At: ${content.archived_at}`);
    }
    
    console.log(`\n✅ Fix completed successfully!`);
    console.log(`الملف الآن يظهر في الأرشيف الذكي!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixExistingAttachment();
