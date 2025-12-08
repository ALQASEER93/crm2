import { Router } from 'express';
import { createOrder, getAllOrders } from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All order routes require authentication
router.use(authenticate);

router.route('/orders')
  .post(authorize([REP_ROLE_ID]), createOrder)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllOrders);

export default router;
