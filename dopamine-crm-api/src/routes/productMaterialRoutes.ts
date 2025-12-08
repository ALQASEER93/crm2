import { Router } from 'express';
import {
  createProductMaterial,
  getMaterialsForProduct,
  getProductMaterialById,
  updateProductMaterial,
  deleteProductMaterial
} from '../controllers/productMaterialController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;
const REP_ROLE_ID = 2;

// All product material routes require authentication
router.use(authenticate);

router.route('/product-materials')
  .post(authorize([ADMIN_ROLE_ID]), createProductMaterial);

router.route('/products/:productId/materials')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getMaterialsForProduct);

router.route('/product-materials/:id')
  .get(authorize([ADMIN_ROLE_ID, REP_ROLE_ID]), getProductMaterialById)
  .put(authorize([ADMIN_ROLE_ID]), updateProductMaterial)
  .delete(authorize([ADMIN_ROLE_ID]), deleteProductMaterial);

export default router;
