import express from 'express';
import { exchangeToken, getIntegrationStatus, syncListings, disconnectEtsy } from '../controllers/etsyController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public routes (none for now, exchange needs auth?)
// Actually exchangeToken should be protected ideally, linking to the logged-in user.
router.post('/token', authenticate, exchangeToken);
router.get('/status', authenticate, getIntegrationStatus);
router.post('/sync', authenticate, syncListings);
router.post('/disconnect', authenticate, disconnectEtsy);

export default router;
