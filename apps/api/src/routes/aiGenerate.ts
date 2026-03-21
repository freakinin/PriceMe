import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { generateProductChat } from '../controllers/aiGenerate.controller.js';

const router = Router();
router.use(authenticate);
router.post('/chat', generateProductChat);

export default router;
