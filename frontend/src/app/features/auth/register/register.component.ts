import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationComponent } from '../../../shared/components/notification/notification.component';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  if (!password || !confirmPassword) return null;
  return password.value === confirmPassword.value ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NotificationComponent],
  template: `
    <app-notification></app-notification>

    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-brand">
          <div class="brand-badge">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
            </svg>
          </div>
          <h2 class="auth-title">Create your FinTrack Account</h2>
          <p class="auth-subtitle">Begin your journey to balanced and thoughtful personal finance</p>
        </div>

        @if (errorMessage()) {
          <div class="auth-alert">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label class="form-label" for="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              formControlName="fullName"
              placeholder="e.g. Sarah Mitchell"
              class="form-control"
              [class.is-invalid]="registerForm.get('fullName')?.touched && registerForm.get('fullName')?.invalid"
            />
            @if (registerForm.get('fullName')?.touched && registerForm.get('fullName')?.hasError('required')) {
              <div class="form-error">Full name is required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input
              id="email"
              type="email"
              formControlName="email"
              placeholder="name@example.com"
              class="form-control"
              [class.is-invalid]="registerForm.get('email')?.touched && registerForm.get('email')?.invalid"
            />
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.hasError('required')) {
              <div class="form-error">Email is required.</div>
            }
            @if (registerForm.get('email')?.touched && registerForm.get('email')?.hasError('email')) {
              <div class="form-error">Please enter a valid email address.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input
              id="password"
              type="password"
              formControlName="password"
              placeholder="At least 6 characters"
              class="form-control"
              [class.is-invalid]="registerForm.get('password')?.touched && registerForm.get('password')?.invalid"
            />
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('required')) {
              <div class="form-error">Password is required.</div>
            }
            @if (registerForm.get('password')?.touched && registerForm.get('password')?.hasError('minlength')) {
              <div class="form-error">Password must be at least 6 characters.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              formControlName="confirmPassword"
              placeholder="Re-enter your password"
              class="form-control"
              [class.is-invalid]="registerForm.get('confirmPassword')?.touched && (registerForm.get('confirmPassword')?.invalid || registerForm.hasError('passwordMismatch'))"
            />
            @if (registerForm.get('confirmPassword')?.touched && registerForm.get('confirmPassword')?.hasError('required')) {
              <div class="form-error">Please confirm your password.</div>
            }
            @if (registerForm.get('confirmPassword')?.touched && registerForm.hasError('passwordMismatch') && !registerForm.get('confirmPassword')?.hasError('required')) {
              <div class="form-error">Passwords do not match.</div>
            }
          </div>

          <button type="submit" class="btn btn-primary btn-submit" [disabled]="registerForm.invalid || isSubmitting()">
            @if (isSubmitting()) {
              <span class="spinner"></span> Creating Account...
            } @else {
              Create Account
            }
          </button>
        </form>

        <div class="auth-footer">
          <span>Already have an account?</span>
          <a routerLink="/login" class="auth-link">Sign In</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-main);
      padding: 1.5rem;
    }

    .auth-card {
      width: 100%;
      max-width: 460px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 2.25rem 2rem;
      box-shadow: var(--shadow-md);
    }

    .auth-brand {
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-badge {
      width: 52px;
      height: 52px;
      border-radius: var(--radius-md);
      background-color: var(--primary);
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-xs);
    }

    .auth-title {
      font-size: 1.45rem;
      font-weight: 700;
      color: var(--text-heading);
      letter-spacing: -0.015em;
    }

    .auth-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 0.35rem;
    }

    .auth-alert {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      background-color: var(--warning-bg);
      border: 1px solid var(--expense-border);
      color: var(--warning);
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.84rem;
      margin-bottom: 1.25rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .btn-submit {
      width: 100%;
      padding: 0.7rem;
      font-size: 0.9375rem;
      margin-top: 0.75rem;
    }

    .auth-footer {
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border);
      display: flex;
      justify-content: center;
      gap: 0.35rem;
    }

    .auth-link {
      font-weight: 600;
      color: var(--primary);
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.4);
      border-top-color: #FFFFFF;
      border-radius: 50%;
      display: inline-block;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  registerForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { fullName, email, password, confirmPassword } = this.registerForm.value;

    this.authService.register({
      fullName: fullName!,
      email: email!,
      password: password!,
      confirmPassword: confirmPassword!
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.notificationService.success('Account created successfully! Welcome to FinTrack.');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Failed to create account. Please check your information.';
        this.errorMessage.set(msg);
        this.notificationService.error(msg);
      }
    });
  }
}
