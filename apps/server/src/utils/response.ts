import { Response } from 'express';

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  message?: string
): void {
  res.status(statusCode).json({
    success: true,
    data,
    ...(message ? { message } : {}),
  });
}

export function sendError(
  res: Response,
  error: string,
  code = 'BAD_REQUEST',
  statusCode = 400,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    error,
    code,
    ...(details !== undefined ? { details } : {}),
  });
}

