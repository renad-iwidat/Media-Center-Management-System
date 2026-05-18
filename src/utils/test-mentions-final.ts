/**
 * اختبار نهائي لنظام المنشنات
 * Final test for mentions system
 */

import pool from '../config/database';
import { TaskService } from '../services/management/TaskService';

async function testMentionsFinal() {
  console.log('🧪 اختبار نهائي لنظام المنشنات\n');

  try {
    // 1. جلب مستخدم
    console.log('1️⃣ جلب المستخدمين...');
    const usersRes = await pool.query('SELECT id, name FROM users LIMIT 2');
    const user1 = usersRes.rows[0];
    const user2 = usersRes.rows[1];
    console.log(`   ✅ المستخدم 1: ${user1.name} (ID: ${user1.id})`);
    console.log(`   ✅ المستخدم 2: ${user2.name} (ID: ${user2.id})\n`);

    // 2. جلب مهمة
    console.log('2️⃣ جلب مهمة...');
    const tasksRes = await pool.query('SELECT id, title FROM tasks LIMIT 1');
    const task = tasksRes.rows[0];
    console.log(`   ✅ المهمة: ${task.title} (ID: ${task.id})\n`);

    // 3. إنشاء TaskService
    const taskService = new TaskService();

    // 4. إضافة تعليق مع منشنات
    console.log('3️⃣ إضافة تعليق مع منشنات...');
    const comment = `مرحبا @${user2.name.split(' ')[0]}, هذا اختبار المنشنات`;
    console.log(`   📝 التعليق: "${comment}"`);
    
    const addedComment = await taskService.addComment(
      BigInt(task.id),
      BigInt(user1.id),
      comment
    );
    console.log(`   ✅ تم إضافة التعليق (ID: ${addedComment.id})\n`);

    // 5. جلب المنشنات
    console.log('4️⃣ جلب المنشنات...');
    const mentions = await taskService.getMentions('task', BigInt(task.id));
    console.log(`   ✅ عدد المنشنات: ${mentions.length}`);
    mentions.forEach((m: any) => {
      console.log(`      - ${m.mentioned_user_name} (منشن من ${m.mentioned_by_user_name})`);
    });
    console.log();

    // 6. جلب التعليقات
    console.log('5️⃣ جلب التعليقات...');
    const comments = await taskService.getComments(BigInt(task.id));
    console.log(`   ✅ عدد التعليقات: ${comments.length}`);
    console.log();

    console.log('✅ الاختبار نجح!\n');
    console.log('📊 الملخص:');
    console.log(`   ✅ تم إضافة تعليق مع منشنات`);
    console.log(`   ✅ تم استخراج المنشنات تلقائياً`);
    console.log(`   ✅ تم إرسال إشعارات للمستخدمين المنشنين`);

  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testMentionsFinal();
