
import { Router } from 'express';
import { trackCompetitorProduct, getTrackedProducts, deleteTrackedProduct, updateTrackedProduct, getCompetitiveInsights, getSavedInsights } from '../controllers/competitor.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/competitors/track - Track a new competitor product
router.post('/track', trackCompetitorProduct);

// GET /api/competitors - Get all tracked products
router.get('/', getTrackedProducts);

// PATCH /api/competitors/:id - Update a tracked product
router.patch('/:id', updateTrackedProduct);

// GET /api/competitors/insights/saved - Get previously saved insights (no AI call)
router.get('/insights/saved', getSavedInsights);

// GET /api/competitors/insights - Generate AI competitive insights
router.get('/insights', getCompetitiveInsights);

// DELETE /api/competitors/:id - Delete a tracked product
router.delete('/:id', deleteTrackedProduct);

export default router;
