import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/interfaces';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  template: `
    <mat-toolbar class="header-toolbar">
      <button mat-icon-button (click)="toggleSidebar.emit()" class="menu-btn" matTooltip="Menu">
        <mat-icon>menu</mat-icon>
      </button>

      <span class="logo-text">
        <span class="logo-brand">GRC Pro</span>
        <span class="logo-sep">|</span>
        <span class="logo-app">Governanca, Risco & Conformidade</span>
      </span>

      <div class="header-selectors">
        <mat-form-field appearance="outline" class="header-select">
          <mat-label>Empresa</mat-label>
          <mat-select value="empresa-demo">
            <mat-option value="empresa-demo">Empresa Demonstracao</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="header-select">
          <mat-label>Periodo</mat-label>
          <mat-select value="2026">
            <mat-option value="2026">2026</mat-option>
            <mat-option value="2025">2025</mat-option>
            <mat-option value="2024">2024</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <span class="spacer"></span>

      <button mat-icon-button class="header-icon-btn" matTooltip="Notificacoes">
        <mat-icon>notifications_none</mat-icon>
      </button>

      <div class="user-section" *ngIf="currentUser">
        <div class="user-info">
          <span class="user-name">{{ currentUser.username }}</span>
          <span class="user-role">{{ currentUser.role }}</span>
        </div>

        <button class="avatar-btn" [matMenuTriggerFor]="userMenu">
          <div class="avatar-circle">
            {{ getInitials(currentUser.username) }}
          </div>
        </button>
      </div>

      <button mat-icon-button *ngIf="!currentUser" [matMenuTriggerFor]="userMenu" class="header-icon-btn">
        <mat-icon>account_circle</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu" class="user-menu-panel">
        <div class="menu-user-info" *ngIf="currentUser">
          <div class="menu-avatar">{{ getInitials(currentUser.username) }}</div>
          <div class="menu-user-details">
            <strong>{{ currentUser.username }}</strong>
            <small>{{ currentUser.email }}</small>
          </div>
        </div>
        <mat-divider *ngIf="currentUser"></mat-divider>
        <button mat-menu-item (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Sair</span>
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: [
    `
      .header-toolbar {
        background: linear-gradient(135deg, #00338d 0%, #001a4d 100%);
        color: white;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 1000;
        height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 16px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.2);
      }

      .menu-btn {
        color: rgba(255, 255, 255, 0.9);
        transition: background var(--transition-fast, 150ms);
      }

      .menu-btn:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .logo-text {
        display: flex;
        align-items: center;
        gap: 10px;
        white-space: nowrap;
      }

      .logo-brand {
        font-size: 1.125rem;
        font-weight: 800;
        letter-spacing: -0.25px;
        color: white;
      }

      .logo-sep {
        color: rgba(255, 255, 255, 0.2);
        font-weight: 200;
        font-size: 1.25rem;
      }

      .logo-app {
        font-size: 0.8125rem;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 0.2px;
      }

      .header-selectors {
        display: flex;
        gap: 8px;
        margin-left: 24px;
      }

      .header-select {
        width: 180px;
      }

      :host ::ng-deep .header-select .mat-mdc-text-field-wrapper {
        height: 36px;
      }

      :host ::ng-deep .header-select .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      :host ::ng-deep .header-select .mat-mdc-form-field-infix {
        padding-top: 6px !important;
        padding-bottom: 6px !important;
        min-height: 36px;
      }

      :host ::ng-deep .header-select .mdc-text-field--outlined .mdc-notched-outline__leading,
      :host ::ng-deep .header-select .mdc-text-field--outlined .mdc-notched-outline__notch,
      :host ::ng-deep .header-select .mdc-text-field--outlined .mdc-notched-outline__trailing {
        border-color: rgba(255, 255, 255, 0.2);
      }

      :host ::ng-deep .header-select .mat-mdc-select-value,
      :host ::ng-deep .header-select .mat-mdc-floating-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 0.75rem;
      }

      :host ::ng-deep .header-select .mat-mdc-select-arrow {
        color: rgba(255, 255, 255, 0.5);
      }

      .spacer {
        flex: 1;
      }

      .header-icon-btn {
        color: rgba(255, 255, 255, 0.75);
        transition: color var(--transition-fast, 150ms);
      }

      .header-icon-btn:hover {
        color: white;
      }

      :host ::ng-deep .header-icon-btn .mat-icon {
        color: inherit;
      }

      .user-section {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
      }

      .user-name {
        font-size: 0.8125rem;
        font-weight: 600;
        color: white;
        line-height: 1.2;
      }

      .user-role {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
      }

      .avatar-btn {
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        outline: none;
      }

      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0091da, #005eb8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8125rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .avatar-circle:hover {
        border-color: rgba(255, 255, 255, 0.5);
        transform: scale(1.05);
      }

      .menu-user-info {
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .menu-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #0091da, #005eb8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.875rem;
        font-weight: 700;
        flex-shrink: 0;
      }

      .menu-user-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .menu-user-details strong {
        font-size: 0.875rem;
        color: #1a1a2e;
      }

      .menu-user-details small {
        font-size: 0.75rem;
        color: #64748b;
      }

      button mat-icon {
        color: white;
      }

      @media (max-width: 900px) {
        .header-selectors {
          display: none;
        }
        .logo-app {
          display: none;
        }
      }
    `,
  ],
})
export class HeaderComponent implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    if (this.authService.isAuthenticated() && !this.currentUser) {
      this.authService.loadCurrentUser();
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/[\s._-]+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
