import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <app-header (toggleSidebar)="sidebarCollapsed = !sidebarCollapsed"></app-header>
    <div class="layout-container">
      <app-sidebar [collapsed]="sidebarCollapsed"></app-sidebar>
      <main class="main-content" [class.sidebar-collapsed]="sidebarCollapsed">
        <div class="content-accent-line"></div>
        <div class="content-inner">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      .layout-container {
        display: flex;
        margin-top: 60px;
        height: calc(100vh - 60px);
      }

      .main-content {
        flex: 1;
        background-color: var(--bg-primary, #f0f2f5);
        overflow-y: auto;
        margin-left: 260px;
        transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
      }

      .main-content.sidebar-collapsed {
        margin-left: 64px;
      }

      .content-accent-line {
        height: 2px;
        background: linear-gradient(90deg, var(--grc-primary, #00338D), var(--grc-accent, #0091DA), var(--grc-secondary, #005EB8));
        flex-shrink: 0;
      }

      .content-inner {
        flex: 1;
        padding: 24px;
        overflow-y: auto;
      }
    `,
  ],
})
export class MainLayoutComponent {
  sidebarCollapsed = false;
}
