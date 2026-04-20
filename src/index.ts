import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { testConnection } from './config/database';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// CORS middleware
app.use((_req: Request, res: Response, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: _req.path,
    method: _req.method,
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use((err: any, _req: Request, res: Response) => {
  console.error('Error:', err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
  });
});

// Start the server
app.listen(port, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Media Center Management System                        ║
║   Server is running on port ${port}                          ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   Database: Testing connection...                          ║
║                                                            ║
║   Available Endpoints:                                     ║
║   - GET  /health                                           ║
║   - GET  /api/orders                                       ║
║   - GET  /api/tasks                                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);

  try {
    await testConnection();
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    console.error('\nPlease check:');
    console.error('1. DATABASE_URL in .env file');
    console.error('2. Database server is running and accessible');
    console.error('3. Network connectivity to the database');
  }
});

export default app;
