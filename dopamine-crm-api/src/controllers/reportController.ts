import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

// GET /api/reports/coverage
export const getCoverageReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rep_id, territory_id, start_date, end_date } = req.query;
    let sql = `
      SELECT
        u.name as rep_name,
        v.account_type,
        v.account_id,
        COUNT(v.id) as visit_count
      FROM visits v
      JOIN users u ON v.rep_id = u.id
      WHERE v.status = 'completed'
    `;
    const params = [];

    if (rep_id) {
      params.push(rep_id);
      sql += ` AND v.rep_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      sql += ` AND v.end_time >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      sql += ` AND v.end_time <= $${params.length}`;
    }
    // territory_id would require a more complex join, omitted for simplicity here

    sql += ' GROUP BY u.name, v.account_type, v.account_id ORDER BY rep_name, visit_count DESC';

    const result = await query(sql, params);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Coverage report error:', error);
    next(error);
  }
};

// GET /api/reports/rep-performance
export const getRepPerformanceReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // This is a simplified query. A real implementation would be more complex.
        const { rep_id, start_date, end_date } = req.query;
        let sql = `
            SELECT
                u.name as rep_name,
                (SELECT COUNT(*) FROM visit_plan_items WHERE plan_id IN (SELECT id FROM visit_plans WHERE rep_id = u.id)) as planned_visits,
                COUNT(v.id) as actual_visits
            FROM visits v
            JOIN users u ON v.rep_id = u.id
            WHERE v.status = 'completed'
        `;
        const params = [];

        if (rep_id) {
            params.push(rep_id);
            sql += ` AND v.rep_id = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            sql += ` AND v.end_time >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            sql += ` AND v.end_time <= $${params.length}`;
        }

        sql += ' GROUP BY u.id, u.name ORDER BY rep_name';

        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        logger.error('Rep performance report error:', error);
        next(error);
    }
};

// GET /api/reports/sales-by-product
export const getSalesByProductReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { product_id, rep_id, start_date, end_date } = req.query;
        let sql = `
            SELECT
                p.name as product_name,
                SUM(oi.quantity) as total_quantity_sold,
                SUM(oi.quantity * oi.unit_price * (1 - oi.discount)) as total_revenue
            FROM order_items oi
            JOIN products p ON oi.product_id = p.id
            JOIN orders o ON oi.order_id = o.id
            WHERE 1=1
        `;
        const params = [];

        if (product_id) {
            params.push(product_id);
            sql += ` AND oi.product_id = $${params.length}`;
        }
        if (rep_id) {
            params.push(rep_id);
            sql += ` AND o.rep_id = $${params.length}`;
        }
        if (start_date) {
            params.push(start_date);
            sql += ` AND o.ordered_at >= $${params.length}`;
        }
        if (end_date) {
            params.push(end_date);
            sql += ` AND o.ordered_at <= $${params.length}`;
        }

        sql += ' GROUP BY p.name ORDER BY total_revenue DESC';

        const result = await query(sql, params);
        res.status(200).json(result.rows);
    } catch (error) {
        logger.error('Sales by product report error:', error);
        next(error);
    }
};
