import express from 'express';
import cors from 'cors';
import { environment } from './config/environment';
import { testConnection } from './config/database';
import manualInputRoutes from './routes/manual-input';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/manual-input', manualInputRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
const PORT = environment.PORT || 3000;

async function startServer() {
  try {
    // Test database connection
    await testConnection();
    
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
