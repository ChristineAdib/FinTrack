import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../core/services/report.service';
import { TransactionService } from '../../core/services/transaction.service';
import { NotificationService } from '../../core/services/notification.service';
import { CategoryBreakdown, FinancialSummary, MonthlyTrend, ReportFilter } from '../../core/models/report.model';
import { Transaction, TransactionType } from '../../core/models/transaction.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { TransactionFormModalComponent } from '../transactions/transaction-form-modal/transaction-form-modal.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    StatCardComponent,
    CurrencyEgpPipe,
    TransactionFormModalComponent,
    ConfirmDialogComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="dashboard-container">
      <!-- Period Selection & Quick Actions Bar -->
      <div class="dashboard-controls">
        <div class="period-pills">
          <button
            type="button"
            class="period-pill"
            [class.active]="selectedPeriod() === '7d'"
            (click)="setPeriod('7d')"
          >
            Last 7 Days
          </button>
          <button
            type="button"
            class="period-pill"
            [class.active]="selectedPeriod() === '30d'"
            (click)="setPeriod('30d')"
          >
            Last 30 Days
          </button>
          <button
            type="button"
            class="period-pill"
            [class.active]="selectedPeriod() === '6m'"
            (click)="setPeriod('6m')"
          >
            Last 6 Months
          </button>
          <button
            type="button"
            class="period-pill"
            [class.active]="selectedPeriod() === 'this-year'"
            (click)="setPeriod('this-year')"
          >
            This Year
          </button>
          <button
            type="button"
            class="period-pill"
            [class.active]="selectedPeriod() === 'all'"
            (click)="setPeriod('all')"
          >
            All Time
          </button>
        </div>

        <div class="action-buttons-group">
          <button type="button" class="btn btn-secondary btn-refresh" (click)="loadDashboardData()" title="Reload live data from database">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" [class.spinning]="isLoading()">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            Refresh
          </button>
          <button type="button" class="btn btn-primary" (click)="openAddModal()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Record Transaction
          </button>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="summary-cards-grid">
        <app-stat-card
          label="Net Cash Flow"
          [value]="summary()?.netCashFlow ?? 0"
          [subtitle]="summary()?.periodLabel ? summary()!.periodLabel + ' (Income - Expenses)' : 'Income minus Expenses'"
          variant="balance"
          badge="Cash Flow"
        ></app-stat-card>

        <app-stat-card
          label="Total Income"
          [value]="summary()?.totalIncome ?? 0"
          [subtitle]="summary()?.periodLabel || 'Total recorded inflow'"
          variant="income"
          badge="Inflow"
        ></app-stat-card>

        <app-stat-card
          label="Total Expenses"
          [value]="summary()?.totalExpenses ?? 0"
          [subtitle]="summary()?.periodLabel || 'Total recorded outflow'"
          variant="expense"
          badge="Outflow"
        ></app-stat-card>

        <app-stat-card
          label="Net Savings"
          [value]="summary()?.netSavings ?? 0"
          [subtitle]="'Surplus retained in period'"
          variant="savings"
          badge="Surplus"
        ></app-stat-card>
      </div>

      <!-- Main Visualizations Grid -->
      <div class="charts-grid">
        <!-- Income vs Expenses Bar/Line Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Income vs Expenses Overview</h3>
              <p class="card-subtitle">Annual trajectory based on live database transactions</p>
            </div>
            <span class="badge badge-neutral">{{ currentYear }}</span>
          </div>

          <div class="chart-content">
            <div class="canvas-wrapper" [style.display]="hasAnyData() ? 'block' : 'none'">
              <canvas #incomeExpenseCanvas></canvas>
            </div>
            @if (!hasAnyData()) {
              <div class="chart-empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M3 3v18h18"/>
                  <path d="m19 9-5 5-4-4-3 3"/>
                </svg>
                <p>No transactions available in this period to graph.</p>
              </div>
            }
          </div>
        </div>

        <!-- Category Allocation Doughnut -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">{{ breakdownType() === 'Expense' ? 'Expense Allocation' : 'Income Allocation' }}</h3>
              <p class="card-subtitle">Category distribution for {{ summary()?.periodLabel || 'period' }}</p>
            </div>

            <div class="breakdown-toggle">
              <button
                type="button"
                class="toggle-btn"
                [class.active-expense]="breakdownType() === 'Expense'"
                (click)="setBreakdownType('Expense')"
              >
                Expenses
              </button>
              <button
                type="button"
                class="toggle-btn"
                [class.active-income]="breakdownType() === 'Income'"
                (click)="setBreakdownType('Income')"
              >
                Income
              </button>
            </div>
          </div>

          <div class="chart-content doughnut-layout">
            <div class="doughnut-canvas-wrapper" [style.display]="breakdown().length > 0 ? 'flex' : 'none'">
              <canvas #expenseCategoryCanvas></canvas>
            </div>

            @if (breakdown().length > 0) {
              <div class="breakdown-list">
                @for (item of breakdown().slice(0, 5); track item.category) {
                  <div class="breakdown-item">
                    <div class="breakdown-info">
                      <span class="breakdown-dot" [style.background-color]="breakdownType() === 'Income' ? 'var(--income)' : 'var(--expense)'"></span>
                      <span class="breakdown-name">{{ item.category }}</span>
                    </div>
                    <div class="breakdown-values">
                      <span class="breakdown-pct">{{ item.percentage }}%</span>
                      <span class="breakdown-amt">{{ item.totalAmount | currencyEgp }}</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m4.93 4.93 4.24 4.24"/>
                  <path d="m14.83 9.17 4.24-4.24"/>
                  <path d="m14.83 14.83 4.24 4.24"/>
                  <path d="m9.17 14.83-4.24 4.24"/>
                </svg>
                <p>No {{ breakdownType().toLowerCase() }} transactions recorded in this period.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Transactions Section with IN-PLACE EDIT & DELETE -->
      <div class="card recent-transactions-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Recent Transactions</h3>
            <p class="card-subtitle">Modify, delete, or audit recent database records</p>
          </div>
          <a routerLink="/transactions" class="btn btn-secondary btn-sm">
            View All Ledger
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </a>
        </div>

        @if (recentTransactions().length === 0) {
          <app-empty-state
            title="Your botanical ledger is awaiting its first record"
            description="Add your first income or expense to populate your financial balance and insights."
            actionText="Record First Transaction"
            (action)="openAddModal()"
          ></app-empty-state>
        } @else {
          <div class="recent-list">
            @for (t of recentTransactions(); track t.id) {
              <div class="recent-item">
                <div class="recent-item-left">
                  <div class="recent-type-icon" [ngClass]="t.type === 'Income' ? 'icon-income' : 'icon-expense'">
                    @if (t.type === 'Income') {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                        <polyline points="17 6 23 6 23 12"/>
                      </svg>
                    } @else {
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                        <polyline points="17 18 23 18 23 12"/>
                      </svg>
                    }
                  </div>
                  <div class="recent-details">
                    <span class="recent-category">{{ t.category }}</span>
                    <span class="recent-desc">{{ t.description || 'No description' }}</span>
                  </div>
                </div>

                <div class="recent-item-right">
                  <div class="recent-amount-box">
                    <span class="recent-amount" [ngClass]="t.type === 'Income' ? 'amount-income' : 'amount-expense'">
                      {{ t.type === 'Income' ? '+' : '-' }}{{ t.amount | currencyEgp }}
                    </span>
                    <span class="recent-date">{{ t.transactionDate | date:'MMM d, yyyy' }}</span>
                  </div>

                  <!-- Direct In-Place Action Buttons -->
                  <div class="recent-actions">
                    <button
                      type="button"
                      class="btn-action edit"
                      (click)="openEditModal(t)"
                      title="Edit transaction"
                      aria-label="Edit"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Add / Edit Transaction Modal -->
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
        subtitle="This action permanently removes the record from the database"
        message="Are you sure you want to delete this transaction? All associated financial summaries and charts will be recalculated immediately."
        confirmButtonText="Delete Transaction"
        [loading]="isDeleting()"
        [details]="deletingTransactionDetails()"
        (confirm)="confirmDelete()"
        (cancel)="closeDeleteDialog()"
      ></app-confirm-dialog>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .dashboard-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .period-pills {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: var(--bg-surface);
      padding: 0.25rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xs);
      overflow-x: auto;
      max-width: 100%;
    }

    .period-pill {
      background: transparent;
      border: none;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s ease;
    }

    .period-pill:hover {
      color: var(--text-heading);
    }

    .period-pill.active {
      background-color: var(--primary);
      color: #FFFFFF;
      box-shadow: var(--shadow-xs);
    }

    .action-buttons-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .btn-refresh {
      gap: 0.4rem;
    }

    .spinning {
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* KPI Grid */
    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.25rem;
    }

    /* Charts Grid */
    .charts-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr;
      gap: 1.25rem;
    }

    .chart-card {
      min-height: 380px;
      display: flex;
      flex-direction: column;
    }

    .chart-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .canvas-wrapper {
      position: relative;
      width: 100%;
      height: 300px;
    }

    .doughnut-layout {
      flex-direction: column;
      gap: 1.25rem;
    }

    .doughnut-canvas-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
      display: flex;
      justify-content: center;
    }

    .breakdown-toggle {
      display: flex;
      background-color: var(--bg-sidebar);
      padding: 0.2rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      gap: 0.2rem;
    }

    .toggle-btn {
      background: transparent;
      border: none;
      padding: 0.25rem 0.65rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .toggle-btn.active-expense {
      background: var(--bg-surface);
      color: var(--expense);
      box-shadow: var(--shadow-xs);
    }

    .toggle-btn.active-income {
      background: var(--bg-surface);
      color: var(--income);
      box-shadow: var(--shadow-xs);
    }

    .breakdown-list {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .breakdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.35rem 0.5rem;
      border-radius: var(--radius-sm);
      background-color: #FAFDFB;
      border: 1px solid var(--border);
      font-size: 0.8125rem;
    }

    .breakdown-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .breakdown-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .breakdown-name {
      font-weight: 500;
      color: var(--text-heading);
    }

    .breakdown-values {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .breakdown-pct {
      font-weight: 600;
      color: var(--text-muted);
    }

    .breakdown-amt {
      font-weight: 600;
      color: var(--text-heading);
    }

    .chart-empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      color: var(--text-muted);
      font-size: 0.875rem;
      text-align: center;
      padding: 2rem;
    }

    /* Recent Transactions Card */
    .recent-transactions-card {
      padding: 1.5rem;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .recent-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background-color: #FAFDFB;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: background-color 0.12s ease;
      gap: 1rem;
    }

    .recent-item:hover {
      background-color: var(--bg-sidebar);
    }

    .recent-item-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
      min-width: 0;
    }

    .recent-type-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .icon-income {
      background-color: var(--income-bg);
      color: var(--income);
    }

    .icon-expense {
      background-color: var(--expense-bg);
      color: var(--expense);
    }

    .recent-details {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .recent-category {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-heading);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .recent-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .recent-item-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .recent-amount-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .recent-amount {
      font-size: 0.9375rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .amount-income {
      color: var(--income);
    }

    .amount-expense {
      color: var(--expense);
    }

    .recent-date {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .recent-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
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
      background-color: var(--bg-surface);
      color: var(--primary);
      border-color: var(--primary);
    }

    .btn-action.delete:hover {
      background-color: var(--warning-bg);
      color: var(--warning);
      border-color: var(--expense-border);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .summary-cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .summary-cards-grid {
        grid-template-columns: 1fr;
      }
      .dashboard-controls {
        flex-direction: column;
        align-items: stretch;
      }
      .period-pills {
        width: 100%;
        justify-content: flex-start;
      }
      .recent-item {
        flex-direction: column;
        align-items: flex-start;
      }
      .recent-item-right {
        width: 100%;
        justify-content: space-between;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('incomeExpenseCanvas') incomeExpenseCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('expenseCategoryCanvas') expenseCategoryCanvas?: ElementRef<HTMLCanvasElement>;

  private reportService = inject(ReportService);
  private transactionService = inject(TransactionService);
  private notificationService = inject(NotificationService);

  selectedPeriod = signal<'7d' | '30d' | '6m' | 'this-year' | 'all'>('30d');
  breakdownType = signal<'Expense' | 'Income'>('Expense');
  currentYear = new Date().getFullYear();

  summary = signal<FinancialSummary | null>(null);
  breakdown = signal<CategoryBreakdown[]>([]);
  trends = signal<MonthlyTrend[]>([]);
  recentTransactions = signal<Transaction[]>([]);

  hasAnyData = signal(false);
  isLoading = signal(false);

  // Modal states for in-place edit & delete
  formModalOpen = signal(false);
  editingTransaction = signal<Transaction | null>(null);

  deleteDialogOpen = signal(false);
  deletingTransaction = signal<Transaction | null>(null);
  isDeleting = signal(false);
  deletingTransactionDetails = signal<any>(null);

  private trendChart?: Chart;
  private doughnutChart?: Chart;

  // Botanical Theme Palette for Charts
  private readonly palette = {
    income: '#4F8A68',
    incomeLight: 'rgba(79, 138, 104, 0.15)',
    expense: '#D98B73',
    expenseLight: 'rgba(217, 139, 115, 0.15)',
    forestTeal: '#2F6B57',
    deepForest: '#245443',
    sageGreen: '#8FAE9B',
    warmClay: '#C87967',
    softGold: '#D8B66A',
    grayGreen: '#718078',
    border: '#DCE7DF',
    doughnutColors: [
      '#D98B73',
      '#C87967',
      '#D8B66A',
      '#8FAE9B',
      '#2F6B57',
      '#4F8A68',
      '#718078',
      '#9CB7A8'
    ],
    incomeDoughnutColors: [
      '#4F8A68',
      '#2F6B57',
      '#8FAE9B',
      '#D8B66A',
      '#718078',
      '#9CB7A8'
    ]
  };

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  setPeriod(period: '7d' | '30d' | '6m' | 'this-year' | 'all'): void {
    this.selectedPeriod.set(period);
    this.loadDashboardData();
  }

  setBreakdownType(type: 'Expense' | 'Income'): void {
    this.breakdownType.set(type);
    this.loadBreakdown();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    const filter: ReportFilter = { period: this.selectedPeriod() };

    this.reportService.getSummary(filter).subscribe({
      next: (res) => {
        this.summary.set(res);
        const hasData = res.totalIncome > 0 || res.totalExpenses > 0 || res.transactionCount > 0;
        this.hasAnyData.set(hasData);

        // Auto-switch breakdown type to Income if user has Income but no Expenses yet
        if (res.totalExpenses === 0 && res.totalIncome > 0 && this.breakdownType() === 'Expense') {
          this.breakdownType.set('Income');
        }

        this.loadBreakdown();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });

    this.reportService.getMonthlyTrend({ year: this.currentYear }).subscribe({
      next: (res) => {
        this.trends.set(res);
        setTimeout(() => this.renderTrendChart(), 60);
      }
    });

    this.loadRecent();
  }

  private loadBreakdown(): void {
    const filter: ReportFilter = { period: this.selectedPeriod() };
    this.reportService.getCategoryBreakdown(filter, this.breakdownType()).subscribe({
      next: (res) => {
        this.breakdown.set(res);
        setTimeout(() => this.renderDoughnutChart(), 60);
      }
    });
  }

  private loadRecent(): void {
    this.transactionService.getRecentTransactions(5).subscribe({
      next: (res) => {
        this.recentTransactions.set(res);
      }
    });
  }

  private destroyCharts(): void {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = undefined;
    }
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
      this.doughnutChart = undefined;
    }
  }

  private renderTrendChart(): void {
    if (!this.incomeExpenseCanvas?.nativeElement) return;
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const trends = this.trends();
    const labels = trends.map(t => t.monthLabel || `${t.month}`);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expenses);

    const ctx = this.incomeExpenseCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Income (EGP)',
            data: incomeData,
            backgroundColor: this.palette.income,
            borderRadius: 4,
            barPercentage: 0.65,
            categoryPercentage: 0.7
          },
          {
            label: 'Expenses (EGP)',
            data: expenseData,
            backgroundColor: this.palette.expense,
            borderRadius: 4,
            barPercentage: 0.65,
            categoryPercentage: 0.7
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              boxHeight: 12,
              color: '#245443',
              font: { family: 'DM Sans', size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#245443',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y ?? 0;
                return ` ${context.dataset.label}: EGP ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#718078',
              font: { family: 'DM Sans', size: 11 }
            }
          },
          y: {
            grid: { color: '#E7F0E9' },
            ticks: {
              color: '#718078',
              font: { family: 'DM Sans', size: 11 },
              callback: (val) => `${Number(val).toLocaleString()} EGP`
            }
          }
        }
      }
    });
  }

  private renderDoughnutChart(): void {
    if (!this.expenseCategoryCanvas?.nativeElement) return;
    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }

    const breakdown = this.breakdown();
    if (breakdown.length === 0) return;

    const labels = breakdown.map(b => b.category);
    const data = breakdown.map(b => b.totalAmount);
    const colorList = this.breakdownType() === 'Income'
      ? this.palette.incomeDoughnutColors
      : this.palette.doughnutColors;
    const colors = colorList.slice(0, breakdown.length);

    const ctx = this.expenseCategoryCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#245443',
            titleColor: '#FFFFFF',
            bodyColor: '#FFFFFF',
            padding: 10,
            cornerRadius: 6,
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                const item = breakdown[context.dataIndex];
                return ` ${context.label}: EGP ${val.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${item.percentage}%)`;
              }
            }
          }
        }
      }
    });
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
    this.loadDashboardData();
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
        this.loadDashboardData();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.notificationService.error(err.error?.message || 'Failed to delete transaction.');
      }
    });
  }
}
