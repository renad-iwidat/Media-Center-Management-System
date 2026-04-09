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

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
});
