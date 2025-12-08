import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong';

  logger.error(err.message, {
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Ensure isOperational flag is set for client-facing errors you create intentionally
  if (err.isOperational) {
    res.status(statusCode).json({
      status: 'error',
      message,
    });
  } else {
    // For unexpected errors, send a generic message
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

export default errorHandler;
