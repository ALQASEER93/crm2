import { Router } from 'express';
import { createRole, getAllRoles, getRoleById, updateRole, deleteRole } from '../controllers/roleController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;

// All role routes require authentication and admin privileges
router.use(authenticate, authorize([ADMIN_ROLE_ID]));

router.route('/roles')
  .post(createRole)
  .get(getAllRoles);

router.route('/roles/:id')
  .get(getRoleById)
  .put(updateRole)
  .delete(deleteRole);

export default router;
