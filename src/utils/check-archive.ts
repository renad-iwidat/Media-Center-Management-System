import pool from '../config/database';

async function check() {
  try {
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_archived = true) as archived,
        COUNT(*) FILTER (WHERE owner_type = 'task_attachment') as from_attachments
       FROM content`
    );

    console.log('📊 إحصائيات الأرشيف:');
    console.log(`   إجمالي المحتوى: ${stats.rows[0].total}`);
    console.log(`   مؤرشف: ${stats.rows[0].archived}`);
    console.log(`   من المرفقات: ${stats.rows[0].from_attachments}`);

    const recent = await pool.query(
      `SELECT id, title, owner_type, task_id, is_archived, archived_at, cloud_url 
       FROM content 
       WHERE is_archived = true 
       ORDER BY archived_at DESC 
       LIMIT 5`
    );
    console.log('\n📋 آخر 5 محتويات مؤرشفة:');
    console.log(JSON.stringify(recent.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
