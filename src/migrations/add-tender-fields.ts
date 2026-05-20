import pool from '../config/database';

/**
 * Migration: إضافة حقول العطاءات على جدول الطلبات الإدارية
 * 
 * الحقول الجديدة:
 * - tender_id: رقم/اسم العطاء (مثل TAM/2025/T41)
 * - donor_client: الجهة المانحة أو العميل
 * - announcement_link: رابط إعلان العطاء
 * - submission_deadline: الموعد النهائي للتقديم
 * - initial_notes: ملاحظات أولية
 */
export async function addTenderFields() {
  try {
    console.log('📝 Adding tender fields to admin_proc_orders...');

    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS tender_id VARCHAR(100);
    `);
    console.log('✅ tender_id column added');

    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS donor_client VARCHAR(255);
    `);
    console.log('✅ donor_client column added');

    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS announcement_link TEXT;
    `);
    console.log('✅ announcement_link column added');

    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE;
    `);
    console.log('✅ submission_deadline column added');

    await pool.query(`
      ALTER TABLE admin_proc_orders 
      ADD COLUMN IF NOT EXISTS initial_notes TEXT;
    `);
    console.log('✅ initial_notes column added');

    // Index على tender_id للبحث السريع
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_orders_tender_id ON admin_proc_orders(tender_id);
    `);
    console.log('✅ Index created on tender_id');

    console.log('\n🎉 Tender fields added successfully!');
  } catch (error: any) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Columns already exist');
    } else {
      console.error('❌ Error adding tender fields:', error.message);
      throw error;
    }
  }
}

// Run migration
addTenderFields().catch(console.error);
