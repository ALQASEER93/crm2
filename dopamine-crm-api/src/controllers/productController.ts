import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, molecule, line_id, price, status } = req.body;
    const result = await query(
      'INSERT INTO products (name, code, molecule, line_id, price, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, code, molecule, line_id, price, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create product error:', error);
    next(error);
  }
};

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM products');
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get all products error:', error);
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Get product by ID error:', error);
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, molecule, line_id, price, status } = req.body;
    const result = await query(
      'UPDATE products SET name=$1, code=$2, molecule=$3, line_id=$4, price=$5, status=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, code, molecule, line_id, price, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Update product error:', error);
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Delete product error:', error);
    next(error);
  }
};
