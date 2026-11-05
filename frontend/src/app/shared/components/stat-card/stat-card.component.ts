import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrencyEgpPipe } from '../../pipes/currency-egp.pipe';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, CurrencyEgpPipe],
  template: `
    <div class="stat-card" [ngClass]="'variant-' + variant">
      <div class="stat-header">
        <span class="stat-title">{{ label }}</span>
        <div class="stat-icon" [ngClass]="'icon-' + variant">
          <ng-container [ngSwitch]="variant">
            <!-- Income: Trending up leaf -->
            <svg *ngSwitchCase="'income'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              <polyline points="18 10 22 6 18 2"/>
            </svg>
            <!-- Expense: Outflow -->
            <svg *ngSwitchCase="'expense'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
              <polyline points="17 18 23 18 23 12"/>
            </svg>
            <!-- Savings: Vault / Soft Gold -->
            <svg *ngSwitchCase="'savings'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <circle cx="12" cy="12" r="2"/>
              <path d="M6 12h.01M18 12h.01"/>
            </svg>
            <!-- Default Balance / Net Flow: Botanical Leaf -->
            <svg *ngSwitchDefault width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </ng-container>
        </div>
      </div>

      <div class="stat-value" [ngClass]="'value-' + variant">
        {{ value | currencyEgp }}
      </div>

      <div class="stat-footer">
        <span class="stat-subtext">{{ subtitle || 'Selected period' }}</span>
        @if (badge) {
          <span class="stat-badge" [ngClass]="'badge-' + variant">{{ badge }}</span>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background-color: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 1.25rem 1.4rem;
      box-shadow: var(--shadow-xs);
      transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .stat-card:hover {
      box-shadow: var(--shadow-sm);
      border-color: var(--accent-sage);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .stat-title {
      font-size: 0.84rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-sidebar);
      color: var(--primary);
    }

    .icon-income {
      background-color: var(--income-bg);
      color: var(--income);
    }

    .icon-expense {
      background-color: var(--expense-bg);
      color: var(--expense);
    }

    .icon-savings {
      background-color: var(--accent-gold-bg);
      color: var(--accent-gold);
    }

    .stat-value {
      font-size: 1.65rem;
      font-weight: 700;
      color: var(--text-heading);
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .value-income {
      color: var(--income);
    }

    .value-expense {
      color: var(--expense);
    }

    .value-balance {
      color: var(--primary);
    }

    .value-savings {
      color: #9E7B28;
    }

    .stat-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 0.1rem;
    }

    .stat-subtext {
      font-size: 0.775rem;
      color: var(--text-muted);
    }

    .stat-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      background-color: var(--bg-sidebar);
      color: var(--text-muted);
    }

    .badge-income {
      background-color: var(--income-bg);
      color: var(--income);
    }

    .badge-expense {
      background-color: var(--expense-bg);
      color: var(--expense);
    }

    .badge-savings {
      background-color: var(--accent-gold-bg);
      color: #9E7B28;
    }
  `]
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: number | null = 0;
  @Input() subtitle = '';
  @Input() variant: 'balance' | 'income' | 'expense' | 'savings' | 'neutral' = 'neutral';
  @Input() badge?: string;
}
