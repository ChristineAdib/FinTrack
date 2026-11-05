import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state-wrapper">
      <div class="empty-illustration">
        <!-- Botanical Seedling / Sprout SVG -->
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22v-9"/>
          <path d="M12 13a4 4 0 0 0-4-4H4a8 8 0 0 0 8 8Z"/>
          <path d="M12 10a4 4 0 0 1 4-4h4a8 8 0 0 1-8 8Z"/>
        </svg>
      </div>

      <h4 class="empty-title">{{ title }}</h4>
      <p class="empty-description">{{ description }}</p>

      @if (actionText) {
        <button type="button" class="btn btn-primary empty-action-btn" (click)="action.emit()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {{ actionText }}
        </button>
      }
    </div>
  `,
  styles: [`
    .empty-state-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      background-color: var(--bg-surface);
      border: 1px dashed var(--border);
      border-radius: var(--radius-lg);
    }

    .empty-illustration {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background-color: var(--bg-sidebar);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.25rem;
    }

    .empty-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-heading);
      margin-bottom: 0.4rem;
    }

    .empty-description {
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 360px;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    .empty-action-btn {
      box-shadow: var(--shadow-sm);
    }
  `]
})
export class EmptyStateComponent {
  @Input() title = 'No transactions recorded yet';
  @Input() description = 'Start planting the seeds of your financial clarity by recording your first income or expense.';
  @Input() actionText?: string = 'Add Transaction';
  @Output() action = new EventEmitter<void>();
}
