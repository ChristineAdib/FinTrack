import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { TransactionService } from '../../../core/services/transaction.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-transaction-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ModalComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      [title]="transaction ? 'Edit Transaction' : 'Record Transaction'"
      [subtitle]="transaction ? 'Update transaction details' : 'Keep your botanical ledger accurate'"
      maxWidth="500px"
      (close)="onClose()"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" body class="transaction-form">
        <!-- Type Selector (Income vs Expense) -->
        <div class="form-group">
          <label class="form-label">Transaction Type</label>
          <div class="type-toggle-group">
            <button
              type="button"
              class="type-btn"
              [class.active-income]="form.get('type')?.value === 'Income'"
              (click)="setType('Income')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              Income
            </button>
            <button
              type="button"
              class="type-btn"
              [class.active-expense]="form.get('type')?.value === 'Expense'"
              (click)="setType('Expense')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                <polyline points="17 18 23 18 23 12"/>
              </svg>
              Expense
            </button>
          </div>
        </div>

        <!-- Amount & Currency -->
        <div class="form-group">
          <label class="form-label" for="amount">Amount (EGP)</label>
          <div class="amount-input-wrapper">
            <span class="currency-prefix">EGP</span>
            <input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              formControlName="amount"
              placeholder="0.00"
              class="form-control amount-input"
              [class.is-invalid]="form.get('amount')?.touched && form.get('amount')?.invalid"
            />
          </div>
          @if (form.get('amount')?.touched && form.get('amount')?.hasError('required')) {
            <div class="form-error">Amount is required.</div>
          }
          @if (form.get('amount')?.touched && form.get('amount')?.hasError('min')) {
            <div class="form-error">Amount must be greater than zero.</div>
          }
        </div>

        <!-- Category -->
        <div class="form-group">
          <label class="form-label" for="category">Category</label>
          <select
            id="category"
            formControlName="category"
            class="form-select"
            [class.is-invalid]="form.get('category')?.touched && form.get('category')?.invalid"
          >
            <option value="" disabled>Select a category</option>
            @for (cat of availableCategories(); track cat) {
              <option [value]="cat">{{ cat }}</option>
            }
          </select>
          @if (form.get('category')?.touched && form.get('category')?.hasError('required')) {
            <div class="form-error">Please select a category.</div>
          }
        </div>

        <!-- Date -->
        <div class="form-group">
          <label class="form-label" for="transactionDate">Date</label>
          <input
            id="transactionDate"
            type="date"
            formControlName="transactionDate"
            class="form-control"
            [class.is-invalid]="form.get('transactionDate')?.touched && form.get('transactionDate')?.invalid"
          />
          @if (form.get('transactionDate')?.touched && form.get('transactionDate')?.hasError('required')) {
            <div class="form-error">Transaction date is required.</div>
          }
        </div>

        <!-- Description -->
        <div class="form-group">
          <label class="form-label" for="description">Description <span class="optional-text">(Optional)</span></label>
          <input
            id="description"
            type="text"
            maxlength="200"
            formControlName="description"
            placeholder="e.g. Weekly grocery run or Project milestone payment"
            class="form-control"
          />
        </div>
      </form>

      <div footer>
        <button type="button" class="btn btn-secondary" (click)="onClose()" [disabled]="isSaving()">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="onSubmit()"
          [disabled]="form.invalid || isSaving()"
        >
          @if (isSaving()) {
            Saving...
          } @else {
            {{ transaction ? 'Update Record' : 'Save Transaction' }}
          }
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .transaction-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .type-toggle-group {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      background-color: var(--bg-sidebar);
      padding: 0.3rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }

    .type-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.55rem;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .active-income {
      background-color: var(--bg-surface);
      color: var(--income);
      border-color: var(--income-border);
      box-shadow: var(--shadow-xs);
    }

    .active-expense {
      background-color: var(--bg-surface);
      color: var(--expense);
      border-color: var(--expense-border);
      box-shadow: var(--shadow-xs);
    }

    .amount-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .currency-prefix {
      position: absolute;
      left: 0.85rem;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .amount-input {
      padding-left: 3.25rem;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .optional-text {
      font-size: 0.75rem;
      font-weight: 400;
      color: var(--text-muted);
    }
  `]
})
export class TransactionFormModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() transaction: Transaction | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<Transaction>();

  private fb = inject(FormBuilder);
  private transactionService = inject(TransactionService);
  private notificationService = inject(NotificationService);

  isSaving = signal(false);

  incomeCategories = [
    'Salary',
    'Freelance',
    'Investment',
    'Business',
    'Gift',
    'Other Income'
  ];

  expenseCategories = [
    'Food & Dining',
    'Housing & Rent',
    'Transportation',
    'Utilities',
    'Healthcare',
    'Entertainment',
    'Shopping',
    'Education',
    'Personal Care',
    'Debt & Loans',
    'Other Expense'
  ];

  form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(0.01)]],
    type: ['Expense' as TransactionType, [Validators.required]],
    category: ['', [Validators.required]],
    description: [''],
    transactionDate: [this.getTodayDateString(), [Validators.required]]
  });

  availableCategories = signal<string[]>(this.expenseCategories);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transaction'] || changes['isOpen']) {
      if (this.transaction) {
        const type = this.transaction.type;
        this.availableCategories.set(type === 'Income' ? this.incomeCategories : this.expenseCategories);
        const formattedDate = this.transaction.transactionDate ? this.transaction.transactionDate.substring(0, 10) : this.getTodayDateString();
        this.form.patchValue({
          amount: this.transaction.amount,
          type: this.transaction.type,
          category: this.transaction.category,
          description: this.transaction.description || '',
          transactionDate: formattedDate
        });
      } else {
        this.form.reset({
          amount: null,
          type: 'Expense',
          category: '',
          description: '',
          transactionDate: this.getTodayDateString()
        });
        this.availableCategories.set(this.expenseCategories);
      }
    }
  }

  setType(type: TransactionType): void {
    this.form.patchValue({ type, category: '' });
    this.availableCategories.set(type === 'Income' ? this.incomeCategories : this.expenseCategories);
  }

  private getTodayDateString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onClose(): void {
    this.close.emit();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const val = this.form.value;

    const payload = {
      amount: Number(val.amount),
      type: val.type as TransactionType,
      category: val.category!,
      description: val.description || undefined,
      transactionDate: new Date(val.transactionDate!).toISOString()
    };

    if (this.transaction) {
      this.transactionService.updateTransaction(this.transaction.id, payload).subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.notificationService.success('Transaction updated successfully.');
          this.saved.emit(updated);
          this.onClose();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(err.error?.message || 'Failed to update transaction.');
        }
      });
    } else {
      this.transactionService.createTransaction(payload).subscribe({
        next: (created) => {
          this.isSaving.set(false);
          this.notificationService.success('Transaction saved successfully.');
          this.saved.emit(created);
          this.onClose();
        },
        error: (err) => {
          this.isSaving.set(false);
          this.notificationService.error(err.error?.message || 'Failed to save transaction.');
        }
      });
    }
  }
}
