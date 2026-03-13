import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../core/services/api.service';
import { DashboardStats } from '../../core/models/interfaces';
import { RiskMatrixComponent } from './risk-matrix/risk-matrix.component';
import { DrillTreeComponent } from './drill-tree/drill-tree.component';
import { DrillWebComponent } from './drill-web/drill-web.component';
import { SummaryComponent } from './summary/summary.component';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    BaseChartDirective,
    RiskMatrixComponent,
    DrillTreeComponent,
    DrillWebComponent,
    SummaryComponent,
  ],
  template: `
    <div class="analytics-page">
      <!-- Navigation Tabs - Pill style -->
      <div class="analytics-top">
        <h2 class="analytics-title">
          <mat-icon class="title-icon">analytics</mat-icon>
          Painel Anal\u00edtico
        </h2>
        <div class="tab-pills">
          @for (tab of tabs; track tab.key) {
            <button
              class="pill"
              [class.active]="activeTab === tab.key"
              (click)="activeTab = tab.key"
            >
              <mat-icon class="pill-icon">{{ tab.icon }}</mat-icon>
              {{ tab.label }}
            </button>
          }
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="filter-bar">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Empresa</mat-label>
          <mat-select [(value)]="selectedEmpresa">
            <mat-option value="">Todas</mat-option>
            <mat-option value="empresa-demo">Empresa Demonstracao</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Per\u00edodo</mat-label>
          <mat-select [(value)]="selectedPeriodo">
            <mat-option value="2026">2026</mat-option>
            <mat-option value="2025">2025</mat-option>
            <mat-option value="2024">2024</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Fator de Risco</mat-label>
          <mat-select [(value)]="selectedFatorRisco">
            <mat-option value="">Todos</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Controle</mat-label>
          <mat-select [(value)]="selectedControle">
            <mat-option value="">Todos</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-raised-button color="primary" class="filter-btn" (click)="applyFilters()">
          <mat-icon>filter_list</mat-icon>
          Filtrar
        </button>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (!loading && activeTab === 'dashboard') {
        <!-- KPI Cards Row -->
        <div class="kpi-row">
          <div class="kpi-card-modern">
            <div class="kpi-icon-box kpi-box-blue">
              <mat-icon>report_problem</mat-icon>
            </div>
            <div class="kpi-data">
              <div class="kpi-number">{{ stats?.total_riscos ?? 0 }}</div>
              <div class="kpi-label">Total de Riscos</div>
            </div>
          </div>
          <div class="kpi-card-modern">
            <div class="kpi-icon-box kpi-box-teal">
              <mat-icon>verified_user</mat-icon>
            </div>
            <div class="kpi-data">
              <div class="kpi-number">{{ stats?.total_controles ?? 0 }}</div>
              <div class="kpi-label">Total de Controles</div>
            </div>
          </div>
          <div class="kpi-card-modern">
            <div class="kpi-icon-box kpi-box-orange">
              <mat-icon>assessment</mat-icon>
            </div>
            <div class="kpi-data">
              <div class="kpi-number">{{ stats?.total_avaliacoes ?? 0 }}</div>
              <div class="kpi-label">Total de Avalia\u00e7\u00f5es</div>
            </div>
          </div>
          <div class="kpi-card-modern">
            <div class="kpi-icon-box kpi-box-red">
              <mat-icon>assignment</mat-icon>
            </div>
            <div class="kpi-data">
              <div class="kpi-number">{{ stats?.total_planos_acao ?? 0 }}</div>
              <div class="kpi-label">Planos de A\u00e7\u00e3o</div>
            </div>
          </div>
        </div>

        <!-- Charts Row 1 -->
        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3>Riscos por Categoria</h3>
            </div>
            <div class="chart-body">
              <div class="chart-container">
                <canvas
                  baseChart
                  [data]="risksByCategoryData"
                  [options]="horizontalBarOptions"
                  type="bar"
                ></canvas>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3>Riscos por N\u00edvel de Severidade</h3>
            </div>
            <div class="chart-body">
              <div class="chart-container">
                <canvas
                  baseChart
                  [data]="risksBySeverityData"
                  [options]="verticalBarOptions"
                  type="bar"
                ></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row 2 -->
        <div class="charts-row">
          <div class="chart-card">
            <div class="chart-header">
              <h3>Planos de A\u00e7\u00e3o por Status</h3>
            </div>
            <div class="chart-body">
              <div class="chart-container chart-donut">
                <canvas
                  baseChart
                  [data]="actionPlansByStatusData"
                  [options]="donutOptions"
                  type="doughnut"
                ></canvas>
              </div>
            </div>
          </div>

          <div class="chart-card">
            <div class="chart-header">
              <h3>Controles por Efetividade</h3>
            </div>
            <div class="chart-body">
              <div class="chart-container chart-donut">
                <canvas
                  baseChart
                  [data]="controlsByEffectivenessData"
                  [options]="donutOptions"
                  type="doughnut"
                ></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Matrix Summary Section -->
        <div class="matrix-summary-card">
          <div class="matrix-header">
            <h3>Matriz de Riscos e Controles</h3>
          </div>
          <div class="matrix-summary-grid">
            <div class="matrix-summary-item">
              <div class="matrix-number">{{ stats?.total_riscos ?? 0 }}</div>
              <div class="matrix-label">Riscos Cadastrados</div>
            </div>
            <div class="matrix-summary-item">
              <div class="matrix-number">{{ stats?.total_controles ?? 0 }}</div>
              <div class="matrix-label">Controles Vinculados</div>
            </div>
            <div class="matrix-summary-item">
              <div class="matrix-number">{{ inherentCount }}</div>
              <div class="matrix-label">Avalia\u00e7\u00f5es Inerentes</div>
            </div>
            <div class="matrix-summary-item">
              <div class="matrix-number">{{ residualCount }}</div>
              <div class="matrix-label">Avalia\u00e7\u00f5es Residuais</div>
            </div>
          </div>
        </div>
      }

      @if (!loading && activeTab === 'matriz') {
        <app-risk-matrix></app-risk-matrix>
      }

      @if (!loading && activeTab === 'drill-tree') {
        <app-drill-tree></app-drill-tree>
      }

      @if (!loading && activeTab === 'drill-web') {
        <app-drill-web></app-drill-web>
      }

      @if (!loading && activeTab === 'resumos') {
        <app-summary></app-summary>
      }

      @if (!loading && activeTab !== 'dashboard' && activeTab !== 'matriz' && activeTab !== 'drill-tree' && activeTab !== 'drill-web' && activeTab !== 'resumos') {
        <div class="placeholder-card">
          <div class="placeholder">
            <mat-icon>construction</mat-icon>
            <p>{{ getTabLabel(activeTab) }} em desenvolvimento</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .analytics-page {
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 0 32px;
      }

      /* Top area */
      .analytics-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 20px;
        flex-wrap: wrap;
        gap: 16px;
      }

      .analytics-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text-primary, #1a1a2e);
        margin: 0;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .title-icon {
        color: var(--grc-primary, #00338d);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      /* Pill tabs */
      .tab-pills {
        display: flex;
        gap: 6px;
        background: white;
        padding: 4px;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.06);
        border: 1px solid rgba(0,0,0,0.04);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: none;
        border: none;
        color: var(--text-secondary, #64748b);
        padding: 8px 16px;
        font-size: 13px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        border-radius: 8px;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .pill:hover {
        background: #f1f5f9;
        color: var(--text-primary, #1a1a2e);
      }

      .pill.active {
        background: var(--grc-primary, #00338d);
        color: white;
        box-shadow: 0 2px 8px rgba(0, 51, 141, 0.25);
      }

      .pill-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Filter Bar */
      .filter-bar {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-bottom: 24px;
        padding: 14px 18px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
      }

      .filter-field { width: 170px; }

      :host ::ng-deep .filter-field .mat-mdc-form-field-subscript-wrapper { display: none; }

      .filter-btn {
        height: 56px;
        min-width: 110px;
        border-radius: 8px !important;
        font-weight: 600 !important;
        text-transform: none !important;
      }

      :host ::ng-deep .filter-btn .mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* Loading */
      .loading-container {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      /* KPI Cards */
      .kpi-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        margin-bottom: 24px;
      }

      .kpi-card-modern {
        background: white;
        border-radius: 12px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 16px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
        transition: all 0.2s;
      }

      .kpi-card-modern:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .kpi-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .kpi-icon-box mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: white;
      }

      .kpi-box-blue { background: linear-gradient(135deg, #00338d, #005eb8); }
      .kpi-box-teal { background: linear-gradient(135deg, #0e7490, #0891b2); }
      .kpi-box-orange { background: linear-gradient(135deg, #d97706, #f59e0b); }
      .kpi-box-red { background: linear-gradient(135deg, #dc2626, #ef4444); }

      .kpi-data { display: flex; flex-direction: column; }

      .kpi-number {
        font-size: 1.75rem;
        font-weight: 800;
        line-height: 1.1;
        color: var(--text-primary, #1a1a2e);
      }

      .kpi-label {
        font-size: 12px;
        color: var(--text-secondary, #64748b);
        font-weight: 500;
        margin-top: 2px;
      }

      /* Charts */
      .charts-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
      }

      .chart-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
        overflow: hidden;
      }

      .chart-header {
        padding: 16px 20px 0;
      }

      .chart-header h3 {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary, #1a1a2e);
        margin: 0;
      }

      .chart-body {
        padding: 8px 16px 16px;
      }

      .chart-container {
        height: 300px;
        position: relative;
      }

      .chart-donut {
        display: flex;
        justify-content: center;
        align-items: center;
      }

      /* Matrix Summary */
      .matrix-summary-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
        margin-bottom: 24px;
        overflow: hidden;
      }

      .matrix-header {
        padding: 16px 20px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.04);
      }

      .matrix-header h3 {
        font-size: 16px;
        font-weight: 700;
        color: var(--grc-primary, #00338d);
        margin: 0;
      }

      .matrix-summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px;
        padding: 20px;
      }

      .matrix-summary-item {
        text-align: center;
        padding: 16px;
        background: var(--bg-primary, #f0f2f5);
        border-radius: 10px;
      }

      .matrix-number {
        font-size: 1.75rem;
        font-weight: 800;
        color: var(--grc-primary, #00338d);
        margin-bottom: 4px;
      }

      .matrix-label {
        font-size: 12px;
        color: var(--text-secondary, #64748b);
        font-weight: 500;
      }

      /* Placeholder */
      .placeholder-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        margin-top: 24px;
      }

      .placeholder {
        text-align: center;
        padding: 64px 24px;
        color: var(--text-muted, #94a3b8);
      }

      .placeholder mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin-bottom: 16px;
      }

      .placeholder p { font-size: 16px; }

      /* Responsive */
      @media (max-width: 1100px) {
        .kpi-row { grid-template-columns: repeat(2, 1fr); }
        .charts-row { grid-template-columns: 1fr; }
        .matrix-summary-grid { grid-template-columns: repeat(2, 1fr); }
        .tab-pills { flex-wrap: wrap; }
      }

      @media (max-width: 600px) {
        .kpi-row { grid-template-columns: 1fr; }
        .filter-bar { flex-direction: column; }
        .filter-field { width: 100%; }
        .matrix-summary-grid { grid-template-columns: 1fr; }
        .analytics-top { flex-direction: column; align-items: flex-start; }
      }
    `,
  ],
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  activeTab = 'dashboard';
  loading = true;
  stats: DashboardStats | null = null;

  tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { key: 'matriz', label: 'Matriz de Risco', icon: 'grid_on' },
    { key: 'drill-tree', label: 'Drill Tree', icon: 'account_tree' },
    { key: 'drill-web', label: 'Drill Web', icon: 'hub' },
    { key: 'resumos', label: 'Resumos', icon: 'summarize' },
  ];

  // Filters
  selectedEmpresa = '';
  selectedPeriodo = '2026';
  selectedFatorRisco = '';
  selectedControle = '';

  // Inherent / Residual counts
  inherentCount = 0;
  residualCount = 0;

  // Chart data
  risksByCategoryData: ChartData<'bar'> = { labels: [], datasets: [] };
  risksBySeverityData: ChartData<'bar'> = { labels: [], datasets: [] };
  actionPlansByStatusData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  controlsByEffectivenessData: ChartData<'doughnut'> = { labels: [], datasets: [] };

  // Chart options
  horizontalBarOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: {
        grid: { display: false },
      },
    },
  };

  verticalBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  donutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 16,
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
        },
      },
    },
  };

  // Color palette for charts
  private readonly categoryColors = [
    '#00338D', '#005EB8', '#0091DA', '#00A3A1',
    '#FFA300', '#BC204B', '#7C3AED', '#059669',
    '#D97706', '#DC2626', '#6366F1', '#10B981',
  ];

  private readonly severityColors: Record<string, string> = {
    Critico: '#DC2626',
    Alto: '#F59E0B',
    Moderado: '#3B82F6',
    Baixo: '#10B981',
  };

  private readonly statusColors: Record<string, string> = {
    pendente: '#F59E0B',
    em_andamento: '#3B82F6',
    concluido: '#10B981',
    cancelado: '#EF4444',
  };

  private readonly effectivenessColors: Record<string, string> = {
    efetivo: '#10B981',
    parcialmente_efetivo: '#F59E0B',
    inefetivo: '#EF4444',
  };

  private readonly statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Conclu\u00eddo',
    cancelado: 'Cancelado',
  };

  private readonly effectivenessLabels: Record<string, string> = {
    efetivo: 'Efetivo',
    parcialmente_efetivo: 'Parcialmente Efetivo',
    inefetivo: 'Inefetivo',
  };

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  applyFilters(): void {
    this.loadDashboard();
  }

  getTabLabel(tab: string): string {
    const found = this.tabs.find(t => t.key === tab);
    return found?.label ?? tab;
  }

  private loadDashboard(): void {
    this.loading = true;
    const params: { empresa_id?: string; category_id?: string } = {};

    this.apiService
      .getDashboardStats(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.stats = data;
          this.buildCharts(data);
          const total = data.total_avaliacoes;
          this.inherentCount = Math.ceil(total / 2);
          this.residualCount = total - this.inherentCount;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  private buildCharts(data: DashboardStats): void {
    // Risks by Category - horizontal bar
    const catLabels = (data.risks_by_category ?? []).map((r) => r.category_name);
    const catCounts = (data.risks_by_category ?? []).map((r) => r.count);
    this.risksByCategoryData = {
      labels: catLabels,
      datasets: [
        {
          data: catCounts,
          backgroundColor: catLabels.map(
            (_, i) => this.categoryColors[i % this.categoryColors.length]
          ),
          borderRadius: 6,
        },
      ],
    };

    // Risks by Severity - vertical bar
    const sevLabels = (data.risks_by_severity ?? []).map((r) => r.severity);
    const sevCounts = (data.risks_by_severity ?? []).map((r) => r.count);
    this.risksBySeverityData = {
      labels: sevLabels,
      datasets: [
        {
          data: sevCounts,
          backgroundColor: sevLabels.map(
            (s) => this.severityColors[s] ?? '#94a3b8'
          ),
          borderRadius: 6,
        },
      ],
    };

    // Action Plans by Status - donut
    const statusItems = data.action_plans_by_status ?? [];
    this.actionPlansByStatusData = {
      labels: statusItems.map((s) => this.statusLabels[s.status] ?? s.status),
      datasets: [
        {
          data: statusItems.map((s) => s.count),
          backgroundColor: statusItems.map(
            (s) => this.statusColors[s.status] ?? '#94a3b8'
          ),
        },
      ],
    };

    // Controls by Effectiveness - donut
    const effItems = data.controls_by_effectiveness ?? [];
    this.controlsByEffectivenessData = {
      labels: effItems.map(
        (e) => this.effectivenessLabels[e.effectiveness] ?? e.effectiveness
      ),
      datasets: [
        {
          data: effItems.map((e) => e.count),
          backgroundColor: effItems.map(
            (e) => this.effectivenessColors[e.effectiveness] ?? '#94a3b8'
          ),
        },
      ],
    };
  }
}
