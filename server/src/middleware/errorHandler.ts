import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

/**
 * Global Express error-handling middleware.
 * * Note: Express identifies error handlers by their arity (4 parameters). 
 * Do not remove the unused 'next' parameter, or Express will treat this 
 * as standard middleware and skip it during error propagation.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Handle intentional business-logic errors (e.g. 404, 400)
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  // Log unexpected system errors for server-side debugging
  console.error('[Unhandled Error]:', err);

  res.status(500).json({
    error: 'Internal server error',
    // Provide additional detail only in non-production environments
    ...(process.env.NODE_ENV !== 'production' && {
      detail: err instanceof Error ? err.message : String(err),
    }),
  });
}