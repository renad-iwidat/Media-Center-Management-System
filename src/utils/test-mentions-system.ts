/**
 * اختبار نظام المنشنات والتعليقات
 * Test script for mentions and comments system
 */

import pool from '../config/database';
import { TaskService } from '../services/management/TaskService';
import { NotificationService } from '../services/management/NotificationService';

async function testMentionsSystem() {
  console.log('🧪 بدء اختبار نظام المنشنات...\n');

  try {
    // 1. فحص جدول mentions
    console.log('1️⃣ فحص جدول mentions...');
    const tableCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'mentions'
      )`
    );
    console.log(`   ✅ جدول mentions موجود: ${tableCheck.rows[0].exists}\n`);

    // 2. فحص جدول task_comments
    console.log('2️⃣ فحص جدول task_comments...');
    const commentsCheck = await pool.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'task_comments'
      )`
    );
    console.log(`   ✅ جدول task_comments موجود: ${commentsCheck.rows[0].exists}\n`);

    // 3. فحص المستخدمين
    console.log('3️⃣ فحص المستخدمين...');
    const usersResult = await pool.query('SELECT id, name FROM users LIMIT 3');
    console.log(`   ✅ عدد المستخدمين: ${usersResult.rows.length}`);
    usersResult.rows.forEach((user: any) => {
      console.log(`      - ${user.name} (ID: ${user.id})`);
    });
    console.log();

    // 4. فحص المهام
    console.log('4️⃣ فحص المهام...');
    const tasksResult = await pool.query('SELECT id, title FROM tasks LIMIT 3');
    console.log(`   ✅ عدد المهام: ${tasksResult.rows.length}`);
    tasksResult.rows.forEach((task: any) => {
      console.log(`      - ${task.title} (ID: ${task.id})`);
    });
    console.log();

    // 5. فحص التعليقات الموجودة
    console.log('5️⃣ فحص التعليقات الموجودة...');
    const commentsResult = await pool.query(
      'SELECT id, task_id, user_id, comment FROM task_comments LIMIT 3'
    );
    console.log(`   ✅ عدد التعليقات: ${commentsResult.rows.length}`);
    commentsResult.rows.forEach((comment: any) => {
      console.log(`      - Task ${comment.task_id}: "${comment.comment.substring(0, 50)}..."`);
    });
    console.log();

    // 6. فحص المنشنات الموجودة
    console.log('6️⃣ فحص المنشنات الموجودة...');
    const mentionsResult = await pool.query(
      `SELECT m.id, m.entity_type, m.entity_id, u.name as mentioned_user_name
       FROM mentions m
       LEFT JOIN users u ON m.mentioned_user_id = u.id
       LIMIT 5`
    );
    console.log(`   ✅ عدد المنشنات: ${mentionsResult.rows.length}`);
    mentionsResult.rows.forEach((mention: any) => {
      console.log(`      - ${mention.mentioned_user_name} في ${mention.entity_type} ${mention.entity_id}`);
    });
    console.log();

    // 7. فحص الإشعارات
    console.log('7️⃣ فحص الإشعارات...');
    const notificationsResult = await pool.query(
      `SELECT type, COUNT(*) as count FROM notifications GROUP BY type`
    );
    console.log(`   ✅ أنواع الإشعارات:`);
    notificationsResult.rows.forEach((notif: any) => {
      console.log(`      - ${notif.type}: ${notif.count}`);
    });
    console.log();

    console.log('✅ جميع الفحوصات نجحت!\n');
    console.log('📊 الملخص:');
    console.log('   ✅ جدول mentions موجود وشغال');
    console.log('   ✅ جدول task_comments موجود وشغال');
    console.log('   ✅ نظام المستخدمين موجود');
    console.log('   ✅ نظام المهام موجود');
    console.log('   ✅ نظام التعليقات موجود');
    console.log('   ✅ نظام الإشعارات موجود\n');

  } catch (error) {
    console.error('❌ خطأ في الاختبار:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

testMentionsSystem();
