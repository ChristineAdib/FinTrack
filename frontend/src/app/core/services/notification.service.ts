import { Injectable, signal } from '@angular/core';

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSignal = signal<ToastNotification[]>([]);
  readonly notifications = this.notificationsSignal.asReadonly();

  show(type: 'success' | 'error' | 'warning' | 'info', message: string, duration = 4000): void {
    const id = Math.random().toString(36).substring(2, 9);
    const notification: ToastNotification = { id, type, message, duration };

    this.notificationsSignal.update(current => [...current, notification]);

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }
  }

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message, 5000);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: string): void {
    this.notificationsSignal.update(current => current.filter(n => n.id !== id));
  }
}
