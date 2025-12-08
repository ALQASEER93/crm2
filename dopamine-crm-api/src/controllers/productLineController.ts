import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

export const createProductLine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    const result = await query(
      'INSERT INTO product_lines (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create product line error:', error);
    next(error);
  }
};

export const getAllProductLines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM product_lines');
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get all product lines error:', error);
    next(error);
  }
};

export const getProductLineById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM product_lines WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product line not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Get product line by ID error:', error);
    next(error);
  }
};

export const updateProductLine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const result = await query(
      'UPDATE product_lines SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product line not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Update product line error:', error);
    next(error);
  }
};

export const deleteProductLine = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM product_lines WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product line not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Delete product line error:', error);
    next(error);
  }
};
