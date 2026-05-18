import pool from '../config/database';

async function test() {
  try {
    // Check basic count
    const total = await pool.query(`SELECT COUNT(*) as c FROM content`);
    console.log(`📊 Total content: ${total.rows[0].c}`);

    const archived = await pool.query(`SELECT COUNT(*) as c FROM content WHERE is_archived = true`);
    console.log(`📦 Archived: ${archived.rows[0].c}`);

    // Test the query that ContentService uses
    const sql = `
      SELECT 
        c.*,
        ct.name as content_type_name,
        u.name as created_by_name,
        mu.name as media_unit_name,
        o.title as order_title,
        d.name as desk_name,
        p.title as program_name,
        COUNT(DISTINCT cta.task_id) as reuse_count
      FROM content c
      LEFT JOIN content_types ct ON c.content_type_id = ct.id
      LEFT JOIN users u ON c.created_by = u.id
      LEFT JOIN media_units mu ON c.media_unit_id = mu.id
      LEFT JOIN content_tasks cta ON c.id = cta.content_id AND cta.usage_type = 'reuse'
      LEFT JOIN tasks t ON c.task_id = t.id
      LEFT JOIN orders o ON t.order_id = o.id
      LEFT JOIN desks d ON o.desk_id = d.id
      LEFT JOIN programs p ON o.program_id = p.id
      WHERE c.is_archived = true
      GROUP BY c.id, ct.id, u.id, mu.id, o.id, d.id, p.id
      ORDER BY c.created_at DESC
      LIMIT 5
    `;

    const result = await pool.query(sql);
    console.log(`\n✅ Query returned ${result.rows.length} rows`);
    console.log('\nFirst row sample:');
    console.log(JSON.stringify(result.rows[0], null, 2));
  } catch (err: any) {
    console.error('❌ Query failed:', err.message);
  } finally {
    await pool.end();
  }
}

test();
