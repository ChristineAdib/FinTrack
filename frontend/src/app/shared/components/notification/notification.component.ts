import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-container" aria-live="polite">
      @for (n of notificationService.notifications(); track n.id) {
        <div class="toast-item" [ngClass]="'toast-' + n.type">
          <div class="toast-icon">
            @switch (n.type) {
              @case ('success') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              }
              @case ('error') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              }
              @case ('warning') {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              @default {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              }
            }
          </div>
          <div class="toast-message">{{ n.message }}</div>
          <button class="toast-close" (click)="notificationService.dismiss(n.id)" aria-label="Dismiss">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-container {
      position: fixed;
      top: 1.25rem;
      right: 1.25rem;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      pointer-events: none;
      max-width: 380px;
      width: calc(100% - 2.5rem);
    }

    .toast-item {
      pointer-events: auto;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      box-shadow: var(--shadow-md);
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes toastSlideIn {
      from {
        opacity: 0;
        transform: translateX(16px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .toast-success {
      border-left: 4px solid var(--income);
      .toast-icon { color: var(--income); }
    }

    .toast-error {
      border-left: 4px solid var(--warning);
      .toast-icon { color: var(--warning); }
    }

    .toast-warning {
      border-left: 4px solid var(--accent-gold);
      .toast-icon { color: #9E7B28; }
    }

    .toast-info {
      border-left: 4px solid var(--primary);
      .toast-icon { color: var(--primary); }
    }

    .toast-message {
      font-size: 0.875rem;
      color: var(--text-heading);
      flex: 1;
      line-height: 1.4;
    }

    .toast-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.15s;
    }

    .toast-close:hover {
      color: var(--text-heading);
    }
  `]
})
export class NotificationComponent {
  notificationService = inject(NotificationService);
}
