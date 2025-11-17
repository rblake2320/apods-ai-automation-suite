/**
 * Custom API Error Class
 * Extends the native Error class to include HTTP status codes and additional metadata
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors?: any[];

  /**
   * Creates an instance of ApiError
   * @param statusCode - HTTP status code
   * @param message - Error message
   * @param isOperational - Whether the error is operational (true) or programming (false)
   * @param errors - Additional error details (e.g., validation errors)
   * @param stack - Stack trace
   */
  constructor(
    statusCode: number,
    message: string,
    isOperational = true,
    errors?: any[],
    stack = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /**
   * Creates a 400 Bad Request error
   */
  static badRequest(message: string, errors?: any[]): ApiError {
    return new ApiError(400, message, true, errors);
  }

  /**
   * Creates a 401 Unauthorized error
   */
  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  /**
   * Creates a 403 Forbidden error
   */
  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  /**
   * Creates a 404 Not Found error
   */
  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  /**
   * Creates a 409 Conflict error
   */
  static conflict(message: string): ApiError {
    return new ApiError(409, message);
  }

  /**
   * Creates a 422 Unprocessable Entity error
   */
  static validationError(message: string, errors?: any[]): ApiError {
    return new ApiError(422, message, true, errors);
  }

  /**
   * Creates a 429 Too Many Requests error
   */
  static tooManyRequests(message = 'Too many requests'): ApiError {
    return new ApiError(429, message);
  }

  /**
   * Creates a 500 Internal Server Error
   */
  static internal(message = 'Internal server error'): ApiError {
    return new ApiError(500, message, false);
  }

  /**
   * Creates a 503 Service Unavailable error
   */
  static serviceUnavailable(message = 'Service unavailable'): ApiError {
    return new ApiError(503, message);
  }

  /**
   * Converts the error to a JSON object
   */
  toJSON() {
    return {
      status: 'error',
      statusCode: this.statusCode,
      message: this.message,
      ...(this.errors && { errors: this.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    };
  }
}
