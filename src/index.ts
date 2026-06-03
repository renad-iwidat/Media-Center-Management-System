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
