/**
 * مزامنة المرفقات الموجودة مع الأرشيف الذكي
 * - يجلب كل المهام والأوردرات اللي حالتها "منجز/Done"
 * - يأرشف مرفقاتها اللي مش مؤرشفة بعد
 */

import pool from '../config/database';
import { TaskAutomationService } from '../services/management/TaskAutomationService';

async function syncArchive() {
  console.log('🔄 بدء مزامنة الأرشيف الذكي...\n');

  try {
    // 1) المهام المنجزة
    const doneTasks = await pool.query(
      `SELECT t.id, t.title 
       FROM tasks t
       JOIN task_statuses ts ON t.status_id = ts.id
       WHERE ts.name IN ('Done', 'منجز', 'مكتمل', 'Completed')`
    );

    console.log(`📋 وجدت ${doneTasks.rows.length} مهمة منجزة\n`);

    let totalArchived = 0;
    for (const task of doneTasks.rows) {
      const before = await pool.query(
        `SELECT COUNT(*) as count FROM content 
         WHERE owner_type = 'task_attachment' AND task_id = $1`,
        [task.id]
      );

      await TaskAutomationService.archiveTaskAttachments(BigInt(task.id));

      const after = await pool.query(
        `SELECT COUNT(*) as count FROM content 
         WHERE owner_type = 'task_attachment' AND task_id = $1`,
        [task.id]
      );

      const newCount = parseInt(after.rows[0].count) - parseInt(before.rows[0].count);
      if (newCount > 0) {
        console.log(`✅ المهمة "${task.title}" → ${newCount} مرفق جديد للأرشيف`);
        totalArchived += newCount;
      }
    }

    console.log(`\n📦 تم أرشفة ${totalArchived} مرفق إجمالاً`);

    // 2) إحصائيات الأرشيف
    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_archived = true) as archived,
        COUNT(*) FILTER (WHERE owner_type = 'task_attachment') as from_attachments
       FROM content`
    );

    console.log('\n📊 إحصائيات الأرشيف:');
    console.log(`   إجمالي المحتوى: ${stats.rows[0].total}`);
    console.log(`   مؤرشف: ${stats.rows[0].archived}`);
    console.log(`   من المرفقات: ${stats.rows[0].from_attachments}`);

    console.log('\n✅ المزامنة اكتملت بنجاح!');
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

syncArchive();
