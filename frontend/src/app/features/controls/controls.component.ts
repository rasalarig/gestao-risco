import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  Control,
  ControlListResponse,
  Risk,
} from '../../core/models/interfaces';
import {
  ControlFormDialogComponent,
  ControlFormDialogData,
} from './control-form-dialog.component';

@Component({
  selector: 'app-controls',
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
    MatCardModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="controls-container">
      <div class="content-area">
        <div class="content-header">
          <h2 class="page-title">
            <mat-icon class="title-icon">verified_user</mat-icon>
            Controles Internos
          </h2>
          <div class="header-actions">
            <button
              mat-raised-button
              color="primary"
              class="new-control-btn"
              (click)="openControlDialog(null)"
            >
              <mat-icon>add</mat-icon>
              Novo Controle
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-bar">
          <mat-form-field appearance="outline" class="search-field">
            <mat-icon matPrefix class="search-prefix-icon">search</mat-icon>
            <mat-label>Buscar controles...</mat-label>
            <input
              matInput
              [(ngModel)]="searchTerm"
              (keyup.enter)="onSearch()"
              placeholder="Buscar por descri\u00e7\u00e3o ou respons\u00e1vel"
            />
            @if (searchTerm) {
              <button mat-icon-button matSuffix (click)="searchTerm = ''; onSearch()">
                <mat-icon>close</mat-icon>
              </button>
            }
          </mat-form-field>
        </div>

        <!-- Controls Table -->
        @if (loading) {
          <div class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Carregando controles...</p>
          </div>
        } @else {
          <div class="table-container">
            <table mat-table [dataSource]="controls" class="controls-table">
              <!-- Descricao Column -->
              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Descri\u00e7\u00e3o</th>
                <td mat-cell *matCellDef="let control">
                  <span class="description-text">{{ control.description }}</span>
                </td>
              </ng-container>

              <!-- Tipo Column -->
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Tipo</th>
                <td mat-cell *matCellDef="let control">
                  <span class="type-badge" [attr.data-type]="control.type">
                    <span class="type-dot" [attr.data-type]="control.type"></span>
                    {{ control.type }}
                  </span>
                </td>
              </ng-container>

              <!-- Frequencia Column -->
              <ng-container matColumnDef="frequency">
                <th mat-header-cell *matHeaderCellDef>Frequ\u00eancia</th>
                <td mat-cell *matCellDef="let control">
                  {{ control.frequency || '-' }}
                </td>
              </ng-container>

              <!-- Responsavel Column -->
              <ng-container matColumnDef="responsible">
                <th mat-header-cell *matHeaderCellDef>Respons\u00e1vel</th>
                <td mat-cell *matCellDef="let control">
                  {{ control.responsible || '-' }}
                </td>
              </ng-container>

              <!-- Efetividade Column -->
              <ng-container matColumnDef="effectiveness">
                <th mat-header-cell *matHeaderCellDef>Efetividade</th>
                <td mat-cell *matCellDef="let control">
                  <span
                    class="effectiveness-badge"
                    [class.eff-efetivo]="control.effectiveness === 'Efetivo'"
                    [class.eff-parcial]="control.effectiveness === 'Parcialmente Efetivo'"
                    [class.eff-inefetivo]="control.effectiveness === 'Inefetivo'"
                  >
                    <span class="eff-dot"
                      [class.dot-efetivo]="control.effectiveness === 'Efetivo'"
                      [class.dot-parcial]="control.effectiveness === 'Parcialmente Efetivo'"
                      [class.dot-inefetivo]="control.effectiveness === 'Inefetivo'"
                    ></span>
                    {{ control.effectiveness || '-' }}
                  </span>
                </td>
              </ng-container>

              <!-- Riscos Vinculados Column -->
              <ng-container matColumnDef="risks">
                <th mat-header-cell *matHeaderCellDef>Riscos</th>
                <td mat-cell *matCellDef="let control">
                  <span class="risk-count-badge" *ngIf="control.risk_ids?.length > 0">
                    {{ control.risk_ids.length }} risco{{ control.risk_ids.length > 1 ? 's' : '' }}
                  </span>
                  <span *ngIf="!control.risk_ids?.length" class="no-risks">-</span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>A\u00e7\u00f5es</th>
                <td mat-cell *matCellDef="let control">
                  <div class="action-btns">
                    <button
                      mat-icon-button
                      matTooltip="Editar"
                      class="action-icon"
                      (click)="openControlDialog(control); $event.stopPropagation()"
                    >
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button
                      mat-icon-button
                      matTooltip="Excluir"
                      class="action-icon action-delete"
                      (click)="deleteControl(control); $event.stopPropagation()"
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
                class="control-row"
                (click)="openControlDialog(row)"
              ></tr>
            </table>

            @if (controls.length === 0) {
              <div class="empty-state">
                <div class="empty-icon-wrapper">
                  <mat-icon>verified_user</mat-icon>
                </div>
                <h3>Nenhum controle encontrado</h3>
                <p>Crie um novo controle para come\u00e7ar.</p>
              </div>
            }
          </div>

          <mat-paginator
            [length]="totalControls"
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
      .controls-container {
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

      .header-actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .new-control-btn {
        border-radius: 8px !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        text-transform: none !important;
      }

      :host ::ng-deep .new-control-btn .mat-icon {
        margin-right: 4px;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      /* ---- Search ---- */
      .search-bar { margin-bottom: 16px; }

      .search-field { width: 100%; max-width: 420px; }

      :host ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper { display: none; }

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

      .controls-table { width: 100%; }

      .control-row {
        cursor: pointer;
        transition: background 0.15s;
      }

      .control-row:hover {
        background-color: #f8fafc !important;
      }

      .description-text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-width: 300px;
        font-weight: 500;
      }

      /* ---- Type Badge ---- */
      .type-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background-color: #dbeafe;
        color: #1e40af;
      }

      .type-badge[data-type='Preventivo'] {
        background-color: #d1fae5;
        color: #065f46;
      }

      .type-badge[data-type='Detectivo'] {
        background-color: #fef3c7;
        color: #92400e;
      }

      .type-badge[data-type='Corretivo'] {
        background-color: #fce4ec;
        color: #c62828;
      }

      .type-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: #1e40af;
      }

      .type-dot[data-type='Preventivo'] { background-color: #059669; }
      .type-dot[data-type='Detectivo'] { background-color: #d97706; }
      .type-dot[data-type='Corretivo'] { background-color: #dc2626; }

      /* ---- Effectiveness Badge ---- */
      .effectiveness-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
      }

      .eff-efetivo {
        background-color: #dcfce7;
        color: #166534;
      }

      .eff-parcial {
        background-color: #fef3c7;
        color: #92400e;
      }

      .eff-inefetivo {
        background-color: #fce4ec;
        color: #c62828;
      }

      .eff-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }

      .dot-efetivo { background-color: #16a34a; }
      .dot-parcial { background-color: #d97706; }
      .dot-inefetivo { background-color: #dc2626; }

      /* ---- Risk Count Badge ---- */
      .risk-count-badge {
        display: inline-block;
        padding: 3px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 600;
        background-color: #dbeafe;
        color: #1e40af;
      }

      .no-risks { color: var(--text-muted, #94a3b8); }

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
export class ControlsComponent implements OnInit {
  displayedColumns = [
    'description',
    'type',
    'frequency',
    'responsible',
    'effectiveness',
    'risks',
    'actions',
  ];
  controls: Control[] = [];
  totalControls = 0;
  currentPage = 1;
  pageSize = 20;
  searchTerm = '';
  loading = false;

  availableRisks: Risk[] = [];

  constructor(
    private api: ApiService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadControls();
    this.loadRisks();
  }

  loadControls(): void {
    this.loading = true;
    this.api
      .getControls({
        search: this.searchTerm || undefined,
        page: this.currentPage,
        page_size: this.pageSize,
      })
      .subscribe({
        next: (response: ControlListResponse) => {
          this.controls = response.items;
          this.totalControls = response.total;
          this.loading = false;
        },
        error: () => {
          this.controls = [];
          this.totalControls = 0;
          this.loading = false;
        },
      });
  }

  loadRisks(): void {
    this.api
      .getRisks({ page: 1, page_size: 1000 })
      .subscribe({
        next: (response) => {
          this.availableRisks = response.items;
        },
        error: () => {
          this.availableRisks = [];
        },
      });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadControls();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadControls();
  }

  openControlDialog(control: Control | null): void {
    const dialogData: ControlFormDialogData = {
      control,
      risks: this.availableRisks,
    };

    const dialogRef = this.dialog.open(ControlFormDialogComponent, {
      width: '560px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (control) {
          this.api.updateControl(control.id, result).subscribe({
            next: () => this.loadControls(),
          });
        } else {
          this.api.createControl(result).subscribe({
            next: () => this.loadControls(),
          });
        }
      }
    });
  }

  deleteControl(control: Control): void {
    if (confirm(`Deseja excluir este controle?`)) {
      this.api.deleteControl(control.id).subscribe({
        next: () => this.loadControls(),
      });
    }
  }
}
