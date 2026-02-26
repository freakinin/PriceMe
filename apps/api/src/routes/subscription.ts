import express from 'express';
import { getSubscription, getPlans, assignPlan } from '../controllers/subscriptionController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticate);

router.get('/', getSubscription);
router.get('/plans', getPlans);
router.post('/assign', assignPlan);

export default router;
