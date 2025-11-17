import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { BehaviorSubject, Observable } from 'rxjs';
import { LoggerService } from './logger.service';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  context?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false
  });
  public loading$ = this.loadingSubject.asObservable();

  private activeLoading: HTMLIonLoadingElement | null = null;
  private loadingQueue: Map<string, HTMLIonLoadingElement> = new Map();
  private loadingCounter = 0;

  constructor(
    private loadingController: LoadingController,
    private logger: LoggerService
  ) {}

  /**
   * Show loading indicator
   */
  async show(message: string = 'Carregando...', context?: string): Promise<void> {
    try {
      this.loadingCounter++;

      // Update state
      this.loadingSubject.next({
        isLoading: true,
        message,
        context
      });

      // Only create one loading instance
      if (!this.activeLoading) {
        this.activeLoading = await this.loadingController.create({
          message,
          spinner: 'circular',
          translucent: true,
          cssClass: 'custom-loading'
        });

        await this.activeLoading.present();

        this.logger.debug('Loading shown', 'LoadingService', {
          message,
          context,
          counter: this.loadingCounter
        });
      } else {
        // Update message if loading already exists
        await this.updateMessage(message);
      }
    } catch (error) {
      this.logger.error('Failed to show loading', 'LoadingService', error);
    }
  }

  /**
   * Hide loading indicator
   */
  async hide(context?: string): Promise<void> {
    try {
      this.loadingCounter = Math.max(0, this.loadingCounter - 1);

      // Only hide when counter reaches 0
      if (this.loadingCounter === 0 && this.activeLoading) {
        await this.activeLoading.dismiss();
        this.activeLoading = null;

        this.loadingSubject.next({
          isLoading: false
        });

        this.logger.debug('Loading hidden', 'LoadingService', { context });
      }
    } catch (error) {
      this.logger.error('Failed to hide loading', 'LoadingService', error);
      // Force reset on error
      this.activeLoading = null;
      this.loadingCounter = 0;
      this.loadingSubject.next({ isLoading: false });
    }
  }

  /**
   * Force hide all loading indicators
   */
  async hideAll(): Promise<void> {
    try {
      if (this.activeLoading) {
        await this.activeLoading.dismiss();
        this.activeLoading = null;
      }

      // Dismiss all queued loadings
      for (const [key, loading] of this.loadingQueue.entries()) {
        await loading.dismiss();
        this.loadingQueue.delete(key);
      }

      this.loadingCounter = 0;
      this.loadingSubject.next({ isLoading: false });

      this.logger.debug('All loadings hidden', 'LoadingService');
    } catch (error) {
      this.logger.error('Failed to hide all loadings', 'LoadingService', error);
    }
  }

  /**
   * Update loading message
   */
  async updateMessage(message: string): Promise<void> {
    try {
      if (this.activeLoading) {
        this.activeLoading.message = message;

        this.loadingSubject.next({
          isLoading: true,
          message
        });

        this.logger.debug('Loading message updated', 'LoadingService', { message });
      }
    } catch (error) {
      this.logger.error('Failed to update loading message', 'LoadingService', error);
    }
  }

  /**
   * Show loading with custom spinner
   */
  async showWithSpinner(
    message: string,
    spinner: 'bubbles' | 'circles' | 'circular' | 'crescent' | 'dots' | 'lines' | 'lines-small' = 'circular',
    context?: string
  ): Promise<void> {
    try {
      this.loadingCounter++;

      this.loadingSubject.next({
        isLoading: true,
        message,
        context
      });

      if (!this.activeLoading) {
        this.activeLoading = await this.loadingController.create({
          message,
          spinner,
          translucent: true,
          cssClass: 'custom-loading'
        });

        await this.activeLoading.present();
        this.logger.debug('Loading with spinner shown', 'LoadingService', { message, spinner });
      }
    } catch (error) {
      this.logger.error('Failed to show loading with spinner', 'LoadingService', error);
    }
  }

  /**
   * Show loading with duration (auto-dismiss)
   */
  async showWithDuration(
    message: string,
    duration: number = 2000,
    context?: string
  ): Promise<void> {
    try {
      const loading = await this.loadingController.create({
        message,
        duration,
        spinner: 'circular',
        translucent: true,
        cssClass: 'custom-loading'
      });

      this.loadingSubject.next({
        isLoading: true,
        message,
        context
      });

      await loading.present();

      this.logger.debug('Loading with duration shown', 'LoadingService', {
        message,
        duration
      });

      // Update state when dismissed
      loading.onDidDismiss().then(() => {
        this.loadingSubject.next({ isLoading: false });
      });
    } catch (error) {
      this.logger.error('Failed to show loading with duration', 'LoadingService', error);
    }
  }

  /**
   * Show loading with backdrop
   */
  async showWithBackdrop(
    message: string,
    backdropDismiss: boolean = false,
    context?: string
  ): Promise<void> {
    try {
      this.loadingCounter++;

      this.loadingSubject.next({
        isLoading: true,
        message,
        context
      });

      if (!this.activeLoading) {
        this.activeLoading = await this.loadingController.create({
          message,
          spinner: 'circular',
          translucent: false,
          backdropDismiss,
          cssClass: 'backdrop-loading'
        });

        await this.activeLoading.present();
        this.logger.debug('Loading with backdrop shown', 'LoadingService', { message });
      }
    } catch (error) {
      this.logger.error('Failed to show loading with backdrop', 'LoadingService', error);
    }
  }

  /**
   * Create named loading (for parallel operations)
   */
  async showNamed(name: string, message: string): Promise<void> {
    try {
      // Check if loading with this name already exists
      if (this.loadingQueue.has(name)) {
        this.logger.warn('Loading with this name already exists', 'LoadingService', { name });
        return;
      }

      const loading = await this.loadingController.create({
        message,
        spinner: 'circular',
        translucent: true,
        cssClass: 'custom-loading'
      });

      this.loadingQueue.set(name, loading);
      await loading.present();

      this.loadingSubject.next({
        isLoading: true,
        message,
        context: name
      });

      this.logger.debug('Named loading shown', 'LoadingService', { name, message });
    } catch (error) {
      this.logger.error('Failed to show named loading', 'LoadingService', error);
    }
  }

  /**
   * Hide named loading
   */
  async hideNamed(name: string): Promise<void> {
    try {
      const loading = this.loadingQueue.get(name);
      if (loading) {
        await loading.dismiss();
        this.loadingQueue.delete(name);

        // Update state if no more loadings
        if (this.loadingQueue.size === 0 && !this.activeLoading) {
          this.loadingSubject.next({ isLoading: false });
        }

        this.logger.debug('Named loading hidden', 'LoadingService', { name });
      }
    } catch (error) {
      this.logger.error('Failed to hide named loading', 'LoadingService', error);
    }
  }

  /**
   * Wrap async operation with loading
   */
  async wrapWithLoading<T>(
    operation: () => Promise<T>,
    message: string = 'Carregando...',
    context?: string
  ): Promise<T> {
    await this.show(message, context);
    try {
      const result = await operation();
      await this.hide(context);
      return result;
    } catch (error) {
      await this.hide(context);
      throw error;
    }
  }

  /**
   * Check if loading is active
   */
  isLoading(): boolean {
    return this.loadingSubject.value.isLoading;
  }

  /**
   * Get current loading state
   */
  getLoadingState(): LoadingState {
    return this.loadingSubject.value;
  }

  /**
   * Get loading counter
   */
  getLoadingCounter(): number {
    return this.loadingCounter;
  }
}
