import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { submitTicket } from '../controllers/supportController.js';

const router = Router();

router.use(authenticate);

router.post('/', submitTicket);

export default router;
