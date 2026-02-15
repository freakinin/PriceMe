
import { Router } from 'express';
import { trackCompetitorProduct, getTrackedProducts, deleteTrackedProduct } from '../controllers/competitor.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/competitors/track - Track a new competitor product
router.post('/track', trackCompetitorProduct);

// GET /api/competitors - Get all tracked products
router.get('/', getTrackedProducts);

// DELETE /api/competitors/:id - Delete a tracked product
router.delete('/:id', deleteTrackedProduct);

export default router;
