import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

export const createProductMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { product_id, type, file_path, description } = req.body;
    const result = await query(
      'INSERT INTO product_materials (product_id, type, file_path, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [product_id, type, file_path, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create product material error:', error);
    next(error);
  }
};

export const getMaterialsForProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId } = req.params;
    const result = await query('SELECT * FROM product_materials WHERE product_id = $1', [productId]);
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get materials for product error:', error);
    next(error);
  }
};

export const getProductMaterialById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM product_materials WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product material not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Get product material by ID error:', error);
    next(error);
  }
};

export const updateProductMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type, file_path, description } = req.body;
    const result = await query(
      'UPDATE product_materials SET type=$1, file_path=$2, description=$3 WHERE id=$4 RETURNING *',
      [type, file_path, description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product material not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Update product material error:', error);
    next(error);
  }
};

export const deleteProductMaterial = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM product_materials WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product material not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Delete product material error:', error);
    next(error);
  }
};
