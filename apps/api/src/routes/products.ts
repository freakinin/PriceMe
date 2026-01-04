import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All product routes require authentication
router.use(authenticate);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);

export default router;


