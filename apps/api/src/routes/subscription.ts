import express from 'express';
import { getSubscription, getPlans, assignPlan, getPromo, fixTrial } from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Public — no auth required
router.get('/promos/:code', getPromo);

// All routes below require authentication
router.use(authenticate);
router.get('/', getSubscription);
router.get('/plans', getPlans);
router.post('/assign', assignPlan);
router.post('/fix-trial', fixTrial);

export default router;
