import { Router } from 'express';
import { createPharmacy, getAllPharmacies, getPharmacyById, updatePharmacy, deletePharmacy } from '../controllers/pharmacyController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All pharmacy routes require authentication
router.use(authenticate);

router.route('/pharmacies')
  .post(authorize([ADMIN_ROLE_ID]), createPharmacy)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllPharmacies);

router.route('/pharmacies/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getPharmacyById)
  .put(authorize([ADMIN_ROLE_ID]), updatePharmacy)
  .delete(authorize([ADMIN_ROLE_ID]), deletePharmacy);

export default router;
