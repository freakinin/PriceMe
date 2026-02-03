import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
  bulkDeleteMaterials,
  bulkUpdateMaterials,
} from '../controllers/materialController';

const router = Router();

router.use(authenticate);

// Bulk operations must come before /:id routes
router.post('/bulk-delete', bulkDeleteMaterials);
router.post('/bulk-update', bulkUpdateMaterials);
router.post('/', createMaterial);
router.get('/', getMaterials);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;




