// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';
import { errorHandler } from '../apps/api/src/middleware/errorHandler.js';
import { initializeDatabase } from '../apps/api/src/utils/db.js';

const app = express();

// Initialize database (only once, Vercel will cache this)
let dbInitialized = false;
if (!dbInitialized) {
  initializeDatabase().catch((error) => {
    console.error('Failed to initialize database:', error);
  });
  dbInitialized = true;
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.get('/api', (req, res) => {
  res.json({ message: 'API endpoint - routes coming soon' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Export as Vercel serverless function
export default app;
