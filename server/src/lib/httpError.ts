/**
 * Custom Error class that includes an HTTP status code.
 * Using a dedicated class allows for reliable 'instanceof' checks 
 * within our global error handling middleware.
 */
export class HttpError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;

    /**
     * Fix for the prototype chain when extending built-in Error in TS.
     * Ensures 'instanceof HttpError' works correctly at runtime.
     */
    Object.setPrototypeOf(this, new.target.prototype);
  }
}