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
  getChatSessions,
  createChatSession,
  deleteChatSession,
  getChatSessionMessages,
} from '../controllers/coach.controller.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.post('/profile', upsertProfile);
router.get('/health-score', getHealthScore);
router.post('/insights/generate', generateInsights);
router.get('/insights', getInsights);
router.patch('/insights/:id', updateInsightStatus);
router.get('/chat/sessions', getChatSessions);
router.post('/chat/sessions', createChatSession);
router.delete('/chat/sessions/:session_id', deleteChatSession);
router.get('/chat/sessions/:session_id/messages', getChatSessionMessages);
router.get('/chat/history', getChatHistory);
router.post('/chat', sendChatMessage);
router.get('/reports', getReports);
router.post('/reports/generate', generateReport);

export default router;
