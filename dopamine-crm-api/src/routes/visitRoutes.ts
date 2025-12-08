import { Router } from 'express';
import {
  createVisitPlan,
  getVisitPlansForRep,
  addVisitPlanItem,
  getTodayVisitsForRep,
  startVisit,
  finishVisit
} from '../controllers/visitController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All visit routes require authentication
router.use(authenticate);

// --- Visit Plans ---
router.route('/visit-plans')
  .post(authorize([ADMIN_ROLE_ID]), createVisitPlan);

router.route('/reps/:repId/visit-plans')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getVisitPlansForRep); // Reps can only get their own, logic in service layer later

router.route('/visit-plan-items')
    .post(authorize([ADMIN_ROLE_ID]), addVisitPlanItem);


// --- Visits ---
router.route('/reps/:id/today-visits')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getTodayVisitsForRep);

router.route('/visits/start')
  .post(authorize([REP_ROLE_ID]), startVisit);

router.route('/visits/:visitId/finish')
  .post(authorize([REP_ROLE_ID]), finishVisit);


export default router;
