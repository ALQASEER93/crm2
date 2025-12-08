import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/userService';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const token = await authService.login(email, password);

    if (!token) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ token });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};
