import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="login-container">
      <!-- Subtle floating shapes -->
      <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
      </div>

      <div class="login-card animate-in">
        <div class="login-header">
          <div class="logo-wrapper">
            <div class="logo-icon">
              <mat-icon>shield</mat-icon>
            </div>
            <div class="logo-text">GRC Pro</div>
          </div>
          <p class="login-tagline">
            Plataforma de Governanca, Risco e Conformidade
          </p>
        </div>

        <form (ngSubmit)="onLogin()" class="login-form">
          <mat-form-field appearance="outline" class="full-width login-field">
            <mat-label>Usuario</mat-label>
            <mat-icon matPrefix class="field-icon">person_outline</mat-icon>
            <input matInput [(ngModel)]="username" name="username" required autocomplete="username" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width login-field">
            <mat-label>Senha</mat-label>
            <mat-icon matPrefix class="field-icon">lock_outline</mat-icon>
            <input
              matInput
              [type]="hidePassword ? 'password' : 'text'"
              [(ngModel)]="password"
              name="password"
              required
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              (click)="hidePassword = !hidePassword"
              class="toggle-pw"
            >
              <mat-icon>{{
                hidePassword ? 'visibility_off' : 'visibility'
              }}</mat-icon>
            </button>
          </mat-form-field>

          <button
            class="login-button full-width"
            type="submit"
            [disabled]="loading"
          >
            @if (loading) {
              <mat-spinner diameter="22" class="btn-spinner"></mat-spinner>
              <span>Entrando...</span>
            } @else {
              <span>Entrar</span>
            }
          </button>
        </form>

        <div class="login-footer">
          &copy; 2026 GRC Pro - Todos os direitos reservados
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }

      @keyframes float1 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(30px, -50px) scale(1.05); }
      }

      @keyframes float2 {
        0%, 100% { transform: translate(0, 0) scale(1); }
        50% { transform: translate(-20px, 30px) scale(0.95); }
      }

      .login-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(-45deg, #00338d, #001f5c, #005eb8, #0071c5);
        background-size: 400% 400%;
        animation: gradientShift 20s ease infinite;
        position: relative;
        overflow: hidden;
      }

      .bg-shapes {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
      }

      .shape {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.03);
      }

      .shape-1 {
        width: 400px;
        height: 400px;
        top: -100px;
        right: -80px;
        animation: float1 25s ease-in-out infinite;
      }

      .shape-2 {
        width: 250px;
        height: 250px;
        bottom: -60px;
        left: -40px;
        animation: float2 20s ease-in-out infinite;
      }

      .shape-3 {
        width: 180px;
        height: 180px;
        top: 40%;
        left: 15%;
        border-radius: 30%;
        animation: float1 30s ease-in-out infinite reverse;
      }

      .login-card {
        background: white;
        border-radius: 24px;
        padding: 48px 40px 36px;
        width: 440px;
        max-width: 92vw;
        box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
        position: relative;
        z-index: 1;
      }

      .login-header {
        text-align: center;
        margin-bottom: 32px;
      }

      .logo-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .logo-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, #00338d, #005eb8);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 16px rgba(0, 51, 141, 0.3);
      }

      .logo-icon mat-icon {
        color: white;
        font-size: 28px;
        width: 28px;
        height: 28px;
      }

      .logo-text {
        font-size: 28px;
        font-weight: 800;
        color: #00338d;
        letter-spacing: -0.5px;
      }

      .login-tagline {
        font-size: 0.8rem;
        color: var(--text-secondary, #64748b);
        margin: 0;
        letter-spacing: 0.2px;
      }

      .login-form {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      :host ::ng-deep .login-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .field-icon {
        color: var(--text-muted, #94a3b8);
        margin-right: 4px;
      }

      .toggle-pw {
        color: var(--text-muted, #94a3b8) !important;
      }

      :host ::ng-deep .toggle-pw .mat-icon {
        color: var(--text-muted, #94a3b8);
      }

      .login-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        height: 50px;
        font-size: 0.9375rem;
        font-weight: 600;
        font-family: inherit;
        color: white;
        background: linear-gradient(135deg, #00338d, #005eb8);
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 51, 141, 0.25);
        margin-top: 12px;
        letter-spacing: 0.3px;
      }

      .login-button:hover:not([disabled]) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(0, 51, 141, 0.35);
      }

      .login-button:active:not([disabled]) {
        transform: translateY(0);
      }

      .login-button[disabled] {
        opacity: 0.7;
        cursor: not-allowed;
      }

      :host ::ng-deep .btn-spinner circle {
        stroke: white !important;
      }

      .login-footer {
        text-align: center;
        margin-top: 32px;
        font-size: 0.6875rem;
        color: var(--text-muted, #94a3b8);
        letter-spacing: 0.2px;
      }

      @media (max-width: 480px) {
        .login-card {
          padding: 32px 24px 28px;
          border-radius: 16px;
        }
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  hidePassword = true;
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onLogin(): void {
    if (!this.username || !this.password) return;
    this.loading = true;
    this.authService
      .login({ username: this.username, password: this.password })
      .subscribe({
        next: () => {
          this.router.navigate(['/home']);
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Usuario ou senha incorretos', 'Fechar', {
            duration: 3000,
          });
        },
      });
  }
}
