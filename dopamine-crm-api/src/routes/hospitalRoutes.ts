import { Router } from 'express';
import { createHospital, getAllHospitals, getHospitalById, updateHospital, deleteHospital } from '../controllers/hospitalController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All hospital routes require authentication
router.use(authenticate);

router.route('/hospitals')
  .post(authorize([ADMIN_ROLE_ID]), createHospital)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllHospitals);

router.route('/hospitals/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getHospitalById)
  .put(authorize([ADMIN_ROLE_ID]), updateHospital)
  .delete(authorize([ADMIN_ROLE_ID]), deleteHospital);

export default router;
