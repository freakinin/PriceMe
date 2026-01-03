// Vercel serverless function entry point
import express from 'express';
import cors from 'cors';

const app = express();

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

// Catch-all for API routes
app.all('/api/*', (req, res) => {
  res.json({ message: 'API endpoint - routes coming soon', path: req.path });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const statusCode = (err as any).statusCode || 500;
  const status = (err as any).status || 'error';
  
  res.status(statusCode).json({
    status,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Export as Vercel serverless function
export default app;
