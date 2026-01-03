import express from 'express';
import { createProduct, getProducts, getProduct } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All product routes require authentication
router.use(authenticate);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);

export default router;

