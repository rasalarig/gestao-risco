import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { User, DashboardStats } from '../../core/models/interfaces';

interface ModuleCard {
  title: string;
  subtitle: string;
  icon: string;
  route: string;
  gradient: string;
  patternOpacity: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
  ],
  template: `
    <div class="home-container">
      <!-- Welcome section -->
      <div class="welcome-section animate-in">
        <div class="welcome-text">
          <h1>Bem-vindo ao GRC Pro</h1>
          <p class="welcome-subtitle" *ngIf="currentUser">
            Ol\u00e1, <strong>{{ currentUser.username }}</strong>. Selecione um m\u00f3dulo para come\u00e7ar.
          </p>
        </div>
      </div>

      <!-- Module cards grid -->
      <div class="cards-grid">
        @for (card of moduleCards; track card.title; let i = $index) {
          <div class="module-card"
               [style.animation-delay]="(i * 80) + 'ms'"
               [style.background]="card.gradient"
               (click)="navigate(card.route)">
            <!-- Abstract pattern overlay -->
            <div class="card-pattern" [style.opacity]="card.patternOpacity"></div>

            <div class="card-body">
              <div class="card-icon-wrapper">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div class="card-content">
                <h3>{{ card.title }}</h3>
                <p>{{ card.subtitle }}</p>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats animate-in" style="animation-delay: 350ms">
        <div class="stat-item">
          <mat-icon class="stat-icon stat-blue">report_problem</mat-icon>
          <span class="stat-value">{{ stats?.total_riscos ?? 0 }}</span>
          <span class="stat-label">Riscos Ativos</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <mat-icon class="stat-icon stat-teal">verified_user</mat-icon>
          <span class="stat-value">{{ stats?.total_controles ?? 0 }}</span>
          <span class="stat-label">Controles</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <mat-icon class="stat-icon stat-orange">assignment</mat-icon>
          <span class="stat-value">{{ stats?.total_planos_acao ?? 0 }}</span>
          <span class="stat-label">Planos de A\u00e7\u00e3o</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <mat-icon class="stat-icon stat-purple">assessment</mat-icon>
          <span class="stat-value">{{ stats?.total_avaliacoes ?? 0 }}</span>
          <span class="stat-label">Avalia\u00e7\u00f5es</span>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @keyframes cardFadeIn {
        from { opacity: 0; transform: translateY(16px); }
        to { opacity: 1; transform: translateY(0); }
      }

      .home-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 8px 0;
      }

      /* Welcome */
      .welcome-section {
        margin-bottom: 32px;
      }

      .welcome-text h1 {
        font-size: 1.6rem;
        font-weight: 700;
        color: var(--text-primary, #1a1a2e);
        letter-spacing: -0.025em;
        margin-bottom: 6px;
      }

      .welcome-subtitle {
        font-size: 0.9rem;
        color: var(--text-secondary, #64748b);
        margin: 0;
      }

      .welcome-subtitle strong {
        color: var(--grc-primary, #00338D);
        font-weight: 600;
      }

      /* Cards grid */
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 28px;
      }

      @media (max-width: 1100px) {
        .cards-grid { grid-template-columns: repeat(2, 1fr); }
      }

      @media (max-width: 600px) {
        .cards-grid { grid-template-columns: 1fr; }
      }

      .module-card {
        border-radius: 16px;
        padding: 28px 24px;
        color: white;
        cursor: pointer;
        min-height: 200px;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        position: relative;
        overflow: hidden;
        animation: cardFadeIn 0.5s ease-out forwards;
        opacity: 0;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .module-card:hover {
        transform: translateY(-6px) scale(1.02);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
      }

      /* Geometric pattern overlay */
      .card-pattern {
        position: absolute;
        inset: 0;
        background-image:
          radial-gradient(circle at 20% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%),
          linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.04) 60%, transparent 60%);
        pointer-events: none;
      }

      .card-body {
        position: relative;
        z-index: 1;
      }

      .card-icon-wrapper {
        width: 52px;
        height: 52px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16px;
        backdrop-filter: blur(4px);
      }

      .card-icon-wrapper mat-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
        color: white;
      }

      .card-content h3 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 6px;
        color: white;
        letter-spacing: -0.01em;
      }

      .card-content p {
        font-size: 12px;
        margin: 0;
        opacity: 0.75;
        color: white;
        font-weight: 400;
      }

      /* Quick Stats Bar */
      .quick-stats {
        background: white;
        border-radius: 14px;
        padding: 20px 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 32px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .stat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .stat-blue { color: #00338D; }
      .stat-teal { color: #0E7490; }
      .stat-orange { color: #D97706; }
      .stat-purple { color: #7C3AED; }

      .stat-value {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--text-primary, #1a1a2e);
        line-height: 1;
      }

      .stat-label {
        font-size: 0.8rem;
        color: var(--text-secondary, #64748b);
        font-weight: 500;
      }

      .stat-divider {
        width: 1px;
        height: 32px;
        background: #e2e8f0;
      }

      @media (max-width: 800px) {
        .quick-stats {
          flex-wrap: wrap;
          gap: 16px;
          padding: 16px;
        }
        .stat-divider { display: none; }
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  currentUser: User | null = null;
  stats: DashboardStats | null = null;

  moduleCards: ModuleCard[] = [
    {
      title: 'M\u00f3dulo Estrat\u00e9gico',
      subtitle: 'ERM - Enterprise Risk Management',
      icon: 'shield',
      route: '/risks',
      gradient: 'linear-gradient(135deg, #00338D 0%, #005EB8 100%)',
      patternOpacity: '1',
    },
    {
      title: 'M\u00f3dulo Operacional',
      subtitle: 'Controles e Riscos Operacionais',
      icon: 'settings',
      route: '/controls',
      gradient: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)',
      patternOpacity: '1',
    },
    {
      title: 'M\u00f3dulo Anal\u00edtico',
      subtitle: 'Indicadores e Dashboard',
      icon: 'analytics',
      route: '/analytics',
      gradient: 'linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)',
      patternOpacity: '1',
    },
    {
      title: 'M\u00f3dulo Conformidade',
      subtitle: 'Documentos, Engajamentos e Controles',
      icon: 'gavel',
      route: '/compliance',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
      patternOpacity: '1',
    },
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
    this.loadStats();
  }

  loadStats(): void {
    this.api.getDashboardStats({}).subscribe({
      next: (data) => {
        this.stats = data;
      },
      error: () => {},
    });
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
