import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

// --- Visit Plans ---

export const createVisitPlan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rep_id, period_start, period_end, status } = req.body;
    const result = await query(
      'INSERT INTO visit_plans (rep_id, period_start, period_end, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [rep_id, period_start, period_end, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create visit plan error:', error);
    next(error);
  }
};

export const getVisitPlansForRep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { repId } = req.params;
    const result = await query('SELECT * FROM visit_plans WHERE rep_id = $1', [repId]);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get visit plans for rep error:', error);
    next(error);
  }
};

export const addVisitPlanItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { plan_id, account_type, account_id, target_visits } = req.body;
        const result = await query(
            'INSERT INTO visit_plan_items (plan_id, account_type, account_id, target_visits) VALUES ($1, $2, $3, $4) RETURNING *',
            [plan_id, account_type, account_id, target_visits]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Add visit plan item error:', error);
        next(error);
    }
};

// --- Visits ---

export const getTodayVisitsForRep = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params; // rep_id
        const result = await query(
            "SELECT * FROM visits WHERE rep_id = $1 AND DATE(planned_at) = CURRENT_DATE",
            [id]
        );
        res.status(200).json(result.rows);
    } catch (error) {
        logger.error('Get today visits error:', error);
        next(error);
    }
};

export const startVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { rep_id, account_type, account_id, planned_at, location_lat, location_lng, visit_type } = req.body;
        const result = await query(
            'INSERT INTO visits (rep_id, account_type, account_id, planned_at, start_time, location_lat, location_lng, visit_type, status) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8) RETURNING *',
            [rep_id, account_type, account_id, planned_at, location_lat, location_lng, visit_type, 'in_progress']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Start visit error:', error);
        next(error);
    }
};

export const finishVisit = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { visitId } = req.params;
        const { notes, visit_items } = req.body; // visit_items is an array of { product_id, samples_qty, ... }

        // Update visit notes and status
        const visitResult = await query(
            "UPDATE visits SET notes = $1, end_time = NOW(), status = 'completed' WHERE id = $2 RETURNING *",
            [notes, visitId]
        );

        if (visitResult.rows.length === 0) {
            return res.status(404).json({ message: 'Visit not found' });
        }

        // Insert visit items if any
        if (visit_items && visit_items.length > 0) {
            for (const item of visit_items) {
                await query(
                    'INSERT INTO visit_items (visit_id, product_id, samples_qty, promo_materials, notes) VALUES ($1, $2, $3, $4, $5)',
                    [visitId, item.product_id, item.samples_qty, item.promo_materials, item.notes]
                );
            }
        }

        res.status(200).json(visitResult.rows[0]);
    } catch (error) {
        logger.error('Finish visit error:', error);
        next(error);
    }
};
