import express from 'express';
import {
  getPlatformFeeProfiles,
  createPlatformFeeProfile,
  updatePlatformFeeProfile,
  deletePlatformFeeProfile,
  getEtsyDefaults_handler,
} from '../controllers/platformFeesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/etsy-defaults', getEtsyDefaults_handler);
router.get('/', getPlatformFeeProfiles);
router.post('/', createPlatformFeeProfile);
router.put('/:id', updatePlatformFeeProfile);
router.delete('/:id', deletePlatformFeeProfile);

export default router;
