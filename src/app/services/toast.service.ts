import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { LoggerService } from './logger.service';

export enum ToastType {
  SUCCESS = 'success',
  ERROR = 'danger',
  WARNING = 'warning',
  INFO = 'primary'
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  position?: 'top' | 'middle' | 'bottom';
  showCloseButton?: boolean;
  closeButtonText?: string;
  translucent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private defaultDuration = 3000;
  private defaultPosition: 'top' | 'middle' | 'bottom' = 'bottom';
  private toastQueue: HTMLIonToastElement[] = [];

  constructor(
    private toastController: ToastController,
    private logger: LoggerService
  ) {}

  /**
   * Show success toast
   */
  async success(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      type: ToastType.SUCCESS,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Show error toast
   */
  async error(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      type: ToastType.ERROR,
      duration: duration || 5000 // Errors stay longer
    });
  }

  /**
   * Show warning toast
   */
  async warning(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      type: ToastType.WARNING,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Show info toast
   */
  async info(message: string, duration?: number): Promise<void> {
    await this.show({
      message,
      type: ToastType.INFO,
      duration: duration || this.defaultDuration
    });
  }

  /**
   * Show custom toast
   */
  async show(options: ToastOptions): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message: options.message,
        duration: options.duration || this.defaultDuration,
        position: options.position || this.defaultPosition,
        color: options.type || ToastType.INFO,
        translucent: options.translucent !== false,
        buttons: options.showCloseButton ? [
          {
            text: options.closeButtonText || 'Fechar',
            role: 'cancel'
          }
        ] : undefined,
        cssClass: 'custom-toast'
      });

      // Track active toasts
      this.toastQueue.push(toast);

      // Remove from queue when dismissed
      toast.onDidDismiss().then(() => {
        const index = this.toastQueue.indexOf(toast);
        if (index > -1) {
          this.toastQueue.splice(index, 1);
        }
      });

      await toast.present();

      this.logger.debug('Toast shown', 'ToastService', {
        message: options.message,
        type: options.type
      });
    } catch (error) {
      this.logger.error('Failed to show toast', 'ToastService', error);
      // Fallback to alert if toast fails
      console.error('Toast error:', error);
      alert(options.message);
    }
  }

  /**
   * Show loading toast (no auto-dismiss)
   */
  async showLoading(message: string = 'Carregando...'): Promise<HTMLIonToastElement> {
    const toast = await this.toastController.create({
      message,
      position: 'bottom',
      translucent: true,
      cssClass: 'loading-toast'
    });

    this.toastQueue.push(toast);
    await toast.present();

    this.logger.debug('Loading toast shown', 'ToastService', { message });
    return toast;
  }

  /**
   * Dismiss specific toast
   */
  async dismiss(toast: HTMLIonToastElement): Promise<void> {
    try {
      await toast.dismiss();
      const index = this.toastQueue.indexOf(toast);
      if (index > -1) {
        this.toastQueue.splice(index, 1);
      }
    } catch (error) {
      this.logger.error('Failed to dismiss toast', 'ToastService', error);
    }
  }

  /**
   * Dismiss all toasts
   */
  async dismissAll(): Promise<void> {
    const dismissPromises = this.toastQueue.map(toast => toast.dismiss());
    await Promise.all(dismissPromises);
    this.toastQueue = [];
    this.logger.debug('All toasts dismissed', 'ToastService');
  }

  /**
   * Show toast with action button
   */
  async showWithAction(
    message: string,
    actionText: string,
    actionHandler: () => void,
    type: ToastType = ToastType.INFO
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      position: this.defaultPosition,
      color: type,
      translucent: true,
      buttons: [
        {
          text: actionText,
          handler: () => {
            actionHandler();
            this.logger.debug('Toast action clicked', 'ToastService', { message, actionText });
          }
        },
        {
          text: 'Fechar',
          role: 'cancel'
        }
      ],
      cssClass: 'action-toast'
    });

    this.toastQueue.push(toast);

    toast.onDidDismiss().then(() => {
      const index = this.toastQueue.indexOf(toast);
      if (index > -1) {
        this.toastQueue.splice(index, 1);
      }
    });

    await toast.present();
  }

  /**
   * Show offline notification
   */
  async showOffline(): Promise<void> {
    await this.warning('Você está offline. Algumas funcionalidades podem não estar disponíveis.', 5000);
  }

  /**
   * Show online notification
   */
  async showOnline(): Promise<void> {
    await this.success('Conexão restabelecida!', 2000);
  }

  /**
   * Set default duration
   */
  setDefaultDuration(duration: number): void {
    this.defaultDuration = duration;
    this.logger.debug('Default toast duration updated', 'ToastService', { duration });
  }

  /**
   * Set default position
   */
  setDefaultPosition(position: 'top' | 'middle' | 'bottom'): void {
    this.defaultPosition = position;
    this.logger.debug('Default toast position updated', 'ToastService', { position });
  }

  /**
   * Get active toasts count
   */
  getActiveCount(): number {
    return this.toastQueue.length;
  }
}
