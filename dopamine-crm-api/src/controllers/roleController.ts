import { Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import logger from '../utils/logger';

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, permissions_json } = req.body;
    const result = await query(
      'INSERT INTO roles (name, permissions_json) VALUES ($1, $2) RETURNING *',
      [name, permissions_json]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    logger.error('Create role error:', error);
    next(error);
  }
};

export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT * FROM roles');
    res.status(200).json(result.rows);
  } catch (error) {
    logger.error('Get all roles error:', error);
    next(error);
  }
};

export const getRoleById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM roles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Get role by ID error:', error);
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, permissions_json } = req.body;
    const result = await query(
      'UPDATE roles SET name = $1, permissions_json = $2 WHERE id = $3 RETURNING *',
      [name, permissions_json, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    logger.error('Update role error:', error);
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(204).send();
  } catch (error) {
    logger.error('Delete role error:', error);
    next(error);
  }
};
