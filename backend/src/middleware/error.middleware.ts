import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  errors?: string[];

  constructor(message: string, statusCode = 400, errors?: string[]) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function notFoundHandler(_req: Request, res: Response): Response {
  return sendError(res, 'Resource not found', 404);
}

export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode, err.errors);
  }

  logger.error('Unhandled error', err);

  const message = env.isProduction ? 'Internal server error' : err.message;
  return sendError(res, message, 500);
}
