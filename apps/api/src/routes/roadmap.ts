import express from 'express';
import { getRoadmapFeatures, voteOnFeature } from '../controllers/roadmapController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All roadmap routes require authentication
router.use(authenticate);

router.get('/', getRoadmapFeatures);
router.post('/:featureId/vote', voteOnFeature);

export default router;
