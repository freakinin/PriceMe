import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeDatabase } from './utils/db.js';

dotenv.config();

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
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes will be added here
app.use('/api', (req, res) => {
  res.json({ message: 'API endpoint - routes coming soon' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;

