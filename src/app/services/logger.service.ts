import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  data?: any;
  stack?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private logLevel: LogLevel = environment.production ? LogLevel.INFO : LogLevel.DEBUG;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Limite de logs em memória
  private sensitiveKeys = ['password', 'token', 'refreshToken', 'authorization', 'apiKey', 'secret'];

  constructor() {
    console.log('[LoggerService] Initialized with level:', LogLevel[this.logLevel]);
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  /**
   * Log info message
   */
  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  /**
   * Log error message
   */
  error(message: string, context?: string, error?: any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log(LogLevel.ERROR, message, context, error, stack);
  }

  /**
   * Log fatal error
   */
  fatal(message: string, context?: string, error?: any): void {
    const stack = error instanceof Error ? error.stack : undefined;
    this.log(LogLevel.FATAL, message, context, error, stack);
  }

  /**
   * Central logging method
   */
  private log(level: LogLevel, message: string, context?: string, data?: any, stack?: string): void {
    // Skip if level is below configured threshold
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
      data: this.sanitizeData(data),
      stack
    };

    // Store in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }

    // Output to console
    this.consoleOutput(entry);

    // Send to remote logging service in production
    if (environment.production && level >= LogLevel.ERROR) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: any): any {
    if (!data) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeData(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const sanitized: any = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          const lowerKey = key.toLowerCase();

          // Check if key contains sensitive information
          const isSensitive = this.sensitiveKeys.some(sensitiveKey =>
            lowerKey.includes(sensitiveKey.toLowerCase())
          );

          if (isSensitive) {
            sanitized[key] = '***REDACTED***';
          } else if (typeof data[key] === 'object') {
            sanitized[key] = this.sanitizeData(data[key]);
          } else {
            sanitized[key] = data[key];
          }
        }
      }
      return sanitized;
    }

    return data;
  }

  /**
   * Output log to console
   */
  private consoleOutput(entry: LogEntry): void {
    const prefix = `[${this.formatTimestamp(entry.timestamp)}] [${LogLevel[entry.level]}]`;
    const contextStr = entry.context ? ` [${entry.context}]` : '';
    const message = `${prefix}${contextStr} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.data || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.data || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.data || '', entry.stack || '');
        break;
    }
  }

  /**
   * Format timestamp
   */
  private formatTimestamp(date: Date): string {
    return date.toISOString();
  }

  /**
   * Send logs to remote service
   */
  private sendToRemote(entry: LogEntry): void {
    // TODO: Implement remote logging service integration
    // Example: Sentry, LogRocket, CloudWatch, etc.
    console.log('[LoggerService] Would send to remote:', entry);
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level);
    }
    return [...this.logs];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.info('Logs cleared', 'LoggerService');
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Download logs as file
   */
  downloadLogs(): void {
    const blob = new Blob([this.exportLogs()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `app-logs-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.info('Logs downloaded', 'LoggerService');
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
    this.info(`Log level changed to ${LogLevel[level]}`, 'LoggerService');
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Get log statistics
   */
  getStatistics(): { [key: string]: number } {
    const stats: { [key: string]: number } = {
      total: this.logs.length,
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
      fatal: 0
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level].toLowerCase();
      stats[levelName]++;
    });

    return stats;
  }
}
