


import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load fallback configuration first
import './config/env.js'; // This populates process.env with defaults if missing

import express from 'express';
import cors from 'cors';

// Load env vars (try standard locations just in case)
// Only run this in development/local environments
if (process.env.VERCEL !== '1') {
  try {


    // Safer to use process.cwd() if we run from apps/api root.
    const envPath = path.resolve(process.cwd(), '.env.local');
    const customEnvPath = path.resolve(process.cwd(), '.env.custom');

    // Try custom env first
    if (fs.existsSync(customEnvPath)) {
      console.log('Loading env from:', customEnvPath);
      dotenv.config({ path: customEnvPath });
    }

    console.log('Loading env from:', envPath);
    const result = dotenv.config({ path: envPath, override: true }); // .env.local always wins over .env.custom
    if (result.error) console.error('Dotenv Error:', result.error);
    console.log('Dotenv Parsed Keys:', result.parsed ? Object.keys(result.parsed).join(', ') : 'None');
    console.log('GEMINI_API_KEY in process.env:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
    dotenv.config();

  } catch (e) {
    console.warn('Failed to load local .env files', e);
  }
}


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
  // Do not exit process, allow generic error handling to catch request errors
  // process.exit(1); 
});

// Middleware
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Check if origin is in explicit allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments matching the pattern
    if (/^https:\/\/price-me.*\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    // Allow localhost (development)
    if (origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);
    return callback(new Error('Not allowed by CORS'), false);
  },
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
import platformFeesRoutes from './routes/platformFees.js';
import shippingMethodsRoutes from './routes/shippingMethods.js';
import subscriptionRoutes from './routes/subscription.js';
import profileRoutes from './routes/profile.js';
import coachRoutes from './routes/coach.js';
import { PriceMonitorJob } from './jobs/priceMonitor.js';

app.use('/api/notifications', notificationRoutes);
app.use('/api/platform-fees', platformFeesRoutes);
app.use('/api/shipping-methods', shippingMethodsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/coach', coachRoutes);

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

