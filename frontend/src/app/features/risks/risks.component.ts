import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../core/services/api.service';
import {
  Risk,
  RiskCategoryTree,
  RiskListResponse,
} from '../../core/models/interfaces';
import {
  RiskFormDialogComponent,
  RiskFormDialogData,
} from './risk-form-dialog.component';
import {
  AssessmentFormDialogComponent,
  AssessmentFormDialogData,
} from './assessment-form-dialog.component';

@Component({
  selector: 'app-risks',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTreeModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="risks-container">
      <!-- Left Sidebar: Category Tree -->
      <div class="category-sidebar">
        <div class="sidebar-header">
          <mat-icon>folder_open</mat-icon>
          <span>Categorias de Risco</span>
        </div>

        <!-- All risks item -->
        <div
          class="tree-item root-item"
          [class.selected]="!selectedCategoryId"
          (click)="selectCategory(null)"
        >
          <mat-icon class="tree-icon">list</mat-icon>
          <span>Todos os Riscos</span>
        </div>

        <mat-tree [dataSource]="dataSource" [treeControl]="treeControl">
          <!-- Leaf node -->
          <mat-nested-tree-node *matTreeNodeDef="let node">
            <div
              class="tree-item"
              [class.selected]="selectedCategoryId === node.id"
              (click)="selectCategory(node.id)"
            >
              <span class="tree-spacer"></span>
              <mat-icon class="tree-icon">description</mat-icon>
              <span class="tree-label">{{ node.name }}</span>
            </div>
          </mat-nested-tree-node>

          <!-- Parent node -->
          <mat-nested-tree-node
            *matTreeNodeDef="let node; when: hasChildren"
          >
            <div
              class="tree-item parent-item"
              [class.selected]="selectedCategoryId === node.id"
            >
              <button
                mat-icon-button
                matTreeNodeToggle
                class="toggle-btn"
              >
                <mat-icon>
                  {{
                    treeControl.isExpanded(node)
                      ? 'expand_more'
                      : 'chevron_right'
                  }}
                </mat-icon>
              </button>
              <mat-icon class="tree-icon">folder</mat-icon>
              <span
                class="tree-label clickable"
                (click)="selectCategory(node.id)"
              >
                {{ node.name }}
              </span>
            </div>
            <div
              [class.tree-hidden]="!treeControl.isExpanded(node)"
              class="tree-children"
            >
              <ng-container matTreeNodeOutlet></ng-container>
            </div>
          </mat-nested-tree-node>
        </mat-tree>
      </div>

      <!-- Right Content: Risk List -->
      <div class="content-area">
        <div class="content-header">
          <h2 class="page-title">
            <mat-icon class="title-icon">report_problem</mat-icon>
            {{ selectedCategoryName || 'Todos os Riscos' }}
          </h2>
          <div class="header-actions">
            <button
              mat-stroked-button
              class="action-btn-outline"
              (click)="goToFactors()"
            >
              <mat-icon>fact_check</mat-icon>
              Fatores
            </button>
            <button
              mat-stroked-button
              class="action-btn-outline"
              (click)="goToAssessments()"
            >
              <mat-icon>assessment</mat-icon>
              Avalia\u00e7\u00f5es
            </button>
            <button
              mat-raised-button
              color="primary"
              class="action-btn-primary"
              (click)="openRiskDialog(null)"
            >
              <mat-icon>add</mat-icon>
              Novo Risco
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix class="search-prefix-icon">search</mat-icon>
            <mat-label>Buscar riscos...</mat-label>
            <input
              matInput
              [(ngModel)]="searchTerm"
              (keyup.enter)="onSearch()"
              placeholder="Buscar por nome ou descri\u00e7\u00e3o"
            />
            @if (searchTerm) {
              <button mat-icon-button matSuffix (click)="searchTerm = ''; onSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>

        <!-- Risk Table -->
        @if (loading) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Carregando riscos...</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="risks" class="risks-table">
              <!-- Nome Column -->
              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Nome</th>
                <td mat-cell *matCellDef="let risk">
                  <span class="risk-name">{{ risk.name }}</span>
                </td>
              </ng-container>

              <!-- Area Column -->
              <ng-container matColumnDef="area">
                <th mat-header-cell *matHeaderCellDef>\u00c1rea</th>
                <td mat-cell *matCellDef="let risk">
                  {{ risk.area || '-' }}
                </td>
              </ng-container>

              <!-- Responsavel Column -->
              <ng-container matColumnDef="responsible">
                <th mat-header-cell *matHeaderCellDef>Respons\u00e1vel</th>
                <td mat-cell *matCellDef="let risk">
                  {{ risk.responsible || '-' }}
                </td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let risk">
                  <span
                    class="status-badge"
                    [class.badge-success]="risk.status === 'ativo'"
                    [class.badge-danger]="risk.status === 'inativo'"
                  >
                    <span class="status-dot" [class.dot-active]="risk.status === 'ativo'" [class.dot-inactive]="risk.status === 'inativo'"></span>
                    {{ risk.status === 'ativo' ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>A\u00e7\u00f5es</th>
                <td mat-cell *matCellDef="let risk">
                  <div class="action-btns">
                    <button
                      mat-icon-button
                      matTooltip="Avaliar"
                      class="action-icon"
                      (click)="openAssessmentDialog(risk); $event.stopPropagation()"
                    >
                      <mat-icon>assessment</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Editar"
                      class="action-icon"
                      (click)="openRiskDialog(risk); $event.stopPropagation()"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Excluir"
                      class="action-icon action-delete"
                      (click)="deleteRisk(risk); $event.stopPropagation()"
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
                class="risk-row"
                (click)="openRiskDialog(row)"
              ></tr>
            </table>

            @if (risks.length === 0) {
              <div class="empty-state">
                <div class="empty-icon-wrapper">
                  <mat-icon>search_off</mat-icon>
                </div>
                <h3>Nenhum risco encontrado</h3>
                <p>Tente ajustar os filtros ou crie um novo risco.</p>
              </div>
            }
          </div>

          <mat-paginator
            [length]="totalRisks"
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
      .risks-container {
        display: flex;
        height: calc(100vh - 60px - 48px - 3px);
        margin: -24px;
        overflow: hidden;
      }

      /* ---- Sidebar ---- */
      .category-sidebar {
        width: 280px;
        min-width: 280px;
        background: linear-gradient(180deg, #0a1628 0%, #0d1f3c 100%);
        color: white;
        overflow-y: auto;
        padding-bottom: 16px;
      }

      .sidebar-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 16px 14px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.7);
      }

      .sidebar-header mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .tree-item {
        display: flex;
        align-items: center;
        padding: 9px 16px;
        cursor: pointer;
        color: rgba(255, 255, 255, 0.7);
        font-size: 13px;
        transition: all 0.15s ease;
        border-left: 3px solid transparent;
      }

      .tree-item:hover {
        background-color: rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.95);
      }

      .tree-item.selected {
        background-color: rgba(0, 94, 184, 0.2);
        color: white;
        border-left-color: #0091da;
      }

      .root-item {
        padding: 11px 16px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      }

      .tree-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        margin-right: 8px;
        color: rgba(255, 255, 255, 0.4);
        transition: color 0.15s;
      }

      .selected .tree-icon {
        color: rgba(255, 255, 255, 0.9);
      }

      .tree-spacer {
        width: 36px;
        display: inline-block;
      }

      .tree-label {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-weight: 500;
      }

      .tree-label.clickable { cursor: pointer; }

      .parent-item { padding-left: 4px; }

      .toggle-btn {
        color: rgba(255, 255, 255, 0.4);
        width: 28px;
        height: 28px;
        line-height: 28px;
      }

      :host ::ng-deep .toggle-btn .mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .tree-children { overflow: hidden; }
      .tree-hidden { display: none; }

      /* ---- Content Area ---- */
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

      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .action-btn-outline {
        color: var(--grc-primary, #00338d) !important;
        border-color: var(--grc-primary, #00338d) !important;
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        text-transform: none !important;
      }

      :host ::ng-deep .action-btn-outline .mat-icon,
      :host ::ng-deep .action-btn-primary .mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .action-btn-primary {
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        text-transform: none !important;
      }

      /* ---- Search ---- */
      .search-bar { margin-bottom: 16px; }

      .search-field { width: 100%; max-width: 420px; }

      :host ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }

      .search-prefix-icon {
        color: var(--text-muted, #94a3b8);
        margin-right: 4px;
      }

      /* ---- Table ---- */
      .table-container {
        background: white;
        border-radius: 12px;
        overflow: hidden;
        flex: 1;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
      }

      .risks-table { width: 100%; }

      .risk-name { font-weight: 500; }

      .risk-row {
        cursor: pointer;
        transition: background 0.15s;
      }

      .risk-row:hover {
        background-color: #f8fafc !important;
      }

      /* ---- Status Badge ---- */
      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .status-badge.badge-success {
        background-color: #dcfce7;
        color: #166534;
      }

      .status-badge.badge-danger {
        background-color: #fce4ec;
        color: #c62828;
      }

      .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .dot-active { background-color: #16a34a; }
      .dot-inactive { background-color: #dc2626; }

      /* ---- Action buttons ---- */
      .action-btns {
        display: flex;
        gap: 2px;
      }

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

      .empty-state p {
        font-size: 13px;
      }

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
export class RisksComponent implements OnInit {
  // Tree
  treeControl = new NestedTreeControl<RiskCategoryTree>(
    (node) => node.children
  );
  dataSource = new MatTreeNestedDataSource<RiskCategoryTree>();
  categories: RiskCategoryTree[] = [];

  // Table
  displayedColumns = ['name', 'area', 'responsible', 'status', 'actions'];
  risks: Risk[] = [];
  totalRisks = 0;
  currentPage = 1;
  pageSize = 20;
  searchTerm = '';
  loading = false;

  // Selection
  selectedCategoryId: string | null = null;
  selectedCategoryName: string | null = null;

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadRisks();
  }

  hasChildren = (_: number, node: RiskCategoryTree): boolean =>
    !!node.children && node.children.length > 0;

  loadCategories(): void {
    this.api.getRiskCategoriesTree().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.dataSource.data = categories;
        this.treeControl.dataNodes = categories;
        this.expandAll(categories);
      },
      error: () => {
        this.categories = [];
        this.dataSource.data = [];
      },
    });
  }

  private expandAll(nodes: RiskCategoryTree[]): void {
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        this.treeControl.expand(node);
        this.expandAll(node.children);
      }
    }
  }

  selectCategory(categoryId: string | null): void {
    this.selectedCategoryId = categoryId;
    this.selectedCategoryName = this.findCategoryName(
      categoryId,
      this.categories
    );
    this.currentPage = 1;
    this.loadRisks();
  }

  private findCategoryName(
    id: string | null,
    categories: RiskCategoryTree[]
  ): string | null {
    if (!id) return null;
    for (const cat of categories) {
      if (cat.id === id) return cat.name;
      if (cat.children) {
        const found = this.findCategoryName(id, cat.children);
        if (found) return found;
      }
    }
    return null;
  }

  loadRisks(): void {
    this.loading = true;
    this.api
      .getRisks({
        category_id: this.selectedCategoryId || undefined,
        search: this.searchTerm || undefined,
        page: this.currentPage,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (response: RiskListResponse) => {
          this.risks = response.items;
          this.totalRisks = response.total;
          this.loading = false;
        },
        error: () => {
          this.risks = [];
          this.totalRisks = 0;
          this.loading = false;
        },
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRisks();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadRisks();
  }

  openRiskDialog(risk: Risk | null): void {
    const dialogData: RiskFormDialogData = {
      risk,
      categories: this.categories,
    };

    const dialogRef = this.dialog.open(RiskFormDialogComponent, {
      width: '520px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (risk) {
          this.api.updateRisk(risk.id, result).subscribe({
            next: () => this.loadRisks(),
          });
        } else {
          const createData = {
            ...result,
            category_id: this.selectedCategoryId || result.category_id,
          };
          this.api.createRisk(createData).subscribe({
            next: () => this.loadRisks(),
          });
        }
      }
    });
  }

  goToAssessments(): void {
    this.router.navigate(['/risks/assessments']);
  }

  goToFactors(): void {
    this.router.navigate(['/risks/factors']);
  }

  openAssessmentDialog(risk: Risk): void {
    const dialogData: AssessmentFormDialogData = {
      assessment: null,
      riskId: risk.id,
      riskName: risk.name,
    };

    const dialogRef = this.dialog.open(AssessmentFormDialogComponent, {
      width: '520px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.api
          .createRiskAssessment({
            risk_id: risk.id,
            type: result.type,
            impact: result.impact,
            probability: result.probability,
            notes: result.notes || undefined,
            assessed_by: result.assessed_by || undefined,
          })
          .subscribe({
            next: () => {
              // Assessment created successfully
            },
          });
      }
    });
  }

  deleteRisk(risk: Risk): void {
    if (confirm(`Deseja excluir o risco "${risk.name}"?`)) {
      this.api.deleteRisk(risk.id).subscribe({
        next: () => this.loadRisks(),
      });
    }
  }
}
