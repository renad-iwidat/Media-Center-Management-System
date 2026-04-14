import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { environment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './config/database';
import portalRoutes from './routes/portal-r';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Media Center Management System API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api/portal'
    }
  });
});

// Portal API Routes
app.use('/api/portal', portalRoutes);

// Initialize server
const startServer = async () => {
  try {
    // Start listening first
    const server = app.listen(environment.port, '0.0.0.0', () => {
      console.log(`\n🚀 Server running on port ${environment.port}`);
      console.log(`📝 Environment: ${environment.nodeEnv}`);
    });

    // Then connect to database
    await connectDatabase();
    console.log(`\n✓ Application started successfully\n`);
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

startServer();

export default app;
