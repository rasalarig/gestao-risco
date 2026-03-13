import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route?: string;
  children?: NavItem[];
  badge?: string;
  dividerAfter?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatExpansionModule,
    MatTooltipModule,
  ],
  template: `
    <nav class="sidebar" [class.collapsed]="collapsed">
      <mat-nav-list>
        @for (item of navItems; track item.label) {
          @if (item.children) {
            <mat-expansion-panel class="nav-expansion" [class.hide-text]="collapsed">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon class="nav-icon">{{ item.icon }}</mat-icon>
                  @if (!collapsed) {
                    <span class="nav-label">{{ item.label }}</span>
                    @if (item.badge) {
                      <span class="nav-badge">{{ item.badge }}</span>
                    }
                  }
                </mat-panel-title>
              </mat-expansion-panel-header>
              @for (child of item.children; track child.label) {
                <a mat-list-item
                   [routerLink]="child.route"
                   routerLinkActive="active"
                   [matTooltip]="collapsed ? child.label : ''"
                   matTooltipPosition="right">
                  <mat-icon matListItemIcon class="child-icon">{{ child.icon }}</mat-icon>
                  @if (!collapsed) {
                    <span matListItemTitle>{{ child.label }}</span>
                  }
                </a>
              }
            </mat-expansion-panel>
          } @else {
            <a mat-list-item
               [routerLink]="item.route"
               routerLinkActive="active"
               [matTooltip]="collapsed ? item.label : ''"
               matTooltipPosition="right">
              <mat-icon matListItemIcon class="nav-icon">{{ item.icon }}</mat-icon>
              @if (!collapsed) {
                <span matListItemTitle class="nav-label">{{ item.label }}</span>
              }
            </a>
            @if (item.dividerAfter && !collapsed) {
              <div class="nav-divider"></div>
            }
          }
        }
      </mat-nav-list>

      <!-- Bottom section -->
      @if (!collapsed) {
        <div class="sidebar-footer">
          <div class="footer-divider"></div>
          <div class="footer-content">
            <span class="footer-brand">GRC Pro</span>
            <span class="footer-version">Plataforma v1.0</span>
          </div>
        </div>
      }
    </nav>
  `,
  styles: [
    `
      .sidebar {
        background: linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%);
        color: white;
        height: 100%;
        width: 260px;
        overflow-y: auto;
        overflow-x: hidden;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        padding-top: 8px;
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 60px;
        left: 0;
        bottom: 0;
        z-index: 100;
      }

      .sidebar.collapsed {
        width: 64px;
      }

      :host ::ng-deep .mat-mdc-nav-list {
        flex: 1;
        padding-top: 4px;
        background-color: transparent !important;
      }

      :host ::ng-deep .mat-mdc-nav-list .mat-mdc-list-item {
        color: rgba(255, 255, 255, 0.8);
        border-radius: 0;
        height: 44px;
        margin: 1px 0;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        border-left: 3px solid transparent;
      }

      :host ::ng-deep .mat-mdc-nav-list .mat-mdc-list-item:hover {
        background-color: rgba(255, 255, 255, 0.12);
        color: #ffffff;
      }

      :host ::ng-deep .mat-mdc-nav-list .mat-mdc-list-item:hover .mdc-list-item__primary-text {
        color: #ffffff;
      }

      :host ::ng-deep .mat-mdc-nav-list .mat-mdc-list-item.active {
        background-color: rgba(0, 94, 184, 0.3);
        color: #ffffff;
        border-left-color: #0091da;
        border-left-width: 3px;
      }

      :host ::ng-deep .mat-mdc-nav-list .mat-mdc-list-item.active .mdc-list-item__primary-text {
        color: #ffffff;
        font-weight: 600;
      }

      :host ::ng-deep .mat-mdc-list-item .mdc-list-item__primary-text {
        color: inherit;
      }

      /* ── Force ALL mat-icon inside sidebar to be white-based ── */
      :host ::ng-deep .sidebar mat-icon,
      :host ::ng-deep .sidebar .mat-icon,
      :host ::ng-deep .sidebar .mat-mdc-list-item mat-icon,
      :host ::ng-deep .sidebar .mat-mdc-list-item .mat-icon,
      :host ::ng-deep .sidebar .mdc-list-item__start mat-icon,
      :host ::ng-deep .sidebar [matlistitemicon] {
        color: rgba(255, 255, 255, 0.75) !important;
        transition: color 0.2s;
      }

      :host ::ng-deep .sidebar .mat-mdc-list-item:hover mat-icon,
      :host ::ng-deep .sidebar .mat-mdc-list-item:hover .mat-icon,
      :host ::ng-deep .sidebar .mat-mdc-list-item.active mat-icon,
      :host ::ng-deep .sidebar .mat-mdc-list-item.active .mat-icon {
        color: #ffffff !important;
      }

      .nav-icon {
        color: rgba(255, 255, 255, 0.75) !important;
        margin-right: 12px;
        font-size: 20px;
        width: 20px;
        height: 20px;
        transition: color 0.2s;
      }

      .child-icon {
        color: rgba(255, 255, 255, 0.65) !important;
        font-size: 18px;
        width: 18px;
        height: 18px;
        margin-right: 10px;
        margin-left: 8px;
        transition: color 0.2s;
      }

      .nav-label {
        color: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        letter-spacing: 0.2px;
      }

      .nav-badge {
        margin-left: auto;
        background: rgba(0, 145, 218, 0.2);
        color: #4dc9f6;
        font-size: 0.625rem;
        font-weight: 700;
        padding: 2px 6px;
        border-radius: 4px;
        letter-spacing: 0.5px;
      }

      .nav-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: 8px 16px;
      }

      :host ::ng-deep .nav-expansion {
        background: transparent !important;
        box-shadow: none !important;
        margin: 0 !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header {
        color: rgba(255, 255, 255, 0.8);
        padding: 0 16px;
        height: 44px;
        font-size: 0.8125rem;
        transition: background 0.2s, color 0.2s;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover {
        background-color: rgba(255, 255, 255, 0.12) !important;
        color: #ffffff !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header mat-icon,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header .mat-icon {
        color: rgba(255, 255, 255, 0.75) !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover mat-icon,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .mat-icon,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .nav-icon {
        color: #ffffff !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .nav-label {
        color: #ffffff !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header .mat-content {
        align-items: center;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-body {
        padding: 0 0 4px 16px;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-indicator,
      :host ::ng-deep .nav-expansion .mat-expansion-indicator::after,
      :host ::ng-deep .nav-expansion .mat-expansion-indicator svg,
      :host ::ng-deep .nav-expansion .mat-expansion-indicator svg path {
        color: rgba(255, 255, 255, 0.5) !important;
        fill: rgba(255, 255, 255, 0.5) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .mat-expansion-indicator,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .mat-expansion-indicator::after,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .mat-expansion-indicator svg,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover .mat-expansion-indicator svg path {
        color: rgba(255, 255, 255, 0.9) !important;
        fill: rgba(255, 255, 255, 0.9) !important;
        border-color: rgba(255, 255, 255, 0.9) !important;
      }

      /* ── Force ALL Material internals transparent on dark navy sidebar ── */

      /* Expansion panel: panel wrapper, header, body, content wrapper */
      :host ::ng-deep .nav-expansion.mat-expansion-panel {
        background-color: transparent !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header {
        background-color: transparent !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-content {
        background-color: transparent !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-body {
        background-color: transparent !important;
      }

      /* Expanded state: Material may add a dark overlay when panel is open */
      :host ::ng-deep .nav-expansion.mat-expanded {
        background-color: transparent !important;
      }

      :host ::ng-deep .nav-expansion.mat-expanded .mat-expansion-panel-header {
        background-color: transparent !important;
      }

      :host ::ng-deep .nav-expansion.mat-expanded .mat-expansion-panel-content {
        background-color: transparent !important;
      }

      /* ── Ripple / state layer overrides: white-based instead of black ── */

      /* Interactive state layer (hover overlay) */
      :host ::ng-deep .mat-mdc-list-item-interactive::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      /* MDC ripple layer */
      :host ::ng-deep .mdc-list-item__ripple::before {
        background-color: rgba(255, 255, 255, 0.12) !important;
      }

      :host ::ng-deep .mdc-list-item__ripple::after {
        background-color: rgba(255, 255, 255, 0.2) !important;
      }

      /* Mat-ripple elements inside list items */
      :host ::ng-deep .mat-mdc-list-item .mat-ripple-element {
        background-color: rgba(255, 255, 255, 0.15) !important;
      }

      /* Focus-visible state: white overlay, not black */
      :host ::ng-deep .mat-mdc-list-item:focus-visible::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      :host ::ng-deep .mat-mdc-list-item.cdk-keyboard-focused::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      /* Pressed / active state */
      :host ::ng-deep .mat-mdc-list-item:active::before {
        background: rgba(255, 255, 255, 0.16) !important;
      }

      :host ::ng-deep .mat-mdc-list-item.cdk-program-focused::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      /* Expansion panel header state layers */
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header .mat-expansion-panel-header-title {
        color: rgba(255, 255, 255, 0.8);
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:focus::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      :host ::ng-deep .nav-expansion .mat-expansion-panel-header:hover::before {
        background: rgba(255, 255, 255, 0.12) !important;
      }

      /* ── Catch-all: any .mdc-* internal backgrounds ── */
      :host ::ng-deep .sidebar .mdc-list-item__content {
        background-color: transparent !important;
      }

      :host ::ng-deep .sidebar .mdc-list-item__start,
      :host ::ng-deep .sidebar .mdc-list-item__end {
        background-color: transparent !important;
      }

      :host ::ng-deep .sidebar .mat-mdc-list-item-unscoped-content {
        background-color: transparent !important;
      }

      /* MDC expansion panel internal elements */
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header-title,
      :host ::ng-deep .nav-expansion .mat-expansion-panel-header-description {
        color: inherit;
      }

      :host ::ng-deep .nav-expansion .mdc-touch-target-wrapper,
      :host ::ng-deep .nav-expansion .mat-expansion-panel__content {
        background-color: transparent !important;
      }

      /* Sidebar footer */
      .sidebar-footer {
        padding: 0 16px 16px;
        margin-top: auto;
      }

      .footer-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin-bottom: 12px;
      }

      .footer-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .footer-brand {
        font-size: 0.75rem;
        font-weight: 800;
        color: rgba(255, 255, 255, 0.25);
        letter-spacing: 2px;
      }

      .footer-version {
        font-size: 0.625rem;
        color: rgba(255, 255, 255, 0.3);
        letter-spacing: 0.3px;
      }
    `,
  ],
})
export class SidebarComponent {
  @Input() collapsed = false;

  navItems: NavItem[] = [
    {
      label: 'Inicio',
      icon: 'home',
      route: '/home',
      dividerAfter: true,
    },
    {
      label: 'Gestao de Riscos',
      icon: 'warning',
      badge: 'GRC',
      children: [
        { label: 'Riscos', icon: 'report_problem', route: '/risks' },
        { label: 'Fatores de Risco', icon: 'fact_check', route: '/risks/factors' },
        { label: 'Avaliacoes', icon: 'assessment', route: '/risks/assessments' },
        { label: 'Controles', icon: 'verified_user', route: '/controls' },
        { label: 'Planos de Acao', icon: 'assignment', route: '/planos-acao' },
      ],
    },
    {
      label: 'Conformidade',
      icon: 'gavel',
      route: '/compliance',
      dividerAfter: true,
    },
    {
      label: 'Analitico',
      icon: 'analytics',
      route: '/analitico',
    },
  ];
}
