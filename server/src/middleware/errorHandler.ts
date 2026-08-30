import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error',
    code: err.code || 'SERVER_ERROR'
  });
}
