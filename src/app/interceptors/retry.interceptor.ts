import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError, timer, retry, retryWhen, mergeMap } from 'rxjs';
import { LoggerService } from '../services/logger.service';

/**
 * Configuration for retry strategy
 */
export interface RetryConfig {
  maxRetries: number;
  excludedStatusCodes: number[];
  scalingDuration: number;
  shouldRetry: (error: HttpErrorResponse, retryCount: number) => boolean;
}

/**
 * Default retry configuration
 */
const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  excludedStatusCodes: [400, 401, 403, 404, 422], // Don't retry client errors
  scalingDuration: 1000, // Base delay in ms
  shouldRetry: (error: HttpErrorResponse, retryCount: number) => {
    // Only retry network errors and server errors (5xx)
    return error.status >= 500 || error.status === 0;
  }
};

/**
 * HTTP Interceptor with exponential backoff retry strategy
 */
export const retryInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const config = defaultRetryConfig;

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap((error: HttpErrorResponse, retryCount: number) => {
          // Check if we should retry
          if (
            retryCount >= config.maxRetries ||
            !config.shouldRetry(error, retryCount) ||
            config.excludedStatusCodes.includes(error.status)
          ) {
            logger.warn(
              `Not retrying request after ${retryCount} attempts`,
              'RetryInterceptor',
              {
                url: req.url,
                status: error.status,
                retryCount
              }
            );
            return throwError(() => error);
          }

          // Calculate exponential backoff delay
          const delayMs = config.scalingDuration * Math.pow(2, retryCount);

          logger.info(
            `Retrying request (${retryCount + 1}/${config.maxRetries})`,
            'RetryInterceptor',
            {
              url: req.url,
              status: error.status,
              delayMs
            }
          );

          // Retry after delay
          return timer(delayMs);
        })
      )
    )
  );
};

/**
 * Create custom retry interceptor with specific configuration
 */
export function createRetryInterceptor(customConfig: Partial<RetryConfig>): HttpInterceptorFn {
  const config = { ...defaultRetryConfig, ...customConfig };

  return (req, next) => {
    const logger = inject(LoggerService);

    return next(req).pipe(
      retryWhen(errors =>
        errors.pipe(
          mergeMap((error: HttpErrorResponse, retryCount: number) => {
            if (
              retryCount >= config.maxRetries ||
              !config.shouldRetry(error, retryCount) ||
              config.excludedStatusCodes.includes(error.status)
            ) {
              return throwError(() => error);
            }

            const delayMs = config.scalingDuration * Math.pow(2, retryCount);

            logger.info(
              `Retrying request (${retryCount + 1}/${config.maxRetries})`,
              'RetryInterceptor',
              { url: req.url, delayMs }
            );

            return timer(delayMs);
          })
        )
      )
    );
  };
}

/**
 * Retry interceptor for idempotent requests only (GET, HEAD, OPTIONS)
 */
export const idempotentRetryInterceptor: HttpInterceptorFn = (req, next) => {
  const logger = inject(LoggerService);
  const config = defaultRetryConfig;

  // Only retry safe/idempotent methods
  const idempotentMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (!idempotentMethods.includes(req.method)) {
    return next(req);
  }

  return next(req).pipe(
    retryWhen(errors =>
      errors.pipe(
        mergeMap((error: HttpErrorResponse, retryCount: number) => {
          if (
            retryCount >= config.maxRetries ||
            !config.shouldRetry(error, retryCount) ||
            config.excludedStatusCodes.includes(error.status)
          ) {
            logger.warn(
              `Retry failed for ${req.method} request`,
              'IdempotentRetryInterceptor',
              {
                url: req.url,
                retryCount
              }
            );
            return throwError(() => error);
          }

          const delayMs = config.scalingDuration * Math.pow(2, retryCount);

          logger.info(
            `Retrying ${req.method} request (${retryCount + 1}/${config.maxRetries})`,
            'IdempotentRetryInterceptor',
            { url: req.url, delayMs }
          );

          return timer(delayMs);
        })
      )
    )
  );
};

/**
 * Aggressive retry for critical endpoints
 */
export const aggressiveRetryInterceptor: HttpInterceptorFn = createRetryInterceptor({
  maxRetries: 5,
  scalingDuration: 500,
  shouldRetry: (error, retryCount) => {
    // Retry on network errors and server errors
    return error.status >= 500 || error.status === 0;
  }
});

/**
 * Gentle retry for non-critical operations
 */
export const gentleRetryInterceptor: HttpInterceptorFn = createRetryInterceptor({
  maxRetries: 2,
  scalingDuration: 2000,
  shouldRetry: (error, retryCount) => {
    // Only retry on network errors
    return error.status === 0;
  }
});
