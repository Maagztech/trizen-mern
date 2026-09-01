import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse } from '../types';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data?: T,
  statusCode = 200
): Response {
  const response: ApiSuccessResponse<T> = { success: true, message, data };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 400,
  errors?: string[]
): Response {
  const response: ApiErrorResponse = { success: false, message, errors };
  return res.status(statusCode).json(response);
}
