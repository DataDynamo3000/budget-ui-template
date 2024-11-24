import { inject, Injectable } from '@angular/core';
import { ToastController, ToastOptions } from '@ionic/angular/standalone';
import { HttpErrorResponse } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { checkmark, close, warning } from 'ionicons/icons';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ checkmark, close, warning });
  }

  displaySuccessToast = (message: string): void =>
    this.displayToast({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
      icon: 'checkmark',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });

  displayWarningToast(message: string, error: HttpErrorResponse): void {
    console.error(message, error);
    this.displayToast({
      message: `${message}. ${error.error?.message || ''}`,
      duration: 3000,
      position: 'bottom',
      color: 'warning',
      icon: 'warning',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
  }

  displayErrorToast(message: string, error?: HttpErrorResponse): void {
    console.error(message, error);
    const errorMessage = error instanceof HttpErrorResponse ? `${message}. ${error.error?.message || ''}` : `${message}. ${String(error)}`;

    this.displayToast({
      message: errorMessage,
      duration: 3000,
      position: 'bottom',
      color: 'danger',
      icon: 'close',
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
  }

  // --------------
  // Helper methods
  // --------------

  private displayToast(options: ToastOptions): void {
    this.toastController.create(options).then(toast => toast.present());
  }
}
