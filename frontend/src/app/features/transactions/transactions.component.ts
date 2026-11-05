import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TransactionService } from '../../core/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';
import { PagedResult, Transaction, TransactionFilter, TransactionType } from '../../core/models/transaction.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { TransactionFormModalComponent } from './transaction-form-modal/transaction-form-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyEgpPipe,
    TransactionFormModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="transactions-container">
      <!-- Top Action Bar -->
      <div class="page-header-row">
        <div>
          <h2 class="section-title">Transactions Ledger</h2>
          <p class="section-subtitle">Track, filter, and audit every incoming and outgoing fund</p>
        </div>
        <button type="button" class="btn btn-primary" (click)="openAddModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Transaction
        </button>
      </div>

      <!-- Filter Card -->
      <div class="filter-card">
        <div class="filter-grid">
          <!-- Search input -->
          <div class="filter-item search-item">
            <label class="filter-label" for="searchBox">Search</label>
            <div class="search-input-wrapper">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                id="searchBox"
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="onFilterChanged()"
                placeholder="Search description or category..."
                class="form-control search-input"
              />
            </div>
          </div>

          <!-- Type filter -->
          <div class="filter-item">
            <label class="filter-label" for="typeFilter">Type</label>
            <select
              id="typeFilter"
              [(ngModel)]="selectedType"
              (ngModelChange)="onFilterChanged()"
              class="form-select"
            >
              <option value="">All Types</option>
              <option value="Income">Income (+)</option>
              <option value="Expense">Expense (-)</option>
            </select>
          </div>

          <!-- Category filter -->
          <div class="filter-item">
            <label class="filter-label" for="catFilter">Category</label>
            <select
              id="catFilter"
              [(ngModel)]="selectedCategory"
              (ngModelChange)="onFilterChanged()"
              class="form-select"
            >
              <option value="">All Categories</option>
              @for (cat of filterCategories(); track cat) {
                <option [value]="cat">{{ cat }}</option>
              }
            </select>
          </div>

          <!-- Start Date -->
          <div class="filter-item">
            <label class="filter-label" for="startDate">From</label>
            <input
              id="startDate"
              type="date"
              [(ngModel)]="startDate"
              (ngModelChange)="onFilterChanged()"
              class="form-control"
            />
          </div>

          <!-- End Date -->
          <div class="filter-item">
            <label class="filter-label" for="endDate">To</label>
            <input
              id="endDate"
              type="date"
              [(ngModel)]="endDate"
              (ngModelChange)="onFilterChanged()"
              class="form-control"
            />
          </div>

          <!-- Clear Filters -->
          @if (hasActiveFilters()) {
            <div class="filter-item clear-item">
              <button type="button" class="btn btn-secondary btn-sm" (click)="resetFilters()">
                Reset
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Transactions List / Table -->
      <div class="card table-card">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner-primary"></div>
            <span>Loading transactions...</span>
          </div>
        } @else if (errorMessage()) {
          <div class="error-state">
            <p>{{ errorMessage() }}</p>
            <button class="btn btn-secondary btn-sm" (click)="loadTransactions()">Retry</button>
          </div>
        } @else if (!pagedResult() || pagedResult()!.items.length === 0) {
          <app-empty-state
            title="No transactions found"
            description="No transactions match your current filter parameters, or no transactions have been logged yet."
            actionText="Add First Transaction"
            (action)="openAddModal()"
          ></app-empty-state>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th class="text-right">Amount</th>
                  <th class="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (t of pagedResult()!.items; track t.id) {
                  <tr>
                    <td class="cell-date">{{ t.transactionDate | date:'MMM d, yyyy' }}</td>
                    <td class="cell-category">
                      <span class="category-pill">{{ t.category }}</span>
                    </td>
                    <td class="cell-desc">{{ t.description || '—' }}</td>
                    <td>
                      <span class="badge" [ngClass]="t.type === 'Income' ? 'badge-income' : 'badge-expense'">
                        {{ t.type }}
                      </span>
                    </td>
                    <td class="cell-amount text-right" [ngClass]="t.type === 'Income' ? 'amount-income' : 'amount-expense'">
                      {{ t.type === 'Income' ? '+' : '-' }}{{ t.amount | currencyEgp }}
                    </td>
                    <td class="cell-actions text-center">
                      <button
                        type="button"
                        class="btn-action edit"
                        (click)="openEditModal(t)"
                        title="Edit transaction"
                        aria-label="Edit"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        class="btn-action delete"
                        (click)="openDeleteConfirm(t)"
                        title="Delete transaction"
                        aria-label="Delete"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="pagination-footer">
            <span class="page-info">
              Showing {{ ((currentPage() - 1) * pageSize()) + 1 }} - 
              {{ Math.min(currentPage() * pageSize(), pagedResult()!.totalCount) }} 
              of {{ pagedResult()!.totalCount }} records
            </span>

            <div class="pagination-controls">
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="!pagedResult()!.hasPreviousPage"
                (click)="goToPage(currentPage() - 1)"
              >
                Previous
              </button>
              <span class="current-page-badge">Page {{ currentPage() }} of {{ pagedResult()!.totalPages || 1 }}</span>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                [disabled]="!pagedResult()!.hasNextPage"
                (click)="goToPage(currentPage() + 1)"
              >
                Next
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Add / Edit Modal -->
      <app-transaction-form-modal
        [isOpen]="formModalOpen()"
        [transaction]="editingTransaction()"
        (close)="closeFormModal()"
        (saved)="onTransactionSaved()"
      ></app-transaction-form-modal>

      <!-- Delete Confirmation Dialog -->
      <app-confirm-dialog
        [isOpen]="deleteDialogOpen()"
        title="Delete Transaction"
        subtitle="This action permanently removes the record from your ledger"
        message="Are you sure you want to delete this transaction? All associated financial summaries and reports will be recalculated automatically."
        confirmButtonText="Delete Transaction"
        [loading]="isDeleting()"
        [details]="deletingTransactionDetails()"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteDialog()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .transactions-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .page-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-heading);
    }

    .section-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.15rem;
    }

    /* Filter Card */
    .filter-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.15rem 1.4rem;
      box-shadow: var(--shadow-xs);
    }

    .filter-grid {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 1rem;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      min-width: 140px;
      flex: 1;
    }

    .search-item {
      min-width: 240px;
      flex: 2;
    }

    .clear-item {
      min-width: auto;
      flex: 0;
      padding-bottom: 2px;
    }

    .filter-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      padding-left: 2.25rem;
    }

    /* Table Card */
    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      background-color: var(--bg-sidebar);
      padding: 0.85rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    .data-table td {
      padding: 0.95rem 1.25rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-body);
      vertical-align: middle;
    }

    .data-table tbody tr {
      transition: background-color 0.12s ease;
    }

    .data-table tbody tr:hover {
      background-color: #FAFDFB;
    }

    .cell-date {
      color: var(--text-muted);
      font-size: 0.825rem;
      white-space: nowrap;
    }

    .category-pill {
      display: inline-block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-heading);
      background: var(--bg-sidebar);
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
    }

    .cell-desc {
      color: var(--text-heading);
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-amount {
      font-weight: 700;
      font-size: 0.9375rem;
      white-space: nowrap;
    }

    .amount-income {
      color: var(--income);
    }

    .amount-expense {
      color: var(--expense);
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .cell-actions {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
    }

    .btn-action {
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.35rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      transition: all 0.15s ease;
    }

    .btn-action.edit:hover {
      background-color: var(--bg-sidebar);
      color: var(--primary);
      border-color: var(--primary);
    }

    .btn-action.delete:hover {
      background-color: var(--warning-bg);
      color: var(--warning);
      border-color: var(--expense-border);
    }

    /* Loading / Error States */
    .loading-state, .error-state {
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      color: var(--text-muted);
    }

    .spinner-primary {
      width: 28px;
      height: 28px;
      border: 3px solid var(--bg-sidebar);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Pagination Footer */
    .pagination-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.95rem 1.25rem;
      background-color: #FAFDFB;
      border-top: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .page-info {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .current-page-badge {
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-heading);
      padding: 0.25rem 0.5rem;
    }

    @media (max-width: 768px) {
      .filter-grid {
        flex-direction: column;
        align-items: stretch;
      }
      .filter-item {
        width: 100%;
      }
      .pagination-footer {
        flex-direction: column;
        align-items: center;
      }
    }
  `]
})
export class TransactionsComponent implements OnInit {
  protected readonly Math = Math;
  private transactionService = inject(TransactionService);
  private notificationService = inject(NotificationService);

  // Filter state
  searchQuery = '';
  selectedType: TransactionType | '' = '';
  selectedCategory = '';
  startDate = '';
  endDate = '';
  currentPage = signal(1);
  pageSize = signal(10);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  pagedResult = signal<PagedResult<Transaction> | null>(null);

  // Categories list
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
  filterCategories = signal<string[]>([...this.incomeCategories, ...this.expenseCategories]);

  // Modals state
  formModalOpen = signal(false);
  editingTransaction = signal<Transaction | null>(null);

  deleteDialogOpen = signal(false);
  deletingTransaction = signal<Transaction | null>(null);
  isDeleting = signal(false);

  deletingTransactionDetails = signal<any>(null);

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filter: TransactionFilter = {
      search: this.searchQuery || undefined,
      type: this.selectedType || undefined,
      category: this.selectedCategory || undefined,
      startDate: this.startDate || undefined,
      endDate: this.endDate || undefined,
      page: this.currentPage(),
      pageSize: this.pageSize(),
      sortBy: 'date',
      sortDescending: true
    };

    this.transactionService.getTransactions(filter).subscribe({
      next: (result) => {
        this.pagedResult.set(result);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Failed to load transactions.');
      }
    });
  }

  onFilterChanged(): void {
    this.currentPage.set(1);
    this.updateCategoryOptions();
    this.loadTransactions();
  }

  updateCategoryOptions(): void {
    if (this.selectedType === 'Income') {
      this.filterCategories.set(this.incomeCategories);
    } else if (this.selectedType === 'Expense') {
      this.filterCategories.set(this.expenseCategories);
    } else {
      this.filterCategories.set([...this.incomeCategories, ...this.expenseCategories]);
    }
  }

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedType || this.selectedCategory || this.startDate || this.endDate);
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedType = '';
    this.selectedCategory = '';
    this.startDate = '';
    this.endDate = '';
    this.currentPage.set(1);
    this.updateCategoryOptions();
    this.loadTransactions();
  }

  goToPage(page: number): void {
    if (page < 1 || (this.pagedResult() && page > this.pagedResult()!.totalPages)) return;
    this.currentPage.set(page);
    this.loadTransactions();
  }

  openAddModal(): void {
    this.editingTransaction.set(null);
    this.formModalOpen.set(true);
  }

  openEditModal(t: Transaction): void {
    this.editingTransaction.set(t);
    this.formModalOpen.set(true);
  }

  closeFormModal(): void {
    this.formModalOpen.set(false);
    this.editingTransaction.set(null);
  }

  onTransactionSaved(): void {
    this.loadTransactions();
  }

  openDeleteConfirm(t: Transaction): void {
    this.deletingTransaction.set(t);
    this.deletingTransactionDetails.set({
      type: t.type,
      category: t.category,
      amount: t.amount,
      description: t.description
    });
    this.deleteDialogOpen.set(true);
  }

  closeDeleteDialog(): void {
    this.deleteDialogOpen.set(false);
    this.deletingTransaction.set(null);
  }

  confirmDelete(): void {
    const t = this.deletingTransaction();
    if (!t) return;

    this.isDeleting.set(true);
    this.transactionService.deleteTransaction(t.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.closeDeleteDialog();
        this.notificationService.success('Transaction deleted successfully.');
        this.loadTransactions();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.notificationService.error(err.error?.message || 'Failed to delete transaction.');
      }
    });
  }
}
