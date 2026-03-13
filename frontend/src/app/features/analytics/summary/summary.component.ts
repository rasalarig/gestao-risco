import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import { SummaryStats } from '../../../core/models/interfaces';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="summary-page">
      <h2 class="summary-title">Resumos</h2>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (!loading && stats) {
        <!-- Top section: Flow + KPIs -->
        <div class="top-section">
          <!-- Flow Diagram -->
          <div class="flow-diagram-card">
            <h3 class="section-title">Fluxo do Pipeline</h3>
            <div class="flow-container">
              <svg viewBox="0 0 720 160" class="flow-svg" xmlns="http://www.w3.org/2000/svg">
                <!-- Riscos box -->
                <rect x="10" y="30" width="180" height="100" rx="12" fill="#00338D" />
                <text x="100" y="70" text-anchor="middle" fill="white" font-size="14" font-weight="600">Riscos</text>
                <text x="100" y="100" text-anchor="middle" fill="white" font-size="28" font-weight="700">{{ stats.pipeline_flow.risks_total }}</text>
                <text x="100" y="120" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">{{ stats.pipeline_flow.risks_with_assessments }} avaliados</text>

                <!-- Arrow 1 -->
                <polygon points="205,80 230,65 230,75 255,75 255,85 230,85 230,95" fill="#005EB8" />

                <!-- Controles box -->
                <rect x="270" y="30" width="180" height="100" rx="12" fill="#00A3A1" />
                <text x="360" y="70" text-anchor="middle" fill="white" font-size="14" font-weight="600">Controles</text>
                <text x="360" y="100" text-anchor="middle" fill="white" font-size="28" font-weight="700">{{ stats.pipeline_flow.controls_total }}</text>
                <text x="360" y="120" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">{{ stats.controls_with_action_plans }} com planos</text>

                <!-- Arrow 2 -->
                <polygon points="465,80 490,65 490,75 515,75 515,85 490,85 490,95" fill="#005EB8" />

                <!-- Planos de Acao box -->
                <rect x="530" y="30" width="180" height="100" rx="12" fill="#FFA300" />
                <text x="620" y="70" text-anchor="middle" fill="white" font-size="14" font-weight="600">Planos de Acao</text>
                <text x="620" y="100" text-anchor="middle" fill="white" font-size="28" font-weight="700">{{ stats.pipeline_flow.action_plans_total }}</text>
                <text x="620" y="120" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="11">{{ stats.action_plans_completed }} concluidos</text>
              </svg>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="kpi-column">
            <div class="kpi-summary-card kpi-green">
              <div class="kpi-value">{{ stats.total_controls }}</div>
              <div class="kpi-desc">Total Controles</div>
            </div>
            <div class="kpi-summary-card kpi-orange">
              <div class="kpi-value">{{ stats.total_action_plans }}</div>
              <div class="kpi-desc">Total Planos de Acao</div>
            </div>
            <div class="kpi-summary-card kpi-red">
              <div class="kpi-value">{{ stats.risks_without_controls }}</div>
              <div class="kpi-desc">Riscos sem Controle</div>
            </div>
            <div class="kpi-summary-card kpi-yellow">
              <div class="kpi-value">{{ stats.action_plans_pending }}</div>
              <div class="kpi-desc">Itens Pendentes</div>
            </div>
          </div>
        </div>

        <!-- Risks by Criticality - Horizontal Bar -->
        <mat-card class="criticality-card">
          <h3 class="section-title">Riscos por Criticidade</h3>
          <div class="bar-chart">
            @for (item of stats.risks_by_criticality; track item.level) {
              <div class="bar-row">
                <div class="bar-label">{{ item.level }}</div>
                <div class="bar-track">
                  <div
                    class="bar-fill"
                    [style.width.%]="getBarWidth(item.count)"
                    [style.background-color]="getCriticalityColor(item.level)"
                  ></div>
                </div>
                <div class="bar-count">{{ item.count }}</div>
              </div>
            }
          </div>
        </mat-card>

        <!-- Split View -->
        <div class="split-section">
          <mat-card class="split-card">
            <h3 class="section-title">Riscos e Controles - Estrategicos</h3>
            <div class="split-stats">
              <div class="split-stat-item">
                <span class="split-number blue">{{ stats.risks_with_controls }}</span>
                <span class="split-label">Riscos com Controles</span>
              </div>
              <div class="split-stat-item">
                <span class="split-number green">{{ stats.controls_with_action_plans }}</span>
                <span class="split-label">Controles com Planos</span>
              </div>
              <div class="split-stat-item">
                <span class="split-number orange">{{ stats.action_plans_in_progress }}</span>
                <span class="split-label">Planos em Andamento</span>
              </div>
            </div>
          </mat-card>

          <mat-card class="split-card">
            <h3 class="section-title">Riscos e Controles - Operacionais</h3>
            <div class="split-stats">
              <div class="split-stat-item">
                <span class="split-number red">{{ stats.risks_without_controls }}</span>
                <span class="split-label">Riscos sem Controles</span>
              </div>
              <div class="split-stat-item">
                <span class="split-number gray">{{ stats.controls_without_action_plans }}</span>
                <span class="split-label">Controles sem Planos</span>
              </div>
              <div class="split-stat-item">
                <span class="split-number green">{{ stats.action_plans_completed }}</span>
                <span class="split-label">Planos Concluidos</span>
              </div>
            </div>
          </mat-card>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .summary-page {
        padding: 0;
      }

      .summary-title {
        font-size: 22px;
        font-weight: 600;
        color: #00338d;
        margin: 0 0 24px 0;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .section-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px 0;
      }

      /* Top section: flow + KPIs */
      .top-section {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 24px;
        margin-bottom: 24px;
      }

      .flow-diagram-card {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }

      .flow-container {
        width: 100%;
        overflow-x: auto;
      }

      .flow-svg {
        width: 100%;
        max-width: 720px;
        height: auto;
      }

      /* KPI Column */
      .kpi-column {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .kpi-summary-card {
        border-radius: 12px;
        padding: 16px 20px;
        text-align: center;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        transition: transform 0.2s ease;
      }

      .kpi-summary-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      }

      .kpi-green {
        background: linear-gradient(135deg, #00A3A1 0%, #00857F 100%);
        color: white;
      }

      .kpi-orange {
        background: linear-gradient(135deg, #FFA300 0%, #E08E00 100%);
        color: white;
      }

      .kpi-red {
        background: linear-gradient(135deg, #BC204B 0%, #9A1A3D 100%);
        color: white;
      }

      .kpi-yellow {
        background: linear-gradient(135deg, #FFD54F 0%, #FFC107 100%);
        color: #333;
      }

      .kpi-value {
        font-size: 32px;
        font-weight: 700;
        line-height: 1.2;
      }

      .kpi-desc {
        font-size: 13px;
        font-weight: 500;
        opacity: 0.9;
      }

      /* Criticality Bar Chart */
      .criticality-card {
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        margin-bottom: 24px;
      }

      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .bar-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .bar-label {
        width: 90px;
        font-size: 14px;
        font-weight: 500;
        color: #444;
        text-align: right;
      }

      .bar-track {
        flex: 1;
        height: 28px;
        background: #f0f0f0;
        border-radius: 6px;
        overflow: hidden;
      }

      .bar-fill {
        height: 100%;
        border-radius: 6px;
        transition: width 0.6s ease;
        min-width: 2px;
      }

      .bar-count {
        width: 40px;
        font-size: 16px;
        font-weight: 700;
        color: #333;
        text-align: right;
      }

      /* Split Section */
      .split-section {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 24px;
        margin-bottom: 24px;
      }

      .split-card {
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }

      .split-stats {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .split-stat-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        background: #f8f9fc;
        border-radius: 8px;
      }

      .split-number {
        font-size: 28px;
        font-weight: 700;
        min-width: 50px;
        text-align: center;
      }

      .split-number.blue {
        color: #00338d;
      }
      .split-number.green {
        color: #00a3a1;
      }
      .split-number.orange {
        color: #ffa300;
      }
      .split-number.red {
        color: #bc204b;
      }
      .split-number.gray {
        color: #666;
      }

      .split-label {
        font-size: 14px;
        color: #555;
        font-weight: 500;
      }

      /* Responsive */
      @media (max-width: 1100px) {
        .top-section {
          grid-template-columns: 1fr;
        }
        .kpi-column {
          flex-direction: row;
          flex-wrap: wrap;
        }
        .kpi-summary-card {
          flex: 1;
          min-width: 140px;
        }
      }

      @media (max-width: 768px) {
        .split-section {
          grid-template-columns: 1fr;
        }
        .kpi-column {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SummaryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  stats: SummaryStats | null = null;
  private maxCriticalityCount = 1;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getBarWidth(count: number): number {
    if (this.maxCriticalityCount === 0) return 0;
    return Math.max(2, (count / this.maxCriticalityCount) * 100);
  }

  getCriticalityColor(level: string): string {
    const colors: Record<string, string> = {
      Critico: '#BC204B',
      Alto: '#FFA300',
      Moderado: '#FFD54F',
      Baixo: '#00A3A1',
    };
    return colors[level] ?? '#999';
  }

  private loadSummary(): void {
    this.loading = true;
    this.apiService
      .getSummaryStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.maxCriticalityCount = Math.max(
            1,
            ...data.risks_by_criticality.map((c) => c.count)
          );
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }
}
