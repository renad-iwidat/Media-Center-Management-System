/**
 * Media Center Management System
 * Main Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { environment } from './config/environment';
import { testConnection } from './config/database';
import { schedulerService } from './services/news/scheduler.service';

// Routes
import sourcesRoutes from './routes/database/sources.routes';
import programsRoutes from './routes/database/programs.routes';
import guestsRoutes from './routes/database/guests.routes';
import authRoutes from './routes/auth/auth.routes';
import newsRoutes from './routes/news/news.routes';
import dataRoutes from './routes/news/data.routes';
import flowRoutes from './routes/news/flow.routes';
import editorialPolicyRoutes from './routes/news/editorial-policy.routes';
import systemSettingsRoutes from './routes/news/system-settings.routes';
import schedulerRoutes from './routes/news/scheduler.routes';
import { chatRoutes, ttsRoutes, sttRoutes, audioExtractionRoutes, videoToTextRoutes, analyticsRoutes, smartTranscriptionRoutes, transcriptionEditorialRoutes } from './routes/ai-hub';
import ideasRoutes from './routes/ai-hub/ideas.routes';
import streamingExtractionRoutes from './routes/ai-hub/streaming-extraction.routes';
import uploadedFilesRoutes from './routes/manual-input/uploaded-files.routes';
import newsDeskProxyRoutes from './routes/news/newsdesk-proxy.routes';
import autoPublishRoutes from './routes/news/auto-publish.routes';
import bulletinsRoutes from './routes/news/bulletins.routes';
import publishingRoutes from './routes/publishing/publishing.routes';
import newsIntegrationRoutes from './routes/management/news-integration.routes';
import { runPublishingMigration } from './services/publishing';

const app = express();

// Trust proxy for production (Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
// Increase JSON payload limit for audio/video base64 data
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve temporary audio files
const tempAudioDir = path.join(os.tmpdir(), 'media-center-extracted-audio');
app.use('/temp-audio', express.static(tempAudioDir));

// Clean up old temporary files (older than 1 hour)
setInterval(() => {
  if (fs.existsSync(tempAudioDir)) {
    const files = fs.readdirSync(tempAudioDir);
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    files.forEach(file => {
      const filePath = path.join(tempAudioDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.mtime.getTime() < oneHourAgo) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up old temp file: ${file}`);
      }
    });
  }
}, 30 * 60 * 1000); // Check every 30 minutes



// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Documentation - Base URL
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Media Center Management System API',
    version: '1.0.0',
    documentation: 'http://localhost:7845/api-docs',
    endpoints: {
      sources: {
        description: 'المصادر - إدارة مصادر الأخبار',
        routes: [
          'GET /api/sources - جميع المصادر',
          'GET /api/sources/active - المصادر النشطة',
        ],
      },
      news: {
        description: 'الأخبار - إدارة الأخبار والمقالات',
        routes: [
          'GET /api/news - جميع الأخبار',
          'GET /api/news/:id - خبر بالـ ID',
          'GET /api/news/source/:sourceId - أخبار مصدر معين',
        ],
      },
      data: {
        description: 'البيانات - المصادر والأخبار والتصنيفات',
        routes: [
          'GET /api/data/sources - جميع المصادر',
          'GET /api/data/sources/active - المصادر النشطة',
          'GET /api/data/articles - جميع الأخبار',
          'GET /api/data/articles?limit=100&offset=0 - أخبار مع pagination',
          'GET /api/data/articles/source/:sourceId - أخبار مصدر معين',
          'GET /api/data/categories - جميع التصنيفات',
          'GET /api/data/articles/category/:categoryId - أخبار تصنيف معين',
          'GET /api/data/comprehensive - بيانات شاملة',
          'GET /api/data/statistics - إحصائيات',
        ],
      },
      classifier: {
        description: 'التصنيف - تصنيف الأخبار الآلي',
        routes: [
          'GET /api/news/classifier/unclassified - أخبار بدون تصنيف',
          'POST /api/news/classifier/process - تصنيف الأخبار',
        ],
      },
    },
  });
});

// API Documentation - HTML
app.get('/api-docs', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Media Center Management System API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
          border-bottom: 3px solid #007bff;
          padding-bottom: 10px;
        }
        h2 {
          color: #007bff;
          margin-top: 30px;
        }
        .endpoint {
          background-color: #f9f9f9;
          padding: 10px;
          margin: 10px 0;
          border-left: 4px solid #007bff;
          border-radius: 4px;
        }
        .method {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 4px;
          font-weight: bold;
          margin-right: 10px;
        }
        .get {
          background-color: #61affe;
          color: white;
        }
        .post {
          background-color: #49cc90;
          color: white;
        }
        code {
          background-color: #f0f0f0;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .description {
          color: #666;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📰 Media Center Management System API</h1>
        <p><strong>الإصدار:</strong> 1.0.0</p>
        <p><strong>Base URL:</strong> <code>http://localhost:7845/api</code></p>
        
        <h2>🔗 المصادر (Sources)</h2>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/sources</code>
          <div class="description">جميع المصادر</div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/sources/active</code>
          <div class="description">المصادر النشطة</div>
        </div>

        <h2>📰 الأخبار (Articles)</h2>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/articles</code>
          <div class="description">جميع الأخبار</div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/articles?limit=100&offset=0</code>
          <div class="description">أخبار مع pagination</div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/articles/source/:sourceId</code>
          <div class="description">أخبار مصدر معين</div>
        </div>

        <h2>🏷️ التصنيفات (Categories)</h2>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/categories</code>
          <div class="description">جميع التصنيفات</div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/articles/category/:categoryId</code>
          <div class="description">أخبار تصنيف معين</div>
        </div>

        <h2>📊 البيانات والإحصائيات (Statistics)</h2>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/comprehensive</code>
          <div class="description">بيانات شاملة (مصادر + أخبار + تصنيفات)</div>
        </div>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/data/statistics</code>
          <div class="description">إحصائيات النظام</div>
        </div>

        <h2>🤖 التصنيف الآلي (Classifier)</h2>
        <div class="endpoint">
          <span class="method get">GET</span>
          <code>/api/news/classifier/unclassified</code>
          <div class="description">أخبار بدون تصنيف</div>
        </div>
        <div class="endpoint">
          <span class="method post">POST</span>
          <code>/api/news/classifier/process</code>
          <div class="description">تصنيف الأخبار بدون تصنيف</div>
        </div>

        <hr>
        <p style="color: #999; font-size: 12px;">
          📖 للمزيد من المعلومات، راجع <a href="/API_DOCUMENTATION.md">API_DOCUMENTATION.md</a>
        </p>
      </div>
    </body>
    </html>
  `);
});

// Database Test Route
app.get('/db-test', async (req, res) => {
  try {
    await testConnection();
    res.json({ status: 'Database connected successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// API Routes — editorial-policies لازم يكون قبل news عشان /:id ما يمسكه
app.use('/api/auth', authRoutes);
app.use('/api/sources', sourcesRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/guests', guestsRoutes);
app.use('/api/news/editorial-policies', editorialPolicyRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/ai-hub/chat', chatRoutes);
app.use('/api/ai-hub/tts', ttsRoutes);
app.use('/api/ai-hub/stt', sttRoutes);
app.use('/api/ai-hub/audio-extraction', audioExtractionRoutes);
app.use('/api/ai-hub/streaming-extraction', streamingExtractionRoutes);
app.use('/api/ai-hub/video-to-text', videoToTextRoutes);
app.use('/api/ai-hub/ideas', ideasRoutes);
app.use('/api/ai-hub/analytics', analyticsRoutes);
app.use('/api/ai-hub/smart-transcription', smartTranscriptionRoutes);
app.use('/api/ai-hub/transcription-editorial', transcriptionEditorialRoutes);
app.use('/api/uploaded-files', uploadedFilesRoutes);
app.use('/api/data', (req, res, next) => {
  console.log(`📍 Data Route: ${req.method} ${req.path}`);
  next();
}, dataRoutes);
app.use('/api/flow', (req, res, next) => {
  console.log(`📍 Flow Route: ${req.method} ${req.path}`);
  next();
}, flowRoutes);
app.use('/api/settings', systemSettingsRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/newsdesk', newsDeskProxyRoutes);
app.use('/api/auto-publish', autoPublishRoutes);
app.use('/api/bulletins', bulletinsRoutes);
app.use('/api/publishing', publishingRoutes);
app.use('/api/management/news', newsIntegrationRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = Number(environment.PORT);
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📝 Environment: ${environment.NODE_ENV}`);
  console.log(`📚 API Routes:`);
  console.log(`   - GET /api/sources`);
  console.log(`   - GET /api/news`);
  console.log(`   - GET /api/data/sources`);
  console.log(`   - GET /api/data/sources/active`);
  console.log(`   - GET /api/data/articles`);
  console.log(`   - GET /api/data/articles/source/:sourceId`);
  console.log(`   - GET /api/data/categories`);
  console.log(`   - GET /api/data/articles/category/:categoryId`);
  console.log(`   - GET /api/data/comprehensive`);
  console.log(`   - GET /api/data/statistics`);
  console.log(`\n📖 Swagger Documentation:`);
  console.log(`   - http://localhost:${PORT}/api-docs`);

  // 🚀 بدء الـ Scheduler تلقائياً عند تشغيل السيرفر
  console.log(`\n⏰ بدء الـ Scheduler تلقائياً...`);
  try {
    // ضمان وجود source_types الأساسية
    const { query: dbQuery } = await import('./config/database');

    // ══════════════════════════════════════════════════════════════════════════
    // ضمان وجود الجداول الأساسية (Auto-Migration)
    // هذه الجداول قد لا تكون موجودة إذا تم إعادة إنشاء الـ DB من الصفر
    // ══════════════════════════════════════════════════════════════════════════
    console.log('🗄️  ضمان وجود الجداول الأساسية...');

    // جدول source_types (يجب أن يكون أولاً — باقي الجداول تعتمد عليه)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS source_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL
      )
    `);

    // جدول media_units
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS media_units (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // جدول sources (إذا ما كان موجود)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS sources (
        id SERIAL PRIMARY KEY,
        source_type_id INTEGER REFERENCES source_types(id),
        url VARCHAR(1024) UNIQUE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        default_category_id INTEGER,
        last_fetched_at TIMESTAMP
      )
    `);

    // جدول media_unit_sources — الجدول المفقود!
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS media_unit_sources (
        id SERIAL PRIMARY KEY,
        media_unit_id INTEGER NOT NULL REFERENCES media_units(id) ON DELETE CASCADE,
        source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
        priority INTEGER DEFAULT 1,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(media_unit_id, source_id)
      )
    `);

    // جدول categories
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        flow VARCHAR(50) DEFAULT 'editorial',
        is_active BOOLEAN DEFAULT true
      )
    `);

    // جدول geographic_scopes
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS geographic_scopes (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        name_ar VARCHAR(255) DEFAULT '',
        name_en VARCHAR(255) DEFAULT '',
        scope_level VARCHAR(50) DEFAULT 'local',
        country_code VARCHAR(10),
        region_slug VARCHAR(255),
        sort_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true
      )
    `);

    // جدول raw_data
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS raw_data (
        id SERIAL PRIMARY KEY,
        source_id INTEGER REFERENCES sources(id),
        source_type_id INTEGER REFERENCES source_types(id),
        category_id INTEGER REFERENCES categories(id),
        geo_scope_id INTEGER REFERENCES geographic_scopes(id),
        media_unit_id INTEGER REFERENCES media_units(id),
        url TEXT NOT NULL,
        title TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        image_url TEXT DEFAULT '',
        tags TEXT[] DEFAULT '{}',
        fetch_status VARCHAR(50) DEFAULT 'pending',
        fetched_at TIMESTAMP DEFAULT NOW(),
        pub_date TIMESTAMP,
        summary TEXT DEFAULT '',
        authors TEXT DEFAULT '',
        language VARCHAR(10) DEFAULT 'ar',
        source_slug VARCHAR(255) DEFAULT '',
        geo_scope_slug VARCHAR(255) DEFAULT '',
        ai_confidence FLOAT,
        newsdesk_article_id INTEGER,
        category_slug VARCHAR(255) DEFAULT '',
        is_incomplete BOOLEAN DEFAULT false,
        publish_status VARCHAR(50) DEFAULT 'draft'
      )
    `);

    // عمود is_rewritten لتتبع حالة إعادة الصياغة (safe migration)
    await dbQuery(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='raw_data' AND column_name='is_rewritten') THEN
          ALTER TABLE raw_data ADD COLUMN is_rewritten BOOLEAN DEFAULT false;
        END IF;
      END $$;
    `);
    await dbQuery(`
      CREATE INDEX IF NOT EXISTS idx_raw_data_is_rewritten ON raw_data(is_rewritten) WHERE is_rewritten = false;
    `);

    // جدول editorial_queue
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS editorial_queue (
        id SERIAL PRIMARY KEY,
        media_unit_id INTEGER NOT NULL REFERENCES media_units(id),
        raw_data_id INTEGER NOT NULL REFERENCES raw_data(id),
        policy_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending',
        editor_notes TEXT,
        user_id INTEGER,
        task_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // جدول published_items
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS published_items (
        id SERIAL PRIMARY KEY,
        media_unit_id INTEGER NOT NULL REFERENCES media_units(id),
        raw_data_id INTEGER NOT NULL REFERENCES raw_data(id),
        queue_id INTEGER,
        content_type_id INTEGER DEFAULT 1,
        title TEXT NOT NULL DEFAULT '',
        content TEXT DEFAULT '',
        image_url TEXT,
        tags TEXT[] DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        published_at TIMESTAMP DEFAULT NOW(),
        approved_by INTEGER,
        task_id INTEGER
      )
    `);

    // جدول system_settings
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL DEFAULT '',
        description TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes مهمة
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_raw_data_newsdesk_id ON raw_data(newsdesk_article_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_raw_data_url ON raw_data(url)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_raw_data_fetch_status ON raw_data(fetch_status)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_raw_data_media_unit ON raw_data(media_unit_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_editorial_queue_status ON editorial_queue(status)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_published_items_media_unit ON published_items(media_unit_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_sources_slug ON sources(slug)`);

    // جدول auto_publish_targets (مطلوب لـ published_items queries)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS auto_publish_targets (
        id SERIAL PRIMARY KEY,
        media_unit_id INTEGER REFERENCES media_units(id),
        name VARCHAR(255) NOT NULL DEFAULT '',
        api_url TEXT DEFAULT '',
        api_token TEXT DEFAULT '',
        default_category_id INTEGER,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // أعمدة إضافية لـ auto_publish_targets (safe migration)
    await dbQuery(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auto_publish_targets' AND column_name='auth_type') THEN
          ALTER TABLE auto_publish_targets ADD COLUMN auth_type VARCHAR(20) NOT NULL DEFAULT 'bearer';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auto_publish_targets' AND column_name='category_mappings') THEN
          ALTER TABLE auto_publish_targets ADD COLUMN category_mappings JSONB DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auto_publish_targets' AND column_name='default_auto_publish') THEN
          ALTER TABLE auto_publish_targets ADD COLUMN default_auto_publish BOOLEAN NOT NULL DEFAULT true;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auto_publish_targets' AND column_name='default_pin') THEN
          ALTER TABLE auto_publish_targets ADD COLUMN default_pin INTEGER NOT NULL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auto_publish_targets' AND column_name='categories_api_url') THEN
          ALTER TABLE auto_publish_targets ADD COLUMN categories_api_url TEXT;
        END IF;
      END $$;
    `);

    // جدول auto_publish_log
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS auto_publish_log (
        id SERIAL PRIMARY KEY,
        target_id INTEGER REFERENCES auto_publish_targets(id),
        raw_data_id INTEGER REFERENCES raw_data(id),
        status VARCHAR(50) DEFAULT 'pending',
        external_url TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // جدول platform_configs (مطلوب لنظام النشر المتعدد)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS platform_configs (
        id SERIAL PRIMARY KEY,
        platform VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        credentials JSONB NOT NULL DEFAULT '{}',
        is_enabled BOOLEAN NOT NULL DEFAULT false,
        media_unit_id INTEGER NOT NULL REFERENCES media_units(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_platform_per_unit UNIQUE (platform, media_unit_id, name)
      )
    `);

    // جدول publishing_status (مطلوب لـ published_items queries)
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS publishing_status (
        id SERIAL PRIMARY KEY,
        article_id INTEGER NOT NULL,
        platform VARCHAR(50) NOT NULL,
        platform_config_id INTEGER NOT NULL REFERENCES platform_configs(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'publishing',
        external_post_id VARCHAR(255),
        external_url TEXT,
        published_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_retry_at TIMESTAMP WITH TIME ZONE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT unique_article_platform UNIQUE (article_id, platform_config_id)
      )
    `);

    console.log('✅ جميع الجداول الأساسية موجودة');

    await dbQuery(`
      INSERT INTO source_types (id, name) VALUES 
        (1, 'RSS'),
        (2, 'API'),
        (3, 'Telegram'),
        (4, 'Web Scraper'),
        (5, 'Manual'),
        (6, 'user_input_text'),
        (7, 'user_input_audio'),
        (8, 'user_input_video')
      ON CONFLICT (id) DO NOTHING
    `);

    // ضمان وجود system_settings الأساسية
    await dbQuery(`
      INSERT INTO system_settings (key, value, description) VALUES 
        ('scheduler_enabled', 'true', 'تشغيل/إيقاف السحب التلقائي'),
        ('scheduler_interval_minutes', '5', 'الفاصل بين كل دورة سحب (بالدقائق)'),
        ('articles_per_source', '20', 'عدد المقالات لكل صفحة من الـ API'),
        ('classifier_enabled', 'true', 'تشغيل/إيقاف التصنيف الآلي بالـ AI'),
        ('flow_enabled', 'true', 'تشغيل/إيقاف توجيه الأخبار (FlowRouter)'),
        ('auto_publish_enabled', 'true', 'تشغيل/إيقاف النشر التلقائي على المواقع الخارجية')
      ON CONFLICT (key) DO NOTHING
    `);

    console.log(`✅ تم ضمان وجود source_types و system_settings الأساسية`);

    // ضمان وجود جدول media_unit_articles (النسخة المعالجة لكل وحدة) + الـ view
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS media_unit_articles (
        id                  BIGSERIAL PRIMARY KEY,
        raw_data_id         BIGINT  NOT NULL REFERENCES raw_data(id)     ON DELETE CASCADE,
        media_unit_id       BIGINT  NOT NULL REFERENCES media_units(id)  ON DELETE CASCADE,
        source_id           BIGINT  REFERENCES sources(id),
        newsdesk_article_id INTEGER,
        title               TEXT,
        summary             TEXT,
        content             TEXT,
        image_url           TEXT,
        tags                TEXT[] DEFAULT '{}',
        category_id         BIGINT  REFERENCES categories(id),
        geo_scope_id        INTEGER REFERENCES geographic_scopes(id),
        ai_confidence       NUMERIC(5,4) DEFAULT NULL,
        ai_processed        BOOLEAN DEFAULT false,
        status              VARCHAR(20) DEFAULT 'pending',
        flow                VARCHAR(20),
        is_modified         BOOLEAN DEFAULT false,
        is_incomplete       BOOLEAN DEFAULT false,
        created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE (raw_data_id, media_unit_id)
      )
    `);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_mua_raw_data ON media_unit_articles(raw_data_id)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_mua_unit_status ON media_unit_articles(media_unit_id, status)`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_mua_newsdesk ON media_unit_articles(newsdesk_article_id) WHERE newsdesk_article_id IS NOT NULL`);
    await dbQuery(`CREATE INDEX IF NOT EXISTS idx_mua_source ON media_unit_articles(source_id)`);
    await dbQuery(`
      CREATE OR REPLACE VIEW v_media_unit_articles AS
      SELECT
        mua.id, mua.raw_data_id, mua.media_unit_id, mua.source_id, mua.newsdesk_article_id,
        mua.status, mua.flow, mua.is_modified, mua.is_incomplete, mua.ai_processed,
        COALESCE(mua.title, rd.title) AS title,
        COALESCE(mua.summary, rd.summary) AS summary,
        COALESCE(mua.content, rd.content) AS content,
        COALESCE(mua.image_url, rd.image_url) AS image_url,
        COALESCE(NULLIF(mua.tags, '{}'), rd.tags) AS tags,
        COALESCE(mua.category_id, rd.category_id) AS category_id,
        COALESCE(mua.geo_scope_id, rd.geo_scope_id) AS geo_scope_id,
        COALESCE(mua.ai_confidence, rd.ai_confidence) AS ai_confidence,
        rd.url, rd.language, rd.pub_date, mua.created_at, mua.updated_at
      FROM media_unit_articles mua
      JOIN raw_data rd ON rd.id = mua.raw_data_id
    `);
    console.log(`✅ تم ضمان وجود جدول media_unit_articles + الـ view`);

    await schedulerService.start(5); // 5 دقائق
    console.log(`✅ الـ Scheduler بدأ بنجاح — السحب كل 5 دقائق`);
  } catch (error) {
    console.error(`❌ خطأ في بدء الـ Scheduler:`, error);
  }

  // 🗄️ تشغيل migration نظام النشر المتعدد المنصات
  try {
    await runPublishingMigration();

    // ضمان وجود إعداد فيسبوك لكل وحدة إعلامية نشطة
    const { query: dbQ } = await import('./config/database');
    const activeUnits = await dbQ(`SELECT id, name FROM media_units WHERE is_active = true`);
    
    if (activeUnits.rows.length > 0) {
      for (const unit of activeUnits.rows) {
        await dbQ(
          `INSERT INTO platform_configs (platform, name, credentials, is_enabled, media_unit_id)
           VALUES ('facebook', $1, '{}'::jsonb, true, $2)
           ON CONFLICT (platform, media_unit_id, name) DO NOTHING`,
          [`صفحة فيسبوك - ${unit.name}`, unit.id]
        );
      }
      console.log(`✅ تم ضمان وجود إعدادات فيسبوك لـ ${activeUnits.rows.length} وحدة إعلامية`);
    }
  } catch (error) {
    console.error(`❌ خطأ في migration نظام النشر:`, error);
  }
});
