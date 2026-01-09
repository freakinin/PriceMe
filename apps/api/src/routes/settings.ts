import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All settings routes require authentication
router.use(authenticate);

router.get('/', getSettings);
router.put('/', updateSettings);

export default router;





