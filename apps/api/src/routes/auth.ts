import express from 'express';
import { register, login, resetPassword, googleAuth, googleCallback } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/reset-password', resetPassword);
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

export default router;






