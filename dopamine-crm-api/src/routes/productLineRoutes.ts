import { Router } from 'express';
import { createProductLine, getAllProductLines, getProductLineById, updateProductLine, deleteProductLine } from '../controllers/productLineController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All product line routes require authentication
router.use(authenticate);

router.route('/product-lines')
  .post(authorize([ADMIN_ROLE_ID]), createProductLine)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllProductLines);

router.route('/product-lines/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getProductLineById)
  .put(authorize([ADMIN_ROLE_ID]), updateProductLine)
  .delete(authorize([ADMIN_ROLE_ID]), deleteProductLine);

export default router;
