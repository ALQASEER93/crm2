import { Request, Response } from 'express';
import { query } from '../config/db';

export const checkHealth = async (req: Request, res: Response) => {
  try {
    const dbResult = await query('SELECT NOW()');
    res.status(200).json({
      status: 'ok',
      message: 'API is running and database is connected.',
      dbTimestamp: dbResult.rows[0].now,
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'API is running but failed to connect to the database.',
      error: (error as Error).message,
    });
  }
};
