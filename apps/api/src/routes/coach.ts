import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getProfile,
  upsertProfile,
  getHealthScore,
  generateInsights,
  getInsights,
  updateInsightStatus,
  getChatHistory,
  sendChatMessage,
  getReports,
  generateReport,
} from '../controllers/coach.controller.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.post('/profile', upsertProfile);
router.get('/health-score', getHealthScore);
router.post('/insights/generate', generateInsights);
router.get('/insights', getInsights);
router.patch('/insights/:id', updateInsightStatus);
router.get('/chat/history', getChatHistory);
router.post('/chat', sendChatMessage);
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

export default router;
