import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import {
  ActionPlan,
  ActionPlanListResponse,
  ActionPlanSummary,
  Risk,
  Control,
} from '../../core/models/interfaces';
import {
  ActionPlanFormDialogComponent,
  ActionPlanFormDialogData,
} from './action-plan-form-dialog.component';

@Component({
  selector: 'app-action-plans',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="action-plans-container">
      <div class="content-area">
        <div class="content-header">
          <h2 class="page-title">
            <mat-icon class="title-icon">assignment</mat-icon>
            Planos de A\u00e7\u00e3o
          </h2>
          <div class="header-actions">
            <button
              mat-raised-button
              color="primary"
              class="new-btn"
              (click)="openFormDialog(null)"
            >
              <mat-icon>add</mat-icon>
              Novo Plano de A\u00e7\u00e3o
            </button>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card card-pendente">
            <div class="card-icon-area"><mat-icon>schedule</mat-icon></div>
            <div class="card-data">
              <div class="card-value">{{ summary.pendente }}</div>
              <div class="card-label">Pendente</div>
            </div>
          </div>
          <div class="summary-card card-andamento">
            <div class="card-icon-area"><mat-icon>autorenew</mat-icon></div>
            <div class="card-data">
              <div class="card-value">{{ summary.em_andamento }}</div>
              <div class="card-label">Em Andamento</div>
            </div>
          </div>
          <div class="summary-card card-concluido">
            <div class="card-icon-area"><mat-icon>check_circle</mat-icon></div>
            <div class="card-data">
              <div class="card-value">{{ summary.concluido }}</div>
              <div class="card-label">Conclu\u00eddo</div>
            </div>
          </div>
          <div class="summary-card card-cancelado">
            <div class="card-icon-area"><mat-icon>cancel</mat-icon></div>
            <div class="card-data">
              <div class="card-value">{{ summary.cancelado }}</div>
              <div class="card-label">Cancelado</div>
            </div>
          </div>
          <div class="summary-card card-total">
            <div class="card-icon-area"><mat-icon>inventory_2</mat-icon></div>
            <div class="card-data">
              <div class="card-value">{{ summary.total }}</div>
              <div class="card-label">Total</div>
            </div>
          </div>
        </div>

        <!-- Filters & Search -->
        <div class="filters-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix class="search-prefix-icon">search</mat-icon>
            <mat-label>Buscar planos...</mat-label>
            <input
              matInput
              [(ngModel)]="searchTerm"
              (keyup.enter)="onSearch()"
              placeholder="Buscar por t\u00edtulo, descri\u00e7\u00e3o ou respons\u00e1vel"
            />
            @if (searchTerm) {
              <button mat-icon-button matSuffix (click)="searchTerm = ''; onSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (selectionChange)="onFilterChange()">
              <mat-option value="">Todos</mat-option>
              <mat-option value="pendente">Pendente</mat-option>
              <mat-option value="em_andamento">Em Andamento</mat-option>
              <mat-option value="concluido">Conclu\u00eddo</mat-option>
              <mat-option value="cancelado">Cancelado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Prioridade</mat-label>
            <mat-select [(ngModel)]="filterPriority" (selectionChange)="onFilterChange()">
              <mat-option value="">Todas</mat-option>
              <mat-option value="alta">Alta</mat-option>
              <mat-option value="media">M\u00e9dia</mat-option>
              <mat-option value="baixa">Baixa</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Table -->
        @if (loading) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Carregando planos de a\u00e7\u00e3o...</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="actionPlans" class="plans-table">
              <!-- Titulo -->
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>T\u00edtulo</th>
                <td mat-cell *matCellDef="let plan">
                  <span class="title-text">{{ plan.title }}</span>
                </td>
              </ng-container>

              <!-- Responsavel -->
              <ng-container matColumnDef="responsible">
                <th mat-header-cell *matHeaderCellDef>Respons\u00e1vel</th>
                <td mat-cell *matCellDef="let plan">
                  {{ plan.responsible || '-' }}
                </td>
              </ng-container>

              <!-- Data Inicio -->
              <ng-container matColumnDef="start_date">
                <th mat-header-cell *matHeaderCellDef>In\u00edcio</th>
                <td mat-cell *matCellDef="let plan">
                  {{ plan.start_date ? formatDateDisplay(plan.start_date) : '-' }}
                </td>
              </ng-container>

              <!-- Data Limite -->
              <ng-container matColumnDef="due_date">
                <th mat-header-cell *matHeaderCellDef>Prazo</th>
                <td mat-cell *matCellDef="let plan">
                  <span [class.overdue]="isOverdue(plan)">
                    {{ plan.due_date ? formatDateDisplay(plan.due_date) : '-' }}
                    @if (isOverdue(plan)) {
                      <mat-icon class="overdue-icon">warning</mat-icon>
                    }
                  </span>
                </td>
              </ng-container>

              <!-- Status -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let plan">
                  <span
                    class="status-chip"
                    [class.status-pendente]="plan.status === 'pendente'"
                    [class.status-andamento]="plan.status === 'em_andamento'"
                    [class.status-concluido]="plan.status === 'concluido'"
                    [class.status-cancelado]="plan.status === 'cancelado'"
                  >
                    {{ getStatusLabel(plan.status) }}
                  </span>
                </td>
              </ng-container>

              <!-- Prioridade -->
              <ng-container matColumnDef="priority">
                <th mat-header-cell *matHeaderCellDef>Prioridade</th>
                <td mat-cell *matCellDef="let plan">
                  <span
                    class="priority-badge"
                    [class.priority-alta]="plan.priority === 'alta'"
                    [class.priority-media]="plan.priority === 'media'"
                    [class.priority-baixa]="plan.priority === 'baixa'"
                  >
                    {{ getPriorityLabel(plan.priority) }}
                  </span>
                </td>
              </ng-container>

              <!-- Risco Vinculado -->
              <ng-container matColumnDef="risk">
                <th mat-header-cell *matHeaderCellDef>Risco</th>
                <td mat-cell *matCellDef="let plan">
                  <span *ngIf="plan.risk_id" class="risk-link">
                    {{ getRiskName(plan.risk_id) }}
                  </span>
                  <span *ngIf="!plan.risk_id" class="no-link">-</span>
                </td>
              </ng-container>

              <!-- Actions -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>A\u00e7\u00f5es</th>
                <td mat-cell *matCellDef="let plan">
                  <div class="action-btns">
                    <button
                      mat-icon-button
                      matTooltip="Editar"
                      class="action-icon"
                      (click)="openFormDialog(plan); $event.stopPropagation()"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Excluir"
                      class="action-icon action-delete"
                      (click)="deletePlan(plan); $event.stopPropagation()"
                    >
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr
                mat-row
                *matRowDef="let row; columns: displayedColumns"
                class="plan-row"
                (click)="openFormDialog(row)"
              ></tr>
            </table>

            @if (actionPlans.length === 0) {
              <div class="empty-state">
                <div class="empty-icon-wrapper">
                  <mat-icon>assignment</mat-icon>
                </div>
                <h3>Nenhum plano de a\u00e7\u00e3o encontrado</h3>
                <p>Ajuste os filtros ou crie um novo plano.</p>
              </div>
            }
          </div>

          <mat-paginator
            [length]="totalPlans"
            [pageSize]="pageSize"
            [pageIndex]="currentPage - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .action-plans-container {
        display: flex;
        height: calc(100vh - 60px - 48px - 3px);
        margin: -24px;
        overflow: hidden;
      }

      .content-area {
        flex: 1;
        padding: 24px;
        background-color: var(--bg-primary, #f0f2f5);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }

      .content-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .page-title {
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

      .header-actions { display: flex; gap: 8px; align-items: center; }

      .new-btn {
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        text-transform: none !important;
      }

      :host ::ng-deep .new-btn .mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* ---- Summary Cards ---- */
      .summary-cards {
        display: flex;
        gap: 14px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }

      .summary-card {
        flex: 1;
        min-width: 130px;
        padding: 16px 18px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        gap: 14px;
        border-left: 4px solid;
        background: white;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
        transition: all 0.2s;
      }

      .summary-card:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        transform: translateY(-1px);
      }

      .card-icon-area {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .card-icon-area mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      .card-data { display: flex; flex-direction: column; }

      .card-value {
        font-size: 1.5rem;
        font-weight: 800;
        line-height: 1.1;
      }

      .card-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-top: 2px;
      }

      .card-pendente {
        border-left-color: #f59e0b;
      }
      .card-pendente .card-icon-area { background: #fef3c7; }
      .card-pendente .card-icon-area mat-icon { color: #d97706; }
      .card-pendente .card-value { color: #d97706; }
      .card-pendente .card-label { color: #92400e; }

      .card-andamento {
        border-left-color: #3b82f6;
      }
      .card-andamento .card-icon-area { background: #dbeafe; }
      .card-andamento .card-icon-area mat-icon { color: #2563eb; }
      .card-andamento .card-value { color: #2563eb; }
      .card-andamento .card-label { color: #1e40af; }

      .card-concluido {
        border-left-color: #10b981;
      }
      .card-concluido .card-icon-area { background: #dcfce7; }
      .card-concluido .card-icon-area mat-icon { color: #059669; }
      .card-concluido .card-value { color: #059669; }
      .card-concluido .card-label { color: #166534; }

      .card-cancelado {
        border-left-color: #ef4444;
      }
      .card-cancelado .card-icon-area { background: #fee2e2; }
      .card-cancelado .card-icon-area mat-icon { color: #dc2626; }
      .card-cancelado .card-value { color: #dc2626; }
      .card-cancelado .card-label { color: #991b1b; }

      .card-total {
        border-left-color: #8b5cf6;
      }
      .card-total .card-icon-area { background: #ede9fe; }
      .card-total .card-icon-area mat-icon { color: #7c3aed; }
      .card-total .card-value { color: #7c3aed; }
      .card-total .card-label { color: #5b21b6; }

      /* ---- Filters ---- */
      .filters-bar {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
        flex-wrap: wrap;
        align-items: flex-start;
      }

      .search-field {
        flex: 1;
        min-width: 250px;
        max-width: 420px;
      }

      .filter-field { width: 160px; }

      :host ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper,
      :host ::ng-deep .filter-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .search-prefix-icon { color: var(--text-muted, #94a3b8); margin-right: 4px; }

      /* ---- Table ---- */
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        flex: 1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
      }

      .plans-table { width: 100%; }

      .plan-row {
        cursor: pointer;
        transition: background 0.15s;
      }

      .plan-row:hover {
        background-color: #f8fafc !important;
      }

      .title-text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 250px;
        font-weight: 500;
      }

      /* ---- Status Chip ---- */
      .status-chip {
        display: inline-flex;
        align-items: center;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-pendente { background-color: #fef3c7; color: #92400e; }
      .status-andamento { background-color: #dbeafe; color: #1e40af; }
      .status-concluido { background-color: #dcfce7; color: #166534; }
      .status-cancelado { background-color: #fce4ec; color: #c62828; }

      /* ---- Priority Badge ---- */
      .priority-badge {
        display: inline-flex;
        align-items: center;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .priority-alta { background-color: #fce4ec; color: #c62828; }
      .priority-media { background-color: #fef3c7; color: #92400e; }
      .priority-baixa { background-color: #dcfce7; color: #166534; }

      /* ---- Risk link ---- */
      .risk-link {
        display: inline-block;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background-color: #dbeafe;
        color: #1e40af;
      }

      .no-link { color: var(--text-muted, #94a3b8); }

      .overdue {
        color: #dc2626;
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .overdue-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #dc2626;
      }

      /* ---- Actions ---- */
      .action-btns { display: flex; gap: 2px; }

      .action-icon {
        color: var(--text-secondary, #64748b);
        transition: color 0.15s;
      }

      .action-icon:hover { color: var(--grc-primary, #00338d); }
      .action-delete:hover { color: var(--grc-danger, #EF4444) !important; }

      :host ::ng-deep .action-icon .mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      /* ---- Empty / Loading ---- */
      .empty-state {
        text-align: center;
        padding: 56px 24px;
        color: var(--text-muted, #94a3b8);
      }

      .empty-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 50%;
        background: #f1f5f9;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
      }

      .empty-icon-wrapper mat-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--text-muted, #94a3b8);
      }

      .empty-state h3 {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-secondary, #64748b);
        margin-bottom: 4px;
      }

      .empty-state p { font-size: 13px; }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px;
        color: var(--text-secondary, #64748b);
        gap: 16px;
      }
    `,
  ],
})
export class ActionPlansComponent implements OnInit {
  displayedColumns = [
    'title',
    'responsible',
    'start_date',
    'due_date',
    'status',
    'priority',
    'risk',
    'actions',
  ];

  actionPlans: ActionPlan[] = [];
  totalPlans = 0;
  currentPage = 1;
  pageSize = 20;
  searchTerm = '';
  filterStatus = '';
  filterPriority = '';
  loading = false;

  summary: ActionPlanSummary = {
    pendente: 0,
    em_andamento: 0,
    concluido: 0,
    cancelado: 0,
    total: 0,
  };

  availableRisks: Risk[] = [];
  availableControls: Control[] = [];

  private statusLabels: Record<string, string> = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Conclu\u00eddo',
    cancelado: 'Cancelado',
  };

  private priorityLabels: Record<string, string> = {
    alta: 'Alta',
    media: 'M\u00e9dia',
    baixa: 'Baixa',
  };

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadSummary();
    this.loadRisks();
    this.loadControls();
  }

  loadPlans(): void {
    this.loading = true;
    this.api
      .getActionPlans({
        status: this.filterStatus || undefined,
        priority: this.filterPriority || undefined,
        search: this.searchTerm || undefined,
        page: this.currentPage,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (response: ActionPlanListResponse) => {
          this.actionPlans = response.items;
          this.totalPlans = response.total;
          this.loading = false;
        },
        error: () => {
          this.actionPlans = [];
          this.totalPlans = 0;
          this.loading = false;
        },
      });
  }

  loadSummary(): void {
    this.api.getActionPlansSummary().subscribe({
      next: (data: ActionPlanSummary) => {
        this.summary = data;
      },
      error: () => {},
    });
  }

  loadRisks(): void {
    this.api.getRisks({ page: 1, page_size: 1000 }).subscribe({
      next: (response) => {
        this.availableRisks = response.items;
      },
      error: () => {
        this.availableRisks = [];
      },
    });
  }

  loadControls(): void {
    this.api.getControls({ page: 1, page_size: 1000 }).subscribe({
      next: (response) => {
        this.availableControls = response.items;
      },
      error: () => {
        this.availableControls = [];
      },
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPlans();
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadPlans();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadPlans();
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] || status;
  }

  getPriorityLabel(priority: string): string {
    return this.priorityLabels[priority] || priority;
  }

  getRiskName(riskId: string): string {
    const risk = this.availableRisks.find((r) => r.id === riskId);
    return risk ? risk.name : 'Risco';
  }

  formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  isOverdue(plan: ActionPlan): boolean {
    if (!plan.due_date || plan.status === 'concluido' || plan.status === 'cancelado') {
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(plan.due_date + 'T00:00:00');
    return due < today;
  }

  openFormDialog(plan: ActionPlan | null): void {
    const dialogData: ActionPlanFormDialogData = {
      actionPlan: plan,
      risks: this.availableRisks,
      controls: this.availableControls,
    };

    const dialogRef = this.dialog.open(ActionPlanFormDialogComponent, {
      width: '600px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (plan) {
          this.api.updateActionPlan(plan.id, result).subscribe({
            next: () => {
              this.loadPlans();
              this.loadSummary();
            },
          });
        } else {
          this.api.createActionPlan(result).subscribe({
            next: () => {
              this.loadPlans();
              this.loadSummary();
            },
          });
        }
      }
    });
  }

  deletePlan(plan: ActionPlan): void {
    if (confirm(`Deseja excluir o plano de a\u00e7\u00e3o "${plan.title}"?`)) {
      this.api.deleteActionPlan(plan.id).subscribe({
        next: () => {
          this.loadPlans();
          this.loadSummary();
        },
      });
    }
  }
}
