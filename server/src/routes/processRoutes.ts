import { Router } from 'express';
import { handleProcessText } from '../controllers/processController';

const router = Router();

// Endpoint for analyzing text against enabled rules
router.post('/', handleProcessText);

export default router;