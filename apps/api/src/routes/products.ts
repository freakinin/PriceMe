import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct, bulkDeleteProducts, bulkUpdateProductStatus } from '../controllers/productController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All product routes require authentication
router.use(authenticate);

// Bulk operations must come before /:id routes to avoid conflict if :id captures "bulk-delete"
router.post('/bulk-delete', bulkDeleteProducts);
router.post('/bulk-status', bulkUpdateProductStatus);

router.post('/', createProduct);
router.get('/', getProducts);
router.get('/:id', getProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;


