import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiRequestOptions {
  headers?: HttpHeaders | { [header: string]: string | string[] };
  params?: HttpParams | { [param: string]: string | string[] };
  observe?: 'body';
  responseType?: 'json';
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .get<T>(`${this.apiUrl}/${endpoint}`, options)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .post<T>(`${this.apiUrl}/${endpoint}`, data, options)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .put<T>(`${this.apiUrl}/${endpoint}`, data, options)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * PATCH request
   */
  patch<T>(endpoint: string, data: any, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .patch<T>(`${this.apiUrl}/${endpoint}`, data, options)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    return this.http
      .delete<T>(`${this.apiUrl}/${endpoint}`, options)
      .pipe(
        map(response => response),
        catchError(this.handleError)
      );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'Ocorreu um erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Erro ${error.status}: ${error.statusText}`;
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
