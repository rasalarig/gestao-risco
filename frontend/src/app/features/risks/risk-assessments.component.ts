import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApiService } from '../../core/services/api.service';
import {
  RiskAssessmentSummaryItem,
  RiskAssessmentSummaryResponse,
} from '../../core/models/interfaces';
import {
  AssessmentFormDialogComponent,
  AssessmentFormDialogData,
} from './assessment-form-dialog.component';

function severityColor(severity: string | null): string {
  switch (severity) {
    case 'Critico':
      return '#BC204B';
    case 'Alto':
      return '#FFA300';
    case 'Moderado':
      return '#FFD100';
    case 'Baixo':
      return '#00A3A1';
    default:
      return 'transparent';
  }
}

function severityTextColor(severity: string | null): string {
  if (severity === 'Moderado') return '#333';
  if (!severity) return '#999';
  return '#fff';
}

@Component({
  selector: 'app-risk-assessments',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
  ],
  template: `
    <div class="assessments-container">
      <div class="header">
        <h2 class="page-title">Avaliacoes de Risco</h2>
      </div>

      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando avaliacoes...</p>
        </div>
      } @else {
        <div class="table-container">
          <table
            mat-table
            [dataSource]="sortedItems"
            matSort
            (matSortChange)="onSort($event)"
            class="assessments-table"
          >
            <!-- Risco -->
            <ng-container matColumnDef="risk_name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Risco</th>
              <td mat-cell *matCellDef="let row">{{ row.risk_name }}</td>
            </ng-container>

            <!-- Categoria -->
            <ng-container matColumnDef="category_name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Categoria
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.category_name || '-' }}
              </td>
            </ng-container>

            <!-- Impacto Inerente -->
            <ng-container matColumnDef="inherent_impact">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Impacto Inerente
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.inherent_impact ?? '-' }}
              </td>
            </ng-container>

            <!-- Probabilidade Inerente -->
            <ng-container matColumnDef="inherent_probability">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Prob. Inerente
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.inherent_probability ?? '-' }}
              </td>
            </ng-container>

            <!-- Score Inerente -->
            <ng-container matColumnDef="inherent_score">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Score Inerente
              </th>
              <td mat-cell *matCellDef="let row">
                <span
                  class="severity-cell"
                  [style.background-color]="getSeverityColor(row.inherent_severity)"
                  [style.color]="getSeverityTextColor(row.inherent_severity)"
                >
                  {{ row.inherent_score != null ? row.inherent_score : '-' }}
                </span>
              </td>
            </ng-container>

            <!-- Impacto Residual -->
            <ng-container matColumnDef="residual_impact">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Impacto Residual
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.residual_impact ?? '-' }}
              </td>
            </ng-container>

            <!-- Probabilidade Residual -->
            <ng-container matColumnDef="residual_probability">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Prob. Residual
              </th>
              <td mat-cell *matCellDef="let row">
                {{ row.residual_probability ?? '-' }}
              </td>
            </ng-container>

            <!-- Score Residual -->
            <ng-container matColumnDef="residual_score">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                Score Residual
              </th>
              <td mat-cell *matCellDef="let row">
                <span
                  class="severity-cell"
                  [style.background-color]="getSeverityColor(row.residual_severity)"
                  [style.color]="getSeverityTextColor(row.residual_severity)"
                >
                  {{ row.residual_score != null ? row.residual_score : '-' }}
                </span>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Acoes</th>
              <td mat-cell *matCellDef="let row">
                <button
                  mat-icon-button
                  matTooltip="Adicionar avaliacao"
                  (click)="openAssessmentDialog(row)"
                >
                  <mat-icon>add_circle_outline</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
          </table>

          @if (items.length === 0) {
            <div class="empty-state">
              <mat-icon>info_outline</mat-icon>
              <p>Nenhuma avaliacao encontrada</p>
            </div>
          }
        </div>

        <!-- Summary Cards -->
        @if (severityCounts) {
          <div class="summary-section">
            <h3 class="summary-title">Resultado Quantitativo</h3>
            <div class="summary-cards">
              <div
                class="summary-card"
                [style.border-left-color]="'#BC204B'"
              >
                <div class="card-count">{{ severityCounts['Critico'] || 0 }}</div>
                <div class="card-label">Critico</div>
              </div>
              <div
                class="summary-card"
                [style.border-left-color]="'#FFA300'"
              >
                <div class="card-count">{{ severityCounts['Alto'] || 0 }}</div>
                <div class="card-label">Alto</div>
              </div>
              <div
                class="summary-card"
                [style.border-left-color]="'#FFD100'"
              >
                <div class="card-count">{{ severityCounts['Moderado'] || 0 }}</div>
                <div class="card-label">Moderado</div>
              </div>
              <div
                class="summary-card"
                [style.border-left-color]="'#00A3A1'"
              >
                <div class="card-count">{{ severityCounts['Baixo'] || 0 }}</div>
                <div class="card-label">Baixo</div>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .assessments-container {
        padding: 24px;
        height: calc(100vh - 64px - 48px);
        overflow-y: auto;
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .page-title {
        font-size: 22px;
        font-weight: 500;
        color: #333;
        margin: 0;
      }

      .table-container {
        border: 1px solid #e0e0e0;
        border-radius: 4px;
        overflow: hidden;
      }

      .assessments-table {
        width: 100%;
      }

      :host ::ng-deep .assessments-table .mat-mdc-header-row {
        background-color: #00338d;
      }

      :host ::ng-deep .assessments-table .mat-mdc-header-cell {
        color: white;
        font-weight: 600;
        font-size: 12px;
        border-bottom: none;
      }

      :host ::ng-deep .assessments-table .mat-mdc-cell {
        font-size: 13px;
        color: #333;
      }

      :host
        ::ng-deep
        .assessments-table
        .mat-sort-header-arrow {
        color: white;
      }

      .severity-cell {
        display: inline-block;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
        min-width: 36px;
        text-align: center;
      }

      .empty-state {
        text-align: center;
        padding: 48px 24px;
        color: #999;
      }

      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        margin-bottom: 8px;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 48px;
        color: #666;
        gap: 16px;
      }

      /* Summary */
      .summary-section {
        margin-top: 24px;
      }

      .summary-title {
        font-size: 16px;
        font-weight: 500;
        color: #333;
        margin-bottom: 12px;
      }

      .summary-cards {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }

      .summary-card {
        flex: 1;
        min-width: 140px;
        background: #fff;
        border: 1px solid #e0e0e0;
        border-left: 4px solid;
        border-radius: 4px;
        padding: 16px;
        text-align: center;
      }

      .card-count {
        font-size: 28px;
        font-weight: 700;
        color: #333;
      }

      .card-label {
        font-size: 13px;
        color: #666;
        margin-top: 4px;
      }
    `,
  ],
})
export class RiskAssessmentsComponent implements OnInit {
  displayedColumns = [
    'risk_name',
    'category_name',
    'inherent_impact',
    'inherent_probability',
    'inherent_score',
    'residual_impact',
    'residual_probability',
    'residual_score',
    'actions',
  ];

  items: RiskAssessmentSummaryItem[] = [];
  sortedItems: RiskAssessmentSummaryItem[] = [];
  severityCounts: { [key: string]: number } = {};
  loading = false;
  currentSort: Sort = { active: '', direction: '' };

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.api.getRiskAssessmentsSummary().subscribe({
      next: (response: RiskAssessmentSummaryResponse) => {
        this.items = response.items;
        this.severityCounts = response.severity_counts;
        this.applySorting();
        this.loading = false;
      },
      error: () => {
        this.items = [];
        this.sortedItems = [];
        this.severityCounts = {};
        this.loading = false;
      },
    });
  }

  getSeverityColor(severity: string | null): string {
    return severityColor(severity);
  }

  getSeverityTextColor(severity: string | null): string {
    return severityTextColor(severity);
  }

  onSort(sort: Sort): void {
    this.currentSort = sort;
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.currentSort.active || this.currentSort.direction === '') {
      this.sortedItems = [...this.items];
      return;
    }

    const data = [...this.items];
    const isAsc = this.currentSort.direction === 'asc';
    const col = this.currentSort.active as keyof RiskAssessmentSummaryItem;

    data.sort((a, b) => {
      const aVal = a[col];
      const bVal = b[col];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return isAsc ? -1 : 1;
      if (bVal == null) return isAsc ? 1 : -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * (isAsc ? 1 : -1);
      }
      return String(aVal).localeCompare(String(bVal)) * (isAsc ? 1 : -1);
    });

    this.sortedItems = data;
  }

  openAssessmentDialog(row: RiskAssessmentSummaryItem): void {
    const dialogData: AssessmentFormDialogData = {
      assessment: null,
      riskId: row.risk_id,
      riskName: row.risk_name,
    };

    const dialogRef = this.dialog.open(AssessmentFormDialogComponent, {
      width: '520px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.api
          .createRiskAssessment({
            risk_id: row.risk_id,
            type: result.type,
            impact: result.impact,
            probability: result.probability,
            notes: result.notes || undefined,
            assessed_by: result.assessed_by || undefined,
          })
          .subscribe({
            next: () => this.loadSummary(),
          });
      }
    });
  }
}
