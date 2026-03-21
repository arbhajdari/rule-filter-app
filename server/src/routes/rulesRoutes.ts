import { Router } from 'express';
import {
  getRules,
  createRule,
  updateRule,
  deleteRule,
} from '../controllers/rulesController';

const router = Router();

// Standard CRUD endpoints for rule management
router.get('/', getRules);
router.post('/', createRule);
router.patch('/:id', updateRule);
router.delete('/:id', deleteRule);

export default router;