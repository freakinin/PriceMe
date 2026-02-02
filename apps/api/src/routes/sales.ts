import express from 'express';
import { createSale, getSales, deleteSale } from '../controllers/salesController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.post('/', createSale);
router.get('/', getSales);
router.delete('/:id', deleteSale);

export default router;
