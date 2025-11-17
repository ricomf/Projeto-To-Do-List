import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandlerService } from '../services/error-handler.service';

/**
 * HTTP Interceptor to handle errors globally with ErrorHandlerService
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandlerService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Use ErrorHandlerService to handle HTTP errors
      const appError = errorHandler.handleHttpError(error);

      // Return the normalized error
      return throwError(() => appError);
    })
  );
};
