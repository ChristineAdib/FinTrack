import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NotificationComponent } from '../../shared/components/notification/notification.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationComponent],
  template: `
    <app-notification></app-notification>

    <div class="app-layout">
      <!-- Mobile Backdrop -->
      @if (mobileMenuOpen()) {
        <div class="mobile-backdrop" (click)="toggleMobileMenu(false)"></div>
      }

      <!-- Left Sidebar Navigation -->
      <aside class="sidebar" [class.mobile-open]="mobileMenuOpen()">
        <div class="sidebar-brand">
          <div class="brand-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <div class="brand-text">
            <span class="brand-name">FinTrack</span>
            <span class="brand-tag">Fresh Botanical</span>
          </div>
          <button class="mobile-close-btn" (click)="toggleMobileMenu(false)" aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section-label">Finance Core</div>

          <a routerLink="/dashboard" routerLinkActive="active" (click)="toggleMobileMenu(false)" class="nav-item">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="7" height="9" x="3" y="3" rx="1"/>
              <rect width="7" height="5" x="14" y="3" rx="1"/>
              <rect width="7" height="9" x="14" y="12" rx="1"/>
              <rect width="7" height="5" x="3" y="16" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/transactions" routerLinkActive="active" (click)="toggleMobileMenu(false)" class="nav-item">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M7 16h10M7 8h10M7 12h6"/>
              <rect width="18" height="18" x="3" y="3" rx="2"/>
            </svg>
            <span>Transactions</span>
          </a>

          <a routerLink="/reports" routerLinkActive="active" (click)="toggleMobileMenu(false)" class="nav-item">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
            <span>Reports & Analytics</span>
          </a>

          <div class="nav-section-label" style="margin-top: 1.5rem;">Preferences</div>

          <a routerLink="/settings" routerLinkActive="active" (click)="toggleMobileMenu(false)" class="nav-item">
            <svg class="nav-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            <span>Settings</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile-badge">
            <div class="avatar-circle">
              {{ userInitials() }}
            </div>
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.fullName || 'User' }}</span>
              <span class="user-email">{{ authService.currentUser()?.email }}</span>
            </div>
          </div>
          <button class="logout-btn" (click)="onLogout()" title="Sign Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <!-- Main Layout Body -->
      <div class="main-wrapper">
        <!-- Top Header -->
        <header class="top-header">
          <div class="header-left">
            <button class="mobile-toggle-btn" (click)="toggleMobileMenu(true)" aria-label="Toggle navigation">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <div class="header-titles">
              <h1 class="page-title">{{ currentPageTitle() }}</h1>
              <span class="page-subtitle">{{ currentDateString }}</span>
            </div>
          </div>

          <div class="header-right">
            <div class="currency-badge">
              <span class="currency-dot"></span>
              <span>Currency: EGP</span>
            </div>
          </div>
        </header>

        <!-- Main Routed Content -->
        <main class="content-area">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
      background-color: var(--bg-main);
    }

    /* Left Sidebar */
    .sidebar {
      width: 260px;
      background-color: var(--bg-sidebar);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100vh;
      z-index: 100;
      transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .sidebar-brand {
      padding: 1.5rem 1.4rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    .brand-logo {
      width: 38px;
      height: 38px;
      border-radius: var(--radius-md);
      background-color: var(--primary);
      color: #FFFFFF;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-xs);
    }

    .brand-text {
      display: flex;
      flex-direction: column;
    }

    .brand-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--text-heading);
      letter-spacing: -0.01em;
      line-height: 1.2;
    }

    .brand-tag {
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .mobile-close-btn {
      display: none;
      background: transparent;
      border: none;
      margin-left: auto;
      color: var(--text-muted);
      cursor: pointer;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1.25rem 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      overflow-y: auto;
    }

    .nav-section-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      padding: 0.4rem 0.75rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      color: var(--text-body);
      font-size: 0.9rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .nav-item:hover {
      background-color: var(--bg-sidebar-hover);
      color: var(--text-heading);
    }

    .nav-item.active {
      background-color: var(--primary);
      color: #FFFFFF;
      box-shadow: var(--shadow-xs);

      .nav-icon {
        color: #FFFFFF;
      }
    }

    .nav-icon {
      color: var(--text-muted);
      transition: color 0.15s ease;
      flex-shrink: 0;
    }

    .sidebar-footer {
      padding: 1rem 1.1rem;
      border-top: 1px solid var(--border);
      background-color: rgba(255, 255, 255, 0.4);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .user-profile-badge {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .avatar-circle {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background-color: var(--accent-sage);
      color: #FFFFFF;
      font-weight: 600;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .user-name {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--text-heading);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .user-email {
      font-size: 0.75rem;
      color: var(--text-muted);
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .logout-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.45rem 0.75rem;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      color: var(--warning);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      width: 100%;
    }

    .logout-btn:hover {
      background-color: var(--warning-bg);
      border-color: var(--expense-border);
    }

    /* Main wrapper */
    .main-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* Top Header */
    .top-header {
      background-color: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      padding: 1.1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .mobile-toggle-btn {
      display: none;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.35rem;
      color: var(--text-heading);
      cursor: pointer;
    }

    .page-title {
      font-size: 1.35rem;
      font-weight: 700;
      color: var(--text-heading);
      letter-spacing: -0.015em;
    }

    .page-subtitle {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-top: 0.1rem;
      display: block;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .currency-badge {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      background-color: var(--bg-sidebar);
      border: 1px solid var(--border);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--primary);
    }

    .currency-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background-color: var(--income);
    }

    /* Content Area */
    .content-area {
      flex: 1;
      padding: 2rem;
      max-width: 1400px;
      width: 100%;
      margin: 0 auto;
    }

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .content-area {
        padding: 1.5rem;
      }
      .top-header {
        padding: 1rem 1.5rem;
      }
    }

    @media (max-width: 768px) {
      .mobile-toggle-btn {
        display: flex;
      }

      .mobile-close-btn {
        display: flex;
      }

      .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        box-shadow: var(--shadow-lg);
      }

      .sidebar.mobile-open {
        transform: translateX(0);
      }

      .mobile-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(36, 84, 67, 0.3);
        backdrop-filter: blur(2px);
        z-index: 99;
      }

      .content-area {
        padding: 1rem;
      }

      .top-header {
        padding: 0.85rem 1rem;
      }

      .page-title {
        font-size: 1.15rem;
      }
    }
  `]
})
export class ShellComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  mobileMenuOpen = signal(false);
  currentPageTitle = signal('Dashboard');

  currentDateString = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date());

  userInitials = computed(() => {
    const user = this.authService.currentUser();
    if (!user || !user.fullName) return 'FT';
    const parts = user.fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.fullName.substring(0, 2).toUpperCase();
  });

  constructor() {
    this.updateTitleFromRoute(this.router.url);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.updateTitleFromRoute(event.urlAfterRedirects);
    });
  }

  toggleMobileMenu(open: boolean): void {
    this.mobileMenuOpen.set(open);
  }

  onLogout(): void {
    this.authService.logout();
  }

  private updateTitleFromRoute(url: string): void {
    if (url.includes('/dashboard')) {
      this.currentPageTitle.set('Financial Dashboard');
    } else if (url.includes('/transactions')) {
      this.currentPageTitle.set('Transactions Management');
    } else if (url.includes('/reports')) {
      this.currentPageTitle.set('Reports & Insights');
    } else if (url.includes('/settings')) {
      this.currentPageTitle.set('User Settings');
    } else {
      this.currentPageTitle.set('FinTrack');
    }
  }
}
