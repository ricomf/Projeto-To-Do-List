import { Injectable, ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from './logger.service';
import { ToastService } from './toast.service';
import {
  AppError,
  AuthenticationError,
  ValidationError,
  NetworkError,
  DatabaseError,
  UnexpectedError,
  ErrorMessages,
  ServerError,
  NotFoundError,
  TimeoutError,
  InvalidCredentialsError,
  TokenExpiredError,
  UnauthorizedError,
  ConflictError
} from '../models/errors.model';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService implements ErrorHandler {
  private isOnline = navigator.onLine;

  constructor(
    private logger: LoggerService,
    private toast: ToastService
  ) {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.toast.showOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.toast.showOffline();
    });
  }

  /**
   * Global error handler (implements Angular ErrorHandler)
   */
  handleError(error: any): void {
    const appError = this.normalizeError(error);

    // Log the error
    this.logError(appError);

    // Show user-friendly message
    this.showErrorToUser(appError);

    // Report to monitoring service in production
    this.reportError(appError);
  }

  /**
   * Handle HTTP errors specifically
   */
  handleHttpError(error: HttpErrorResponse): AppError {
    let appError: AppError;

    // Check if offline
    if (!this.isOnline) {
      appError = new NetworkError('Você está offline. Verifique sua conexão.', 0);
      this.showErrorToUser(appError);
      return appError;
    }

    // Handle different status codes
    switch (error.status) {
      case 0:
        // Network error (CORS, connection refused, etc.)
        appError = new NetworkError(
          'Não foi possível conectar ao servidor.',
          0,
          error.url || undefined
        );
        break;

      case 400:
        // Bad request - validation error
        appError = new ValidationError(
          error.error?.message || 'Dados inválidos',
          error.error?.fields
        );
        break;

      case 401:
        // Unauthorized
        if (error.error?.code === 'TOKEN_EXPIRED') {
          appError = new TokenExpiredError();
        } else if (error.error?.code === 'INVALID_CREDENTIALS') {
          appError = new InvalidCredentialsError();
        } else {
          appError = new UnauthorizedError(error.error?.message);
        }
        break;

      case 403:
        // Forbidden
        appError = new UnauthorizedError('Acesso negado a este recurso.');
        break;

      case 404:
        // Not found
        appError = new NotFoundError(
          error.error?.message || 'Recurso não encontrado',
          error.url || undefined
        );
        break;

      case 408:
        // Timeout
        appError = new TimeoutError(
          'Tempo de requisição esgotado',
          error.url || undefined
        );
        break;

      case 409:
        // Conflict
        appError = new ConflictError(error.error?.message || 'Recurso já existe');
        break;

      case 422:
        // Unprocessable entity - validation error
        appError = new ValidationError(
          error.error?.message || 'Dados não podem ser processados',
          error.error?.fields
        );
        break;

      case 429:
        // Too many requests
        appError = new NetworkError(
          'Muitas requisições. Aguarde um momento.',
          429,
          error.url || undefined
        );
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        appError = new ServerError(
          error.error?.message || 'Erro no servidor. Tente novamente mais tarde.',
          error.status,
          error.url || undefined
        );
        break;

      default:
        appError = new NetworkError(
          error.error?.message || `Erro HTTP ${error.status}`,
          error.status,
          error.url || undefined
        );
    }

    this.logError(appError);
    return appError;
  }

  /**
   * Normalize any error to AppError
   */
  private normalizeError(error: any): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // HTTP error
    if (error instanceof HttpErrorResponse) {
      return this.handleHttpError(error);
    }

    // Standard Error
    if (error instanceof Error) {
      return new UnexpectedError(error.message, error);
    }

    // String error
    if (typeof error === 'string') {
      return new UnexpectedError(error);
    }

    // Unknown error type
    return new UnexpectedError('Ocorreu um erro desconhecido', error);
  }

  /**
   * Log error with appropriate level
   */
  private logError(error: AppError): void {
    const context = error.constructor.name;

    if (!error.isOperational) {
      // Non-operational errors are fatal
      this.logger.fatal(error.message, context, {
        code: error.code,
        stack: error.stack,
        timestamp: error.timestamp
      });
    } else {
      // Operational errors
      this.logger.error(error.message, context, {
        code: error.code,
        timestamp: error.timestamp,
        ...(error instanceof ValidationError && { fields: error.fields }),
        ...(error instanceof NetworkError && {
          statusCode: error.statusCode,
          url: error.url
        }),
        ...(error instanceof DatabaseError && { query: error.query })
      });
    }
  }

  /**
   * Show user-friendly error message
   */
  private showErrorToUser(error: AppError): void {
    let message = error.message;

    // Use predefined user-friendly messages
    if (ErrorMessages[error.code]) {
      message = ErrorMessages[error.code];
    }

    // Add additional context for validation errors
    if (error instanceof ValidationError && error.fields) {
      const fieldErrors: string[] = [];
      Object.values(error.fields).forEach(errors => {
        fieldErrors.push(...errors);
      });
      if (fieldErrors.length > 0) {
        message += ': ' + fieldErrors.join(', ');
      }
    }

    // Show toast based on error severity
    if (error instanceof AuthenticationError) {
      this.toast.error(message, 5000);
    } else if (error instanceof ValidationError) {
      this.toast.warning(message, 4000);
    } else if (error instanceof NetworkError) {
      this.toast.error(message, 4000);
    } else if (!error.isOperational) {
      this.toast.error('Ocorreu um erro grave. Por favor, reinicie o aplicativo.', 6000);
    } else {
      this.toast.error(message, 4000);
    }
  }

  /**
   * Report error to monitoring service
   */
  private reportError(error: AppError): void {
    // Only report non-operational or severe errors
    if (!error.isOperational || error instanceof ServerError) {
      // TODO: Send to error monitoring service (Sentry, etc.)
      this.logger.info('Error reported to monitoring service', 'ErrorHandlerService', {
        errorCode: error.code,
        errorMessage: error.message
      });
    }
  }

  /**
   * Handle async errors
   */
  async handleAsyncError<T>(
    promise: Promise<T>,
    fallbackValue?: T,
    context?: string
  ): Promise<T | undefined> {
    try {
      return await promise;
    } catch (error) {
      const appError = this.normalizeError(error);
      this.logError(appError);
      this.showErrorToUser(appError);

      if (context) {
        this.logger.debug(`Async error in ${context}`, 'ErrorHandlerService', {
          fallbackValue
        });
      }

      return fallbackValue;
    }
  }

  /**
   * Wrap function with error handling
   */
  wrapWithErrorHandler<T extends (...args: any[]) => any>(
    fn: T,
    context?: string
  ): T {
    return ((...args: any[]) => {
      try {
        const result = fn(...args);

        // Handle promises
        if (result instanceof Promise) {
          return this.handleAsyncError(result, undefined, context || fn.name);
        }

        return result;
      } catch (error) {
        this.handleError(error);
        return undefined;
      }
    }) as T;
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(error: any): boolean {
    const appError = this.normalizeError(error);
    return appError.isOperational;
  }

  /**
   * Get error details for debugging
   */
  getErrorDetails(error: any): any {
    const appError = this.normalizeError(error);
    return appError.toJSON ? appError.toJSON() : { error };
  }
}
