import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp: Date;
  responseTime?: number;
  details?: any;
}

export interface SystemInfo {
  platform: string;
  isNative: boolean;
  isWeb: boolean;
  isAndroid: boolean;
  isIOS: boolean;
  appVersion: string;
  environment: string;
  deviceInfo: {
    userAgent: string;
    language: string;
    online: boolean;
    cookieEnabled: boolean;
  };
  memoryInfo?: {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  };
}

export interface DiagnosticReport {
  timestamp: Date;
  systemInfo: SystemInfo;
  healthChecks: HealthCheck[];
  performanceMetrics: PerformanceMetrics;
  errors: any[];
  warnings: any[];
}

export interface PerformanceMetrics {
  navigation?: {
    domContentLoaded: number;
    loadComplete: number;
    firstContentfulPaint?: number;
  };
  memory?: {
    used: number;
    limit: number;
    percentage: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class DiagnosticService {
  private healthChecks = new BehaviorSubject<HealthCheck[]>([]);
  public healthChecks$ = this.healthChecks.asObservable();

  private isMonitoring = false;
  private monitoringInterval: any;

  constructor(
    private platform: Platform,
    private logger: LoggerService,
    private database: DatabaseService,
    private authService: AuthService
  ) {
    this.logger.info('DiagnosticService initialized', 'DiagnosticService');
  }

  /**
   * Run all health checks
   */
  async runHealthChecks(): Promise<HealthCheck[]> {
    this.logger.info('Running health checks', 'DiagnosticService');

    const checks: HealthCheck[] = [
      await this.checkDatabase(),
      await this.checkAuthentication(),
      await this.checkStorage(),
      await this.checkNetwork(),
      this.checkMemory(),
      this.checkPlatform()
    ];

    this.healthChecks.next(checks);
    this.logger.info('Health checks completed', 'DiagnosticService', {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length
    });

    return checks;
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      await this.database.initialize();
      const tables = await this.database.listTables();

      const responseTime = Date.now() - startTime;

      return {
        service: 'Database',
        status: 'healthy',
        message: 'Database is operational',
        timestamp: new Date(),
        responseTime,
        details: {
          tables: tables.length
        }
      };
    } catch (error) {
      return {
        service: 'Database',
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: { error: String(error) }
      };
    }
  }

  /**
   * Check authentication service
   */
  private async checkAuthentication(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const isAuthenticated = this.authService.isAuthenticated;
      const user = this.authService.currentUserValue;

      return {
        service: 'Authentication',
        status: 'healthy',
        message: isAuthenticated ? 'User authenticated' : 'No active session',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          isAuthenticated,
          userId: user?.id
        }
      };
    } catch (error) {
      return {
        service: 'Authentication',
        status: 'degraded',
        message: 'Authentication service error',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: { error: String(error) }
      };
    }
  }

  /**
   * Check local storage
   */
  private async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const testKey = '__storage_test__';
      const testValue = 'test';

      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      if (retrieved !== testValue) {
        throw new Error('Storage read/write failed');
      }

      // Estimate storage usage
      let storageSize = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          storageSize += localStorage[key].length + key.length;
        }
      }

      return {
        service: 'Storage',
        status: 'healthy',
        message: 'Local storage is operational',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: {
          estimatedSize: `${(storageSize / 1024).toFixed(2)} KB`,
          itemCount: localStorage.length
        }
      };
    } catch (error) {
      return {
        service: 'Storage',
        status: 'unhealthy',
        message: 'Local storage unavailable',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: { error: String(error) }
      };
    }
  }

  /**
   * Check network connectivity
   */
  private async checkNetwork(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      const online = navigator.onLine;

      if (!online) {
        return {
          service: 'Network',
          status: 'unhealthy',
          message: 'Device is offline',
          timestamp: new Date(),
          responseTime: Date.now() - startTime
        };
      }

      // Try to fetch a lightweight resource
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      try {
        await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal
        });
        clearTimeout(timeout);

        return {
          service: 'Network',
          status: 'healthy',
          message: 'Network connection is active',
          timestamp: new Date(),
          responseTime: Date.now() - startTime
        };
      } catch (fetchError) {
        clearTimeout(timeout);
        return {
          service: 'Network',
          status: 'degraded',
          message: 'Network connectivity issues',
          timestamp: new Date(),
          responseTime: Date.now() - startTime,
          details: { error: String(fetchError) }
        };
      }
    } catch (error) {
      return {
        service: 'Network',
        status: 'unhealthy',
        message: 'Network check failed',
        timestamp: new Date(),
        responseTime: Date.now() - startTime,
        details: { error: String(error) }
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): HealthCheck {
    try {
      const performance = (window.performance as any);

      if (performance && performance.memory) {
        const memory = performance.memory;
        const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;

        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        let message = 'Memory usage is normal';

        if (usedPercentage > 90) {
          status = 'unhealthy';
          message = 'Memory usage is critical';
        } else if (usedPercentage > 70) {
          status = 'degraded';
          message = 'Memory usage is high';
        }

        return {
          service: 'Memory',
          status,
          message,
          timestamp: new Date(),
          details: {
            used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
            limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
            percentage: `${usedPercentage.toFixed(2)}%`
          }
        };
      }

      return {
        service: 'Memory',
        status: 'healthy',
        message: 'Memory monitoring not available',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        service: 'Memory',
        status: 'degraded',
        message: 'Memory check failed',
        timestamp: new Date(),
        details: { error: String(error) }
      };
    }
  }

  /**
   * Check platform
   */
  private checkPlatform(): HealthCheck {
    try {
      const platforms = this.platform.platforms();

      return {
        service: 'Platform',
        status: 'healthy',
        message: 'Platform detected successfully',
        timestamp: new Date(),
        details: {
          platforms,
          isNative: this.platform.is('capacitor'),
          width: this.platform.width(),
          height: this.platform.height()
        }
      };
    } catch (error) {
      return {
        service: 'Platform',
        status: 'degraded',
        message: 'Platform detection error',
        timestamp: new Date(),
        details: { error: String(error) }
      };
    }
  }

  /**
   * Get system information
   */
  getSystemInfo(): SystemInfo {
    const performance = (window.performance as any);

    return {
      platform: this.platform.platforms().join(', '),
      isNative: this.platform.is('capacitor'),
      isWeb: !this.platform.is('capacitor'),
      isAndroid: this.platform.is('android'),
      isIOS: this.platform.is('ios'),
      appVersion: environment.appVersion,
      environment: environment.production ? 'production' : 'development',
      deviceInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled
      },
      memoryInfo: performance?.memory ? {
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        usedJSHeapSize: performance.memory.usedJSHeapSize
      } : undefined
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const metrics: PerformanceMetrics = {};

    // Navigation timing
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationStart = timing.navigationStart;

      metrics.navigation = {
        domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart
      };
    }

    // Memory
    const performance = (window.performance as any);
    if (performance?.memory) {
      const memory = performance.memory;
      metrics.memory = {
        used: memory.usedJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }

    return metrics;
  }

  /**
   * Generate diagnostic report
   */
  async generateReport(): Promise<DiagnosticReport> {
    this.logger.info('Generating diagnostic report', 'DiagnosticService');

    const healthChecks = await this.runHealthChecks();
    const systemInfo = this.getSystemInfo();
    const performanceMetrics = this.getPerformanceMetrics();

    const report: DiagnosticReport = {
      timestamp: new Date(),
      systemInfo,
      healthChecks,
      performanceMetrics,
      errors: this.logger.getLogs(3), // ERROR level
      warnings: this.logger.getLogs(2) // WARN level
    };

    this.logger.info('Diagnostic report generated', 'DiagnosticService');
    return report;
  }

  /**
   * Export diagnostic report as JSON
   */
  async exportReport(): Promise<string> {
    const report = await this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  /**
   * Download diagnostic report
   */
  async downloadReport(): Promise<void> {
    const reportJson = await this.exportReport();
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.logger.info('Diagnostic report downloaded', 'DiagnosticService');
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      this.logger.warn('Monitoring already started', 'DiagnosticService');
      return;
    }

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.runHealthChecks();
    }, intervalMs);

    this.logger.info('Continuous monitoring started', 'DiagnosticService', { intervalMs });
  }

  /**
   * Stop continuous monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
      this.logger.info('Continuous monitoring stopped', 'DiagnosticService');
    }
  }

  /**
   * Get overall system health status
   */
  getOverallHealth(): 'healthy' | 'degraded' | 'unhealthy' {
    const checks = this.healthChecks.value;

    if (checks.length === 0) {
      return 'healthy';
    }

    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    if (unhealthyCount > 0) {
      return 'unhealthy';
    }

    if (degradedCount > 0) {
      return 'degraded';
    }

    return 'healthy';
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    this.stopMonitoring();
  }
}
