/**
 * Media Center Management System
 * Main Entry Point
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { environment } from './config/environment';
import { testConnection } from './config/database';

// Routes
import sourcesRoutes from './routes/database/sources.routes';
import newsRoutes from './routes/news/news.routes';
import dataRoutes from './routes/news/data.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

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
    documentation: 'http://localhost:3000/api-docs',
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
        <p><strong>Base URL:</strong> <code>http://localhost:3000/api</code></p>
        
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

// API Routes
app.use('/api/sources', sourcesRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/data', (req, res, next) => {
  console.log(`📍 Data Route: ${req.method} ${req.path}`);
  next();
}, dataRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
const PORT = environment.PORT;
app.listen(PORT, () => {
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
});
