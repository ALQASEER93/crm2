import { Router } from 'express';
import { login } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/authSchemas';

const router = Router();

router.post('/auth/login', validate(loginSchema), login);

export default router;
