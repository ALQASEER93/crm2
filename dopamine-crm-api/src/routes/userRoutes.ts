import { Router } from 'express';
import { createUser, getAllUsers, getUserById, updateUser, deleteUser } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;

// All user routes require authentication
router.use(authenticate);

// CRUD operations for users - restricted to Admins
router.route('/users')
  .post(authorize([ADMIN_ROLE_ID]), createUser)
  .get(authorize([ADMIN_ROLE_ID]), getAllUsers);

router.route('/users/:id')
  .get(authorize([ADMIN_ROLE_ID]), getUserById)
  .put(authorize([ADMIN_ROLE_ID]), updateUser)
  .delete(authorize([ADMIN_ROLE_ID]), deleteUser);

export default router;
