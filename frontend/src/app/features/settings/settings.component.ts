import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="settings-container">
      <div class="settings-header">
        <h2 class="section-title">Application & Account Settings</h2>
        <p class="section-subtitle">Manage your personal finance profile and system preferences</p>
      </div>

      <div class="settings-grid">
        <!-- Account Card -->
        <div class="card settings-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">User Account Profile</h3>
              <p class="card-subtitle">Your credentials and account identifier</p>
            </div>
            <span class="badge badge-income">Active Member</span>
          </div>

          <div class="settings-list">
            <div class="settings-row">
              <span class="settings-label">Full Name</span>
              <span class="settings-val font-medium">{{ authService.currentUser()?.fullName || '—' }}</span>
            </div>

            <div class="settings-row">
              <span class="settings-label">Email Address</span>
              <span class="settings-val">{{ authService.currentUser()?.email || '—' }}</span>
            </div>

            <div class="settings-row">
              <span class="settings-label">Account ID</span>
              <span class="settings-val text-mono">{{ authService.currentUser()?.id || '—' }}</span>
            </div>
          </div>
        </div>

        <!-- Preferences Card -->
        <div class="card settings-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Financial Preferences</h3>
              <p class="card-subtitle">Configured display and localization parameters</p>
            </div>
          </div>

          <div class="settings-list">
            <div class="settings-row">
              <div>
                <span class="settings-label">Display Currency</span>
                <p class="settings-sub">All transactions and calculations are represented in this currency</p>
              </div>
              <span class="badge badge-neutral">Egyptian Pound (EGP)</span>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Visual Design Theme</span>
                <p class="settings-sub">Natural, modern palette prioritizing readability and calmness</p>
              </div>
              <span class="badge badge-income">Fresh Botanical Finance</span>
            </div>

            <div class="settings-row">
              <div>
                <span class="settings-label">Database Persistence</span>
                <p class="settings-sub">Enterprise relational isolation</p>
              </div>
              <span class="badge badge-neutral">Microsoft SQL Server</span>
            </div>
          </div>
        </div>

        <!-- Session & Security Card -->
        <div class="card settings-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Session & Security</h3>
              <p class="card-subtitle">Authentication session control</p>
            </div>
          </div>

          <div class="session-box">
            <p class="session-text">
              Your session is authenticated via secure JSON Web Tokens. All financial queries and updates are isolated exclusively to your authenticated identity.
            </p>

            <button type="button" class="btn btn-danger" (click)="authService.logout()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Terminate Session (Sign Out)
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-width: 900px;
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

    .settings-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .settings-card {
      padding: 1.5rem;
    }

    .settings-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .settings-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--border);
    }

    .settings-row:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .settings-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-heading);
      display: block;
    }

    .settings-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.1rem;
    }

    .settings-val {
      font-size: 0.875rem;
      color: var(--text-body);
    }

    .text-mono {
      font-family: monospace;
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--bg-sidebar);
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .font-medium {
      font-weight: 500;
    }

    .session-box {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 1.25rem;
    }

    .session-text {
      font-size: 0.875rem;
      color: var(--text-body);
      line-height: 1.5;
    }
  `]
})
export class SettingsComponent {
  authService = inject(AuthService);
}
