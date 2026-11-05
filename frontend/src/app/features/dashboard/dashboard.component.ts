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
import { CategoryBreakdown, FinancialSummary, MonthlyTrend, ReportFilter } from '../../core/models/report.model';
import { Transaction } from '../../core/models/transaction.model';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { TransactionFormModalComponent } from '../transactions/transaction-form-modal/transaction-form-modal.component';
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

        <button type="button" class="btn btn-primary" (click)="openAddModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Record Transaction
        </button>
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
              <p class="card-subtitle">Monthly trajectory based on verified transactions</p>
            </div>
            <span class="badge badge-neutral">{{ currentYear }}</span>
          </div>

          <div class="chart-content">
            @if (hasAnyData()) {
              <div class="canvas-wrapper">
                <canvas #incomeExpenseCanvas></canvas>
              </div>
            } @else {
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

        <!-- Expense Breakdown Doughnut -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Expense Allocation</h3>
              <p class="card-subtitle">Breakdown by category for {{ summary()?.periodLabel || 'period' }}</p>
            </div>
          </div>

          <div class="chart-content doughnut-layout">
            @if (breakdown().length > 0) {
              <div class="doughnut-canvas-wrapper">
                <canvas #expenseCategoryCanvas></canvas>
              </div>
              <div class="breakdown-list">
                @for (item of breakdown().slice(0, 5); track item.category) {
                  <div class="breakdown-item">
                    <div class="breakdown-info">
                      <span class="breakdown-dot"></span>
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
                <p>No expense transactions recorded in this period.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Recent Transactions Section -->
      <div class="card recent-transactions-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Recent Transactions</h3>
            <p class="card-subtitle">Latest movements in your personal botanical ledger</p>
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
                  <span class="recent-amount" [ngClass]="t.type === 'Income' ? 'amount-income' : 'amount-expense'">
                    {{ t.type === 'Income' ? '+' : '-' }}{{ t.amount | currencyEgp }}
                  </span>
                  <span class="recent-date">{{ t.transactionDate | date:'MMM d, yyyy' }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Add Transaction Modal -->
      <app-transaction-form-modal
        [isOpen]="addModalOpen()"
        (close)="closeAddModal()"
        (saved)="onTransactionSaved()"
      ></app-transaction-form-modal>
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
      background-color: var(--expense);
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
    }

    .recent-item:hover {
      background-color: var(--bg-sidebar);
    }

    .recent-item-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }

    .recent-type-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
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
    }

    .recent-category {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-heading);
    }

    .recent-desc {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .recent-item-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    }

    .recent-amount {
      font-size: 0.9375rem;
      font-weight: 700;
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
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('incomeExpenseCanvas') incomeExpenseCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('expenseCategoryCanvas') expenseCategoryCanvas?: ElementRef<HTMLCanvasElement>;

  private reportService = inject(ReportService);
  private transactionService = inject(TransactionService);

  selectedPeriod = signal<'7d' | '30d' | '6m' | 'this-year' | 'all'>('30d');
  currentYear = new Date().getFullYear();

  summary = signal<FinancialSummary | null>(null);
  breakdown = signal<CategoryBreakdown[]>([]);
  trends = signal<MonthlyTrend[]>([]);
  recentTransactions = signal<Transaction[]>([]);

  hasAnyData = signal(false);
  addModalOpen = signal(false);

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

  loadDashboardData(): void {
    const filter: ReportFilter = { period: this.selectedPeriod() };

    this.reportService.getSummary(filter).subscribe({
      next: (res) => {
        this.summary.set(res);
        this.hasAnyData.set((res.totalIncome > 0 || res.totalExpenses > 0 || res.transactionCount > 0));
      }
    });

    this.reportService.getExpenseBreakdown(filter).subscribe({
      next: (res) => {
        this.breakdown.set(res);
        setTimeout(() => this.renderDoughnutChart(), 50);
      }
    });

    this.reportService.getMonthlyTrend({ year: this.currentYear }).subscribe({
      next: (res) => {
        this.trends.set(res);
        setTimeout(() => this.renderTrendChart(), 50);
      }
    });

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
    const colors = this.palette.doughnutColors.slice(0, breakdown.length);

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
    this.addModalOpen.set(true);
  }

  closeAddModal(): void {
    this.addModalOpen.set(false);
  }

  onTransactionSaved(): void {
    this.loadDashboardData();
  }
}
