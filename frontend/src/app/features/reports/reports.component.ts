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
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { ReportService } from '../../core/services/report.service';
import { CategoryBreakdown, FinancialSummary, MonthlyTrend, ReportFilter } from '../../core/models/report.model';
import { CurrencyEgpPipe } from '../../shared/pipes/currency-egp.pipe';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyEgpPipe,
    StatCardComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="reports-container">
      <!-- Header -->
      <div class="reports-header">
        <div>
          <h2 class="section-title">Financial Reports & Analytics</h2>
          <p class="section-subtitle">Comprehensive breakdown of your capital growth, spending distribution, and trajectories</p>
        </div>
      </div>

      <!-- Filters & Period Bar -->
      <div class="filter-card">
        <div class="filter-flex">
          <div class="period-tabs">
            <button
              type="button"
              class="tab-btn"
              [class.active]="filterMode() === 'preset'"
              (click)="setFilterMode('preset')"
            >
              Presets
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="filterMode() === 'custom'"
              (click)="setFilterMode('custom')"
            >
              Custom Range
            </button>
            <button
              type="button"
              class="tab-btn"
              [class.active]="filterMode() === 'year'"
              (click)="setFilterMode('year')"
            >
              Yearly Review
            </button>
          </div>

          @if (filterMode() === 'preset') {
            <div class="filter-options">
              <select [(ngModel)]="presetPeriod" (ngModelChange)="onPeriodChange()" class="form-select form-select-sm">
                <option value="30d">Last 30 Days</option>
                <option value="7d">Last 7 Days</option>
                <option value="this-month">This Month</option>
                <option value="6m">Last 6 Months</option>
                <option value="this-year">This Year</option>
                <option value="all">All Time</option>
              </select>
            </div>
          }

          @if (filterMode() === 'custom') {
            <div class="filter-options range-inputs">
              <div class="date-field">
                <span class="date-label">From</span>
                <input type="date" [(ngModel)]="customStartDate" (ngModelChange)="onCustomRangeChange()" class="form-control form-control-sm" />
              </div>
              <div class="date-field">
                <span class="date-label">To</span>
                <input type="date" [(ngModel)]="customEndDate" (ngModelChange)="onCustomRangeChange()" class="form-control form-control-sm" />
              </div>
            </div>
          }

          @if (filterMode() === 'year') {
            <div class="filter-options">
              <select [(ngModel)]="selectedYear" (ngModelChange)="onYearChange()" class="form-select form-select-sm">
                @for (y of availableYears; track y) {
                  <option [value]="y">{{ y }} Financial Year</option>
                }
              </select>
            </div>
          }
        </div>
      </div>

      <!-- Financial Summaries -->
      <div class="summary-cards-grid">
        <app-stat-card
          label="Net Cash Flow"
          [value]="summary()?.netCashFlow ?? 0"
          [subtitle]="summary()?.periodLabel || 'Total Net Inflow - Outflow'"
          variant="balance"
          badge="Net"
        ></app-stat-card>

        <app-stat-card
          label="Total Income"
          [value]="summary()?.totalIncome ?? 0"
          [subtitle]="(summary()?.transactionCount ?? 0) + ' total entries logged'"
          variant="income"
          badge="Inflow"
        ></app-stat-card>

        <app-stat-card
          label="Total Expenses"
          [value]="summary()?.totalExpenses ?? 0"
          [subtitle]="summary()?.periodLabel || 'Total expenditure'"
          variant="expense"
          badge="Outflow"
        ></app-stat-card>
      </div>

      <!-- Charts Section -->
      <div class="reports-charts-grid">
        <!-- Monthly Trend Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Monthly Trajectory & Net Flow</h3>
              <p class="card-subtitle">Annual cash flow pattern across all 12 months</p>
            </div>
            <span class="badge badge-neutral">{{ selectedYear }}</span>
          </div>

          <div class="chart-content">
            @if (hasTrendsData()) {
              <div class="canvas-wrapper">
                <canvas #trendChartCanvas></canvas>
              </div>
            } @else {
              <div class="chart-empty">
                <p>No transaction data available for the selected period.</p>
              </div>
            }
          </div>
        </div>

        <!-- Category Doughnut Chart -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Expense Distribution</h3>
              <p class="card-subtitle">Relative proportion of expenses per category</p>
            </div>
          </div>

          <div class="chart-content">
            @if (breakdown().length > 0) {
              <div class="canvas-wrapper doughnut-wrapper">
                <canvas #breakdownChartCanvas></canvas>
              </div>
            } @else {
              <div class="chart-empty">
                <p>No recorded expenses in this period.</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Detailed Category Breakdown Table -->
      <div class="card table-card">
        <div class="card-header p-header">
          <div>
            <h3 class="card-title">Category Audit & Allocation</h3>
            <p class="card-subtitle">Exact figures and percentage breakdown of expenses</p>
          </div>
          <span class="badge badge-expense">
            {{ breakdown().length }} Active Categories
          </span>
        </div>

        @if (breakdown().length === 0) {
          <div class="empty-padded">
            <app-empty-state
              title="No Expense Data for this Period"
              description="Switch your date filter or log expenses to see your detailed breakdown here."
              [actionText]="undefined"
            ></app-empty-state>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th class="text-center">Transactions</th>
                  <th>Proportion</th>
                  <th class="text-right">Share (%)</th>
                  <th class="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                @for (item of breakdown(); track item.category) {
                  <tr>
                    <td class="category-name-cell">
                      <span class="category-color-pill"></span>
                      <span class="font-medium">{{ item.category }}</span>
                    </td>
                    <td class="text-center">{{ item.transactionCount }}</td>
                    <td class="progress-cell">
                      <div class="progress-track">
                        <div class="progress-fill" [style.width.%]="item.percentage"></div>
                      </div>
                    </td>
                    <td class="text-right font-medium">{{ item.percentage }}%</td>
                    <td class="text-right font-bold expense-amount">
                      {{ item.totalAmount | currencyEgp }}
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr class="table-total-row">
                  <td class="font-bold">Total Expenses</td>
                  <td class="text-center font-bold">{{ totalExpenseTransactions() }}</td>
                  <td></td>
                  <td class="text-right font-bold">100.00%</td>
                  <td class="text-right font-bold expense-amount">
                    {{ summary()?.totalExpenses | currencyEgp }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .reports-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
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

    .filter-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1rem 1.25rem;
      box-shadow: var(--shadow-xs);
    }

    .filter-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .period-tabs {
      display: flex;
      gap: 0.25rem;
      background: var(--bg-sidebar);
      padding: 0.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
    }

    .tab-btn {
      background: transparent;
      border: none;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
      font-weight: 500;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab-btn.active {
      background: var(--bg-surface);
      color: var(--primary);
      box-shadow: var(--shadow-xs);
      font-weight: 600;
    }

    .filter-options {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .range-inputs {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .date-field {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .date-label {
      font-size: 0.775rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    .form-control-sm, .form-select-sm {
      padding: 0.35rem 0.65rem;
      font-size: 0.8125rem;
    }

    .summary-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }

    .reports-charts-grid {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 1.25rem;
    }

    .chart-card {
      min-height: 360px;
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
      height: 280px;
    }

    .doughnut-wrapper {
      height: 240px;
      display: flex;
      justify-content: center;
    }

    .chart-empty {
      color: var(--text-muted);
      font-size: 0.875rem;
      text-align: center;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .p-header {
      padding: 1.25rem 1.5rem 1rem;
      margin-bottom: 0;
      border-bottom: 1px solid var(--border);
    }

    .empty-padded {
      padding: 1.5rem;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      background: var(--bg-sidebar);
      padding: 0.75rem 1.25rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
      text-align: left;
    }

    .data-table td {
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--border);
      color: var(--text-body);
      vertical-align: middle;
    }

    .category-name-cell {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .category-color-pill {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: var(--expense);
    }

    .progress-cell {
      width: 160px;
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background-color: var(--bg-sidebar);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--expense);
      border-radius: 9999px;
      transition: width 0.3s ease;
    }

    .expense-amount {
      color: var(--expense);
    }

    .table-total-row {
      background-color: #FAFDFB;
      border-top: 2px solid var(--border);
    }

    .table-total-row td {
      border-bottom: none;
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .text-right {
      text-align: right;
    }

    .text-center {
      text-align: center;
    }

    .font-medium {
      font-weight: 500;
    }

    .font-bold {
      font-weight: 700;
    }

    @media (max-width: 1024px) {
      .reports-charts-grid {
        grid-template-columns: 1fr;
      }
      .summary-cards-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ReportsComponent implements OnInit, OnDestroy {
  @ViewChild('trendChartCanvas') trendChartCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('breakdownChartCanvas') breakdownChartCanvas?: ElementRef<HTMLCanvasElement>;

  private reportService = inject(ReportService);

  filterMode = signal<'preset' | 'custom' | 'year'>('preset');
  presetPeriod = '30d';
  customStartDate = '';
  customEndDate = '';
  selectedYear = new Date().getFullYear();
  availableYears = [2026, 2025, 2024];

  summary = signal<FinancialSummary | null>(null);
  breakdown = signal<CategoryBreakdown[]>([]);
  trends = signal<MonthlyTrend[]>([]);
  hasTrendsData = signal(false);

  private trendChart?: Chart;
  private breakdownChart?: Chart;

  private readonly palette = {
    income: '#4F8A68',
    expense: '#D98B73',
    netFlow: '#2F6B57',
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
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  setFilterMode(mode: 'preset' | 'custom' | 'year'): void {
    this.filterMode.set(mode);
    this.loadReports();
  }

  onPeriodChange(): void {
    this.loadReports();
  }

  onCustomRangeChange(): void {
    if (this.customStartDate && this.customEndDate) {
      this.loadReports();
    }
  }

  onYearChange(): void {
    this.loadReports();
  }

  totalExpenseTransactions(): number {
    return this.breakdown().reduce((acc, b) => acc + b.transactionCount, 0);
  }

  private buildFilter(): ReportFilter {
    const mode = this.filterMode();
    if (mode === 'preset') {
      return { period: this.presetPeriod as any };
    } else if (mode === 'custom') {
      return {
        startDate: this.customStartDate || undefined,
        endDate: this.customEndDate || undefined
      };
    } else {
      return { year: this.selectedYear };
    }
  }

  loadReports(): void {
    const filter = this.buildFilter();

    this.reportService.getSummary(filter).subscribe({
      next: (res) => {
        this.summary.set(res);
      }
    });

    this.reportService.getExpenseBreakdown(filter).subscribe({
      next: (res) => {
        this.breakdown.set(res);
        setTimeout(() => this.renderBreakdownChart(), 50);
      }
    });

    const targetYear = filter.year || (filter.startDate ? new Date(filter.startDate).getFullYear() : this.selectedYear);
    this.reportService.getMonthlyTrend({ year: targetYear }).subscribe({
      next: (res) => {
        this.trends.set(res);
        const hasData = res.some(t => t.income > 0 || t.expenses > 0);
        this.hasTrendsData.set(hasData);
        setTimeout(() => this.renderTrendChart(), 50);
      }
    });
  }

  private destroyCharts(): void {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = undefined;
    }
    if (this.breakdownChart) {
      this.breakdownChart.destroy();
      this.breakdownChart = undefined;
    }
  }

  private renderTrendChart(): void {
    if (!this.trendChartCanvas?.nativeElement) return;
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    const trends = this.trends();
    const labels = trends.map(t => t.monthLabel || `${t.month}`);
    const incomeData = trends.map(t => t.income);
    const expenseData = trends.map(t => t.expenses);
    const netFlowData = trends.map(t => t.netCashFlow);

    const ctx = this.trendChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'bar',
            label: 'Income',
            data: incomeData,
            backgroundColor: this.palette.income,
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            type: 'bar',
            label: 'Expenses',
            data: expenseData,
            backgroundColor: this.palette.expense,
            borderRadius: 4,
            barPercentage: 0.65
          },
          {
            type: 'line',
            label: 'Net Cash Flow',
            data: netFlowData,
            borderColor: this.palette.netFlow,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointBackgroundColor: this.palette.netFlow,
            pointRadius: 3,
            tension: 0.2
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

  private renderBreakdownChart(): void {
    if (!this.breakdownChartCanvas?.nativeElement) return;
    if (this.breakdownChart) {
      this.breakdownChart.destroy();
    }

    const breakdown = this.breakdown();
    if (breakdown.length === 0) return;

    const labels = breakdown.map(b => b.category);
    const data = breakdown.map(b => b.totalAmount);
    const colors = this.palette.doughnutColors.slice(0, breakdown.length);

    const ctx = this.breakdownChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.breakdownChart = new Chart(ctx, {
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
        cutout: '68%',
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 12,
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
                const item = breakdown[context.dataIndex];
                return ` ${context.label}: EGP ${context.parsed.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${item.percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
}
