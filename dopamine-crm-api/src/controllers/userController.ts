import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = await userService.createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        logger.error('Create user error:', error);
        next(error);
    }
};

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const users = await userService.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        logger.error('Get all users error:', error);
        next(error);
    }
};

export const getUserById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userService.getUserById(Number(id));
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(200).json(user);
    } catch (error) {
        logger.error('Get user by ID error:', error);
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userService.updateUser(Number(id), req.body);
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(200).json(user);
    } catch (error) {
        logger.error('Update user error:', error);
        next(error);
    }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const user = await userService.deleteUser(Number(id));
        if (!user) {
            throw new NotFoundError('User not found');
        }
        res.status(204).send();
    } catch (error) {
        logger.error('Delete user error:', error);
        next(error);
    }
};
