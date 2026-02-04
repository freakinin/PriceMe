import express from 'express';
import { exportProducts, exportMaterials } from '../controllers/exportController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Require auth for all export routes
router.use(authenticate);

router.get('/products', exportProducts);
router.get('/materials', exportMaterials);

export default router;
