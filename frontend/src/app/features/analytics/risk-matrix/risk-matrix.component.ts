import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { ApiService } from '../../../core/services/api.service';
import {
  MatrixCell,
  MatrixCellRisk,
  RiskMatrixResponse,
} from '../../../core/models/interfaces';

interface CellData {
  impact: number;
  probability: number;
  count: number;
  risks: MatrixCellRisk[];
  color: string;
  level: string;
}

@Component({
  selector: 'app-risk-matrix',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonToggleModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="risk-matrix-container">
      <!-- Header -->
      <div class="matrix-header">
        <h2>Matriz de Risco</h2>
        <p class="matrix-subtitle">
          Classificacao dos Riscos na Matriz Impacto x Probabilidade
        </p>
      </div>

      <!-- Toggle -->
      <div class="toggle-row">
        <mat-button-toggle-group
          [(ngModel)]="viewMode"
          (change)="onViewModeChange()"
        >
          <mat-button-toggle value="both">Ambas</mat-button-toggle>
          <mat-button-toggle value="inherent"
            >Avaliacao Inerente</mat-button-toggle
          >
          <mat-button-toggle value="residual"
            >Avaliacao Residual</mat-button-toggle
          >
        </mat-button-toggle-group>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      }

      @if (!loading) {
        <div
          class="matrices-wrapper"
          [class.single-view]="viewMode !== 'both'"
        >
          @if (viewMode === 'both' || viewMode === 'inherent') {
            <div class="matrix-section">
              <h3 class="matrix-title">Avaliacao Inerente</h3>
              <div class="heatmap-wrapper">
                <div class="y-axis-label">Probabilidade</div>
                <div class="grid-area">
                  <!-- Y-axis labels -->
                  <div class="y-labels">
                    @for (label of probLabels; track label.value) {
                      <div class="y-label">
                        <span class="label-number">{{ label.value }}</span>
                        <span class="label-text">{{ label.text }}</span>
                      </div>
                    }
                  </div>
                  <!-- Grid -->
                  <div class="heatmap-grid">
                    @for (row of probOrder; track row) {
                      @for (col of impactOrder; track col) {
                        <div
                          class="heatmap-cell"
                          [style.background-color]="
                            getCell(inherentGrid, col, row).color
                          "
                          (click)="showCellDetails($event, inherentGrid, col, row)"
                        >
                          <span class="cell-count">{{
                            getCell(inherentGrid, col, row).count || ''
                          }}</span>
                        </div>
                      }
                    }
                  </div>
                  <!-- X-axis labels -->
                  <div class="x-spacer"></div>
                  <div class="x-labels">
                    @for (label of impactLabels; track label.value) {
                      <div class="x-label">
                        <span class="label-number">{{ label.value }}</span>
                        <span class="label-text">{{ label.text }}</span>
                      </div>
                    }
                  </div>
                </div>
                <div class="x-axis-label">Impacto</div>
              </div>
            </div>
          }

          @if (viewMode === 'both' || viewMode === 'residual') {
            <div class="matrix-section">
              <h3 class="matrix-title">Avaliacao Residual</h3>
              <div class="heatmap-wrapper">
                <div class="y-axis-label">Probabilidade</div>
                <div class="grid-area">
                  <!-- Y-axis labels -->
                  <div class="y-labels">
                    @for (label of probLabels; track label.value) {
                      <div class="y-label">
                        <span class="label-number">{{ label.value }}</span>
                        <span class="label-text">{{ label.text }}</span>
                      </div>
                    }
                  </div>
                  <!-- Grid -->
                  <div class="heatmap-grid">
                    @for (row of probOrder; track row) {
                      @for (col of impactOrder; track col) {
                        <div
                          class="heatmap-cell"
                          [style.background-color]="
                            getCell(residualGrid, col, row).color
                          "
                          (click)="showCellDetails($event, residualGrid, col, row)"
                        >
                          <span class="cell-count">{{
                            getCell(residualGrid, col, row).count || ''
                          }}</span>
                        </div>
                      }
                    }
                  </div>
                  <!-- X-axis labels -->
                  <div class="x-spacer"></div>
                  <div class="x-labels">
                    @for (label of impactLabels; track label.value) {
                      <div class="x-label">
                        <span class="label-number">{{ label.value }}</span>
                        <span class="label-text">{{ label.text }}</span>
                      </div>
                    }
                  </div>
                </div>
                <div class="x-axis-label">Impacto</div>
              </div>
            </div>
          }
        </div>

        <!-- Legend -->
        <div class="legend-row">
          <div class="legend-item">
            <span class="legend-color" style="background-color: #BC204B"></span>
            <span class="legend-text">Critico (20-25)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #FF6600"></span>
            <span class="legend-text">Alto (12-19)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #FFD100"></span>
            <span class="legend-text">Moderado (6-11)</span>
          </div>
          <div class="legend-item">
            <span class="legend-color" style="background-color: #00A3A1"></span>
            <span class="legend-text">Baixo (1-5)</span>
          </div>
        </div>

        <!-- Popover -->
        @if (popoverVisible) {
          <div
            class="cell-popover"
            [style.left.px]="popoverX"
            [style.top.px]="popoverY"
          >
            <div class="popover-header">
              Impacto {{ popoverCell?.impact }}, Probabilidade
              {{ popoverCell?.probability }}
              <span class="popover-level">({{ popoverCell?.level }})</span>
              <button class="popover-close" (click)="closePopover()">x</button>
            </div>
            @if (popoverCell && popoverCell.risks.length > 0) {
              <ul class="popover-list">
                @for (risk of popoverCell.risks; track risk.id) {
                  <li>{{ risk.name }}</li>
                }
              </ul>
            } @else {
              <p class="popover-empty">Nenhum risco nesta celula</p>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .risk-matrix-container {
        position: relative;
      }

      .matrix-header {
        margin-bottom: 16px;
      }

      .matrix-header h2 {
        font-size: 20px;
        font-weight: 600;
        color: #00338d;
        margin: 0 0 4px;
      }

      .matrix-subtitle {
        font-size: 14px;
        color: #666;
        margin: 0;
      }

      .toggle-row {
        margin-bottom: 24px;
      }

      .loading-container {
        display: flex;
        justify-content: center;
        padding: 64px 0;
      }

      .matrices-wrapper {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
        margin-bottom: 24px;
      }

      .matrices-wrapper.single-view {
        grid-template-columns: 1fr;
        max-width: 600px;
      }

      .matrix-section {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      }

      .matrix-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0 0 16px;
        text-align: center;
      }

      .heatmap-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .y-axis-label {
        font-size: 12px;
        font-weight: 600;
        color: #00338d;
        writing-mode: horizontal-tb;
        margin-bottom: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .grid-area {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: 1fr auto;
        gap: 0;
      }

      .y-labels {
        display: flex;
        flex-direction: column;
        justify-content: stretch;
        padding-right: 8px;
      }

      .y-label {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        padding: 2px 0;
        min-height: 52px;
      }

      .y-label .label-number {
        font-weight: 700;
        font-size: 13px;
        color: #333;
      }

      .y-label .label-text {
        font-size: 11px;
        color: #666;
        max-width: 70px;
        text-align: right;
      }

      .heatmap-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        grid-template-rows: repeat(5, 1fr);
        gap: 2px;
        min-width: 260px;
        min-height: 260px;
      }

      .heatmap-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        min-width: 50px;
        min-height: 50px;
      }

      .heatmap-cell:hover {
        transform: scale(1.08);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        z-index: 2;
      }

      .cell-count {
        font-size: 18px;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      }

      .x-spacer {
        /* empty cell to align under y-labels */
      }

      .x-labels {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 2px;
        padding-top: 8px;
      }

      .x-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
      }

      .x-label .label-number {
        font-weight: 700;
        font-size: 13px;
        color: #333;
      }

      .x-label .label-text {
        font-size: 10px;
        color: #666;
        text-align: center;
      }

      .x-axis-label {
        font-size: 12px;
        font-weight: 600;
        color: #00338d;
        margin-top: 4px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      /* Legend */
      .legend-row {
        display: flex;
        gap: 24px;
        justify-content: center;
        flex-wrap: wrap;
        padding: 16px 0;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .legend-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        display: inline-block;
      }

      .legend-text {
        font-size: 13px;
        font-weight: 500;
        color: #333;
      }

      /* Popover */
      .cell-popover {
        position: fixed;
        background: white;
        border-radius: 8px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        padding: 12px 16px;
        z-index: 1000;
        min-width: 200px;
        max-width: 320px;
        border: 1px solid #e0e0e0;
      }

      .popover-header {
        font-weight: 600;
        font-size: 13px;
        color: #00338d;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .popover-level {
        font-weight: 400;
        color: #666;
      }

      .popover-close {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #999;
        line-height: 1;
        padding: 0 4px;
      }

      .popover-close:hover {
        color: #333;
      }

      .popover-list {
        margin: 0;
        padding: 0 0 0 16px;
        font-size: 13px;
        color: #333;
        max-height: 200px;
        overflow-y: auto;
      }

      .popover-list li {
        padding: 2px 0;
      }

      .popover-empty {
        font-size: 13px;
        color: #999;
        margin: 0;
        font-style: italic;
      }

      @media (max-width: 900px) {
        .matrices-wrapper {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class RiskMatrixComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loading = true;
  viewMode: 'both' | 'inherent' | 'residual' = 'both';

  // Grid data keyed as "impact-probability"
  inherentGrid: Map<string, CellData> = new Map();
  residualGrid: Map<string, CellData> = new Map();

  // Axis orders: probability top-to-bottom = 5,4,3,2,1
  probOrder = [5, 4, 3, 2, 1];
  impactOrder = [1, 2, 3, 4, 5];

  probLabels = [
    { value: 5, text: 'Muito Alta' },
    { value: 4, text: 'Alta' },
    { value: 3, text: 'Moderada' },
    { value: 2, text: 'Baixa' },
    { value: 1, text: 'Muito Baixa' },
  ];

  impactLabels = [
    { value: 1, text: 'Muito Baixo' },
    { value: 2, text: 'Baixo' },
    { value: 3, text: 'Moderado' },
    { value: 4, text: 'Alto' },
    { value: 5, text: 'Muito Alto' },
  ];

  // Color map for risk matrix: colorMap[probability][impact]
  private colorMap: Record<number, Record<number, string>> = {
    5: { 1: '#00A3A1', 2: '#FFD100', 3: '#FF6600', 4: '#BC204B', 5: '#BC204B' },
    4: { 1: '#00A3A1', 2: '#FFD100', 3: '#FF6600', 4: '#BC204B', 5: '#BC204B' },
    3: { 1: '#00A3A1', 2: '#00A3A1', 3: '#FFD100', 4: '#FF6600', 5: '#FF6600' },
    2: { 1: '#00A3A1', 2: '#00A3A1', 3: '#FFD100', 4: '#FFD100', 5: '#FF6600' },
    1: { 1: '#00A3A1', 2: '#00A3A1', 3: '#00A3A1', 4: '#FFD100', 5: '#FFD100' },
  };

  private levelMap: Record<string, string> = {
    '#BC204B': 'Critico',
    '#FF6600': 'Alto',
    '#FFD100': 'Moderado',
    '#00A3A1': 'Baixo',
  };

  // Popover state
  popoverVisible = false;
  popoverX = 0;
  popoverY = 0;
  popoverCell: CellData | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadMatrix();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewModeChange(): void {
    this.closePopover();
  }

  loadMatrix(): void {
    this.loading = true;
    this.apiService
      .getRiskMatrix()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: RiskMatrixResponse) => {
          this.inherentGrid = this.buildGrid(data.inherent);
          this.residualGrid = this.buildGrid(data.residual);
          this.loading = false;
        },
        error: () => {
          // Build empty grids on error
          this.inherentGrid = this.buildGrid([]);
          this.residualGrid = this.buildGrid([]);
          this.loading = false;
        },
      });
  }

  getCell(grid: Map<string, CellData>, impact: number, probability: number): CellData {
    return (
      grid.get(`${impact}-${probability}`) ?? {
        impact,
        probability,
        count: 0,
        risks: [],
        color: this.getCellColor(impact, probability),
        level: this.levelMap[this.getCellColor(impact, probability)] ?? '',
      }
    );
  }

  showCellDetails(
    event: MouseEvent,
    grid: Map<string, CellData>,
    impact: number,
    probability: number
  ): void {
    const cell = this.getCell(grid, impact, probability);
    this.popoverCell = cell;
    this.popoverX = event.clientX + 10;
    this.popoverY = event.clientY + 10;

    // Make sure popover doesn't go off-screen
    const maxX = window.innerWidth - 340;
    const maxY = window.innerHeight - 250;
    if (this.popoverX > maxX) this.popoverX = maxX;
    if (this.popoverY > maxY) this.popoverY = event.clientY - 200;

    this.popoverVisible = true;
  }

  closePopover(): void {
    this.popoverVisible = false;
    this.popoverCell = null;
  }

  private buildGrid(cells: MatrixCell[]): Map<string, CellData> {
    const grid = new Map<string, CellData>();

    // Initialize all 25 cells
    for (let imp = 1; imp <= 5; imp++) {
      for (let prob = 1; prob <= 5; prob++) {
        const color = this.getCellColor(imp, prob);
        grid.set(`${imp}-${prob}`, {
          impact: imp,
          probability: prob,
          count: 0,
          risks: [],
          color,
          level: this.levelMap[color] ?? '',
        });
      }
    }

    // Fill in data from API
    for (const cell of cells) {
      const key = `${cell.impact}-${cell.probability}`;
      const existing = grid.get(key);
      if (existing) {
        existing.count = cell.count;
        existing.risks = cell.risks;
      }
    }

    return grid;
  }

  private getCellColor(impact: number, probability: number): string {
    return this.colorMap[probability]?.[impact] ?? '#00A3A1';
  }
}
