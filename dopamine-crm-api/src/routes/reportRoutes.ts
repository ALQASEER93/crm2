import { Router } from 'express';
import { getCoverageReport, getRepPerformanceReport, getSalesByProductReport } from '../controllers/reportController';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();
const ADMIN_ROLE_ID = 1;

// All report routes require authentication and admin privileges
router.use(authenticate, authorize([ADMIN_ROLE_ID]));

router.get('/reports/coverage', getCoverageReport);
router.get('/reports/rep-performance', getRepPerformanceReport);
router.get('/reports/sales-by-product', getSalesByProductReport);

export default router;
