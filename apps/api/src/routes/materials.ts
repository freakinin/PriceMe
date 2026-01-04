import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createMaterial,
  getMaterials,
  getMaterial,
  updateMaterial,
  deleteMaterial,
} from '../controllers/materialController';

const router = Router();

router.use(authenticate);

router.post('/', createMaterial);
router.get('/', getMaterials);
router.get('/:id', getMaterial);
router.put('/:id', updateMaterial);
router.delete('/:id', deleteMaterial);

export default router;

