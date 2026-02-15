import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load fallback configuration first
import './config/env.js'; // This populates process.env with defaults if missing

import express from 'express';
import cors from 'cors';

// Load env vars (try standard locations just in case)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config();

import { errorHandler } from './middleware/errorHandler.js';
import { initializeDatabase } from './utils/db.js';


// Ensure POSTGRES_URL is set (fallback to .env.local value if needed)
if (!process.env.POSTGRES_URL) {
  console.warn('POSTGRES_URL not found in environment, attempting manual load check...');
  // This is a safety check. The dotenv config above should have loaded it.
}

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database on startup
initializeDatabase().catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import settingsRoutes from './routes/settings.js';
import materialsRoutes from './routes/materials.js';
import roadmapRoutes from './routes/roadmap.js';
import templateRoutes from './routes/templates.js';
import salesRoutes from './routes/sales.js';
import exportRoutes from './routes/export.js';

import categoryRoutes from './routes/categories.js';
import competitorRoutes from './routes/competitors.js';
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/competitors', competitorRoutes);
app.use('/api/export', exportRoutes);

import notificationRoutes from './routes/notifications.js';
import { PriceMonitorJob } from './jobs/priceMonitor.js';

app.use('/api/notifications', notificationRoutes);

// API info route
app.get('/api', (_req, res) => {
  res.json({ message: 'PriceMe API - Authentication endpoints available at /api/auth' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Only listen if not running in Vercel (exported for serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);

    // Start Price Monitor check every 24 hours (86400000 ms)
    // For demo: verify immediately then interval
    console.log('⏰ Initializing Price Monitor Job...');
    PriceMonitorJob.run();
    setInterval(() => {
      PriceMonitorJob.run();
    }, 24 * 60 * 60 * 1000);
  });
}

export default app;

