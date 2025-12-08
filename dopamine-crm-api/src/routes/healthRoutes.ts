import { Router } from 'express';
import { checkHealth } from '../controllers/healthController';

const router = Router();

router.get('/health', checkHealth);

export default router;
