import { Router } from 'express';
import { getTemplates, createTemplate, getTemplate, deleteTemplate } from '../controllers/templateController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

router.get('/', getTemplates);
router.post('/', createTemplate);
router.get('/:id', getTemplate);
router.delete('/:id', deleteTemplate);

// TODO: Add PUT route for updating templates

export default router;
