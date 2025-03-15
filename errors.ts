// Error types for structured error handling

// Define a Result type that can contain either a success value or an error
export type Result<T, E = Error> = 
  | { success: true; value: T } 
  | { success: false; error: E };

// Add a declaration for Error.captureStackTrace which exists in Node.js
declare global {
  interface ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void;
  }
}

/**
 * Base application error class that all specific error types extend
 */
export class AppError extends Error {
  /**
   * @param message Error message
   * @param cause Optional underlying cause of the error
   */
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Gets the original error if available
   */
  public getOriginalError(): Error | null {
    return this.cause instanceof Error ? this.cause : null;
  }

  /**
   * Creates a user-friendly error message
   */
  public toUserFriendlyMessage(): string {
    return this.message;
  }
}

/**
 * Error related to configuration issues
 */
export class ConfigError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error related to file system operations
 */
export class FileSystemError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error related to API requests (GitHub, etc.)
 */
export class ApiError extends AppError {
  public readonly status?: number;

  constructor(message: string, cause?: unknown, status?: number) {
    super(message, cause);
    this.status = status;
  }

  public static fromError(error: unknown): ApiError {
    const errorObj = error as { status?: number; message?: string };
    const errorMessage = errorObj.message || 'Unknown API error';
    const statusCode = errorObj.status;
    
    return new ApiError(errorMessage, error, statusCode);
  }

  public toUserFriendlyMessage(): string {
    let message = this.message;
    if (this.status) {
      if (this.status === 404) {
        return `Resource not found (404): ${this.message}`;
      } else if (this.status === 403) {
        return `Permission denied (403): ${this.message}`;
      } else if (this.status === 422) {
        return `Invalid request (422): ${this.message}`;
      }
      message = `${message} (Status: ${this.status})`;
    }
    return message;
  }
}

/**
 * Error related to parsing operations
 */
export class ParseError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error related to LLM/AI operations
 */
export class LLMError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error for workflow-related operations
 */
export class WorkflowError extends ApiError {
  constructor(message: string, cause?: unknown, status?: number) {
    super(message, cause, status);
  }

  public static fromApiError(error: unknown, workflowName: string): WorkflowError {
    const apiError = ApiError.fromError(error);
    
    let message = `Failed to run ${workflowName} workflow`;
    if (apiError.status === 404) {
      message = `${message}: Workflow file not found or inaccessible`;
    } else if (apiError.status === 403) {
      message = `${message}: Permission denied to access or trigger workflow`;
    } else if (apiError.status === 422) {
      message = `${message}: Request validation failed, please check workflow configuration`;
    } else {
      message = `${message}: ${apiError.message}`;
    }
    
    return new WorkflowError(message, error, apiError.status);
  }
} 