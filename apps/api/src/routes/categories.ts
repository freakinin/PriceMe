import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    bulkDeleteCategories,
} from '../controllers/categoryController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

router.post('/bulk-delete', bulkDeleteCategories);

// Category routes
router.get('/', getCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;
