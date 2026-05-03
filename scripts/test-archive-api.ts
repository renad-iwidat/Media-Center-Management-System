import pool from '../src/config/database';

async function testArchiveAPI() {
  try {
    console.log('🧪 Testing archive API query...\n');

    // Simulate the ContentPage API query
    const query = `
      SELECT 
        c.id,
        c.title,
        c.content_type_id,
        ct.name as content_type_name,
        c.created_by,
        u.name as created_by_name,
        c.tags,
        c.is_final,
        c.is_archived as archived,
        c.created_at,
        COUNT(DISTINCT cta.task_id) as reuse_count
      FROM content c
      LEFT JOIN content_types ct ON c.content_type_id = ct.id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN content_tasks cta ON c.id = cta.content_id AND cta.usage_type = 'reuse'
      WHERE c.is_archived = true
      GROUP BY c.id, c.title, c.content_type_id, ct.name, c.created_by, u.name, c.tags, c.is_final, c.is_archived, c.created_at
      ORDER BY c.created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    console.log(`📋 Archived content (${result.rows.length}):\n`);
    
    result.rows.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.title}`);
      console.log(`   ID: ${c.id}`);
      console.log(`   Type: ${c.content_type_name}`);
      console.log(`   Creator: ${c.created_by_name}`);
      console.log(`   Final: ${c.is_final}`);
      console.log(`   Reuse Count: ${c.reuse_count}`);
      console.log(`   Created: ${c.created_at}\n`);
    });

    // Check specifically for attachment-based content
    console.log('🔍 Checking for attachment-based content in archive...\n');
    
    const attachmentContentResult = await pool.query(`
      SELECT 
        c.id,
        c.title,
        c.owner_type,
        c.owner_id,
        ta.title as attachment_title,
        ta.file_url,
        c.is_archived
      FROM content c
      LEFT JOIN task_attachments ta ON c.owner_type = 'task_attachment' AND c.owner_id = ta.id
      WHERE c.owner_type = 'task_attachment'
      AND c.is_archived = true
      ORDER BY c.created_at DESC
      LIMIT 10
    `);

    if (attachmentContentResult.rows.length > 0) {
      console.log(`✅ Found ${attachmentContentResult.rows.length} archived attachment-based content:\n`);
      attachmentContentResult.rows.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.title}`);
        console.log(`   Content ID: ${c.id}`);
        console.log(`   Attachment ID: ${c.owner_id}`);
        console.log(`   Attachment Title: ${c.attachment_title}`);
        console.log(`   File URL: ${c.file_url}\n`);
      });
    } else {
      console.log(`❌ No archived attachment-based content found`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testArchiveAPI();
