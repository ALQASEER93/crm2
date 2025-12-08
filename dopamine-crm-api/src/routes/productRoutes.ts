import { Router } from 'express';
import { createProduct, getAllProducts, getProductById, updateProduct, deleteProduct } from '../controllers/productController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All product routes require authentication
router.use(authenticate);

router.route('/products')
  .post(authorize([ADMIN_ROLE_ID]), createProduct)
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getAllProducts);

router.route('/products/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getProductById)
  .put(authorize([ADMIN_ROLE_ID]), updateProduct)
  .delete(authorize([ADMIN_ROLE_ID]), deleteProduct);

export default router;
