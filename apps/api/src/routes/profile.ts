import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/profileController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getProfile);
router.patch('/', updateProfile);
router.post('/change-password', changePassword);

export default router;
