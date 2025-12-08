import { Router } from 'express';
import { createDoctor, getAllDoctors, getDoctorById, updateDoctor, deleteDoctor } from '../controllers/doctorController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All doctor routes require authentication
router.use(authenticate);

router.route('/doctors')
  .post(authorize([ADMIN_ROLE_ID]), createDoctor)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllDoctors);

router.route('/doctors/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getDoctorById)
  .put(authorize([ADMIN_ROLE_ID]), updateDoctor)
  .delete(authorize([ADMIN_ROLE_ID]), deleteDoctor);

export default router;
