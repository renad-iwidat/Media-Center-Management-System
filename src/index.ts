import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import portalRoutes from './routes/portal-r';
import { testConnection } from './config/database';
import { SocketService } from './services/management/SocketService';

// Load environment variables
dotenv.config();

// Create Express app + HTTP server
const app: Express = express();
const httpServer = createServer(app);
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS middleware
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, _res: Response, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Media Center Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      management: '/api (orders, tasks)',
      portal: '/api/portal',
    },
  });
});

// Management API routes (Orders, Tasks)
app.use('/api', apiRoutes);

// Portal API routes (Users, Programs, Desks, etc.)
app.use('/api/portal', portalRoutes);

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
SocketService.init(httpServer);

httpServer.listen(port, async () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🚀 Media Center Management System                        ║
║   Server is running on port ${port}                          ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                          ║
║   WebSocket: Enabled                                       ║
║   Database: Testing connection...                          ║
║                                                            ║
║   Available Endpoints:                                     ║
║   - GET  /health                                           ║
║   - POST /api/auth/login                                   ║
║   - GET  /api/orders                                       ║
║   - GET  /api/tasks                                        ║
║   - GET  /api/kpi/dashboard                                ║
║   - GET  /api/shootings                                    ║
║   - GET  /api/content                                      ║
║   - GET  /api/notifications                                ║
║   - GET  /api/portal/*                                     ║
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

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  const { closePool } = await import('./config/database');
  await closePool();
  process.exit(0);
});

export default app;
