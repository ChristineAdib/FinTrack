import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../modal/modal.component';
import { CurrencyEgpPipe } from '../../pipes/currency-egp.pipe';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, ModalComponent, CurrencyEgpPipe],
  template: `
    <app-modal [isOpen]="isOpen" [title]="title" [subtitle]="subtitle" maxWidth="460px" (close)="onCancel()">
      <div body class="confirm-content">
        <p class="confirm-message">{{ message }}</p>

        @if (details) {
          <div class="confirm-details-box">
            <div class="detail-row">
              <span class="detail-label">Type:</span>
              <span class="badge" [ngClass]="details.type === 'Income' ? 'badge-income' : 'badge-expense'">
                {{ details.type }}
              </span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Category:</span>
              <span class="detail-value font-medium">{{ details.category }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value font-bold" [style.color]="details.type === 'Income' ? 'var(--income)' : 'var(--expense)'">
                {{ details.amount | currencyEgp }}
              </span>
            </div>
            @if (details.description) {
              <div class="detail-row">
                <span class="detail-label">Description:</span>
                <span class="detail-value">{{ details.description }}</span>
              </div>
            }
          </div>
        }
      </div>

      <div footer>
        <button type="button" class="btn btn-secondary" (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
        <button type="button" class="btn btn-danger" (click)="onConfirm()" [disabled]="loading">
          @if (loading) {
            Deleting...
          } @else {
            {{ confirmButtonText }}
          }
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .confirm-message {
      font-size: 0.9375rem;
      color: var(--text-body);
      line-height: 1.5;
    }

    .confirm-details-box {
      background-color: var(--bg-sidebar);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 0.85rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.84rem;
    }

    .detail-label {
      color: var(--text-muted);
    }

    .detail-value {
      color: var(--text-heading);
    }

    .font-medium {
      font-weight: 500;
    }

    .font-bold {
      font-weight: 700;
    }
  `]
})
export class ConfirmDialogComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirm Action';
  @Input() subtitle = '';
  @Input() message = 'Are you sure you want to proceed?';
  @Input() confirmButtonText = 'Delete';
  @Input() loading = false;
  @Input() details?: {
    type?: string;
    category?: string;
    amount?: number;
    description?: string;
  };

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
