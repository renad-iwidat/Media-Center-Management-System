import pool from '../../config/database';

/**
 * إعداد أنواع المصادر للإدخال اليدوي
 * - Manual Input Text
 * - Manual Input Audio
 * - Manual Input Video
 */

async function setupManualInputSources() {
  console.log('🔧 إعداد أنواع المصادر للإدخال اليدوي...\n');

  try {
    // 1. إضافة أنواع المصادر الجديدة في source_types
    console.log('1️⃣ إضافة أنواع المصادر في source_types...');
    
    // التحقق من وجود user_input_text
    const textTypeCheck = await pool.query(
      `SELECT id FROM source_types WHERE name = 'user_input_text'`
    );
    
    if (textTypeCheck.rows.length === 0) {
      await pool.query(`INSERT INTO source_types (name) VALUES ('user_input_text')`);
      console.log('✅ تم إضافة user_input_text');
    } else {
      console.log('⚠️  user_input_text موجود مسبقاً');
    }

    // التحقق من وجود user_input_audio
    const audioTypeCheck = await pool.query(
      `SELECT id FROM source_types WHERE name = 'user_input_audio'`
    );
    
    if (audioTypeCheck.rows.length === 0) {
      await pool.query(`INSERT INTO source_types (name) VALUES ('user_input_audio')`);
      console.log('✅ تم إضافة user_input_audio');
    } else {
      console.log('⚠️  user_input_audio موجود مسبقاً');
    }

    // التحقق من وجود user_input_video
    const videoTypeCheck = await pool.query(
      `SELECT id FROM source_types WHERE name = 'user_input_video'`
    );
    
    if (videoTypeCheck.rows.length === 0) {
      await pool.query(`INSERT INTO source_types (name) VALUES ('user_input_video')`);
      console.log('✅ تم إضافة user_input_video');
    } else {
      console.log('⚠️  user_input_video موجود مسبقاً');
    }

    // 2. جلب IDs الأنواع الجديدة
    console.log('\n2️⃣ جلب IDs أنواع المصادر...');
    const sourceTypes = await pool.query(`
      SELECT id, name 
      FROM source_types 
      WHERE name IN ('user_input_text', 'user_input_audio', 'user_input_video')
      ORDER BY name
    `);
    console.log('أنواع المصادر:', sourceTypes.rows);

    const textTypeId = sourceTypes.rows.find(r => r.name === 'user_input_text')?.id;
    const audioTypeId = sourceTypes.rows.find(r => r.name === 'user_input_audio')?.id;
    const videoTypeId = sourceTypes.rows.find(r => r.name === 'user_input_video')?.id;

    // 3. إضافة المصادر في جدول sources
    console.log('\n3️⃣ إضافة المصادر في جدول sources...');

    // مصدر النص
    const textSourceCheck = await pool.query(
      `SELECT id FROM sources WHERE name = 'Manual Input - Text'`
    );
    
    if (textSourceCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO sources (source_type_id, url, name, is_active, created_at)
        VALUES ($1, NULL, 'Manual Input - Text', true, NOW())
      `, [textTypeId]);
      console.log('✅ تم إضافة مصدر Manual Input - Text');
    } else {
      console.log('⚠️  مصدر Manual Input - Text موجود مسبقاً');
    }

    // مصدر الصوت
    const audioSourceCheck = await pool.query(
      `SELECT id FROM sources WHERE name = 'Manual Input - Audio'`
    );
    
    if (audioSourceCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO sources (source_type_id, url, name, is_active, created_at)
        VALUES ($1, NULL, 'Manual Input - Audio', true, NOW())
      `, [audioTypeId]);
      console.log('✅ تم إضافة مصدر Manual Input - Audio');
    } else {
      console.log('⚠️  مصدر Manual Input - Audio موجود مسبقاً');
    }

    // مصدر الفيديو
    const videoSourceCheck = await pool.query(
      `SELECT id FROM sources WHERE name = 'Manual Input - Video'`
    );
    
    if (videoSourceCheck.rows.length === 0) {
      await pool.query(`
        INSERT INTO sources (source_type_id, url, name, is_active, created_at)
        VALUES ($1, NULL, 'Manual Input - Video', true, NOW())
      `, [videoTypeId]);
      console.log('✅ تم إضافة مصدر Manual Input - Video');
    } else {
      console.log('⚠️  مصدر Manual Input - Video موجود مسبقاً');
    }

    // 4. عرض النتيجة النهائية
    console.log('\n4️⃣ المصادر النهائية:');
    const finalSources = await pool.query(`
      SELECT s.id, s.name, st.name as source_type_name, s.is_active
      FROM sources s
      JOIN source_types st ON s.source_type_id = st.id
      WHERE st.name IN ('user_input_text', 'user_input_audio', 'user_input_video')
      ORDER BY s.id
    `);
    console.log(finalSources.rows);

    console.log('\n✅ تم الإعداد بنجاح!');
    
  } catch (error) {
    console.error('❌ خطأ أثناء الإعداد:', error);
  } finally {
    await pool.end();
  }
}

setupManualInputSources();
