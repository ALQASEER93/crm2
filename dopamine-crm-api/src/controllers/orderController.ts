import { Request, Response, NextFunction } from 'express';
import pool, { query } from '../config/db';
import logger from '../utils/logger';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { customer_type, customer_id, rep_id, status, order_items } = req.body;
    let total_amount = 0;

    // Calculate total amount from order items
    if (order_items && order_items.length > 0) {
      total_amount = order_items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unit_price * (1 - (item.discount || 0)));
      }, 0);
    }

    // Insert the order
    const orderResult = await client.query(
      'INSERT INTO orders (customer_type, customer_id, rep_id, status, total_amount) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [customer_type, customer_id, rep_id, status, total_amount]
    );
    const newOrder = orderResult.rows[0];

    // Insert order items
    if (order_items && order_items.length > 0) {
      for (const item of order_items) {
        await client.query(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price, discount) VALUES ($1, $2, $3, $4, $5)',
          [newOrder.id, item.product_id, item.quantity, item.unit_price, item.discount]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(newOrder);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create order error:', error);
    next(error);
  } finally {
    client.release();
  }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rep_id, customer_id, status, start_date, end_date } = req.query;
    let queryString = 'SELECT * FROM orders WHERE 1=1';
    const queryParams = [];

    if (rep_id) {
      queryParams.push(rep_id);
      queryString += ` AND rep_id = $${queryParams.length}`;
    }
    if (customer_id) {
      queryParams.push(customer_id);
      queryString += ` AND customer_id = $${queryParams.length}`;
    }
    if (status) {
      queryParams.push(status);
      queryString += ` AND status = $${queryParams.length}`;
    }
    if (start_date) {
        queryParams.push(start_date);
        queryString += ` AND ordered_at >= $${queryParams.length}`;
    }
    if (end_date) {
        queryParams.push(end_date);
        queryString += ` AND ordered_at <= $${queryParams.length}`;
    }

    const result = await query(queryString, queryParams);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get all orders error:', error);
    next(error);
  }
};
