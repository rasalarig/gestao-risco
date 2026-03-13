import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import {
  Risk,
  RiskFactor,
  RiskFactorListResponse,
  RiskListResponse,
} from '../../../core/models/interfaces';
import {
  RiskFactorFormDialogComponent,
  RiskFactorFormDialogData,
} from './risk-factor-form-dialog.component';

@Component({
  selector: 'app-risk-factors',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="factors-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <button mat-icon-button (click)="goBack()" class="back-btn" matTooltip="Voltar">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div class="title-block">
            <h2 class="page-title">Fatores de Risco e Causas</h2>
            <p class="page-subtitle">
              Gerencie os fatores e causas associados aos riscos identificados
            </p>
          </div>
        </div>
        <div class="header-actions">
          <button
            mat-raised-button
            class="new-factor-btn"
            (click)="openFactorDialog(null)"
          >
            <mat-icon>add</mat-icon>
            Novo Fator
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar fatores...</mat-label>
          <input
            matInput
            [(ngModel)]="searchTerm"
            (keyup.enter)="onSearch()"
            placeholder="Buscar por nome ou descricao"
          />
          <mat-icon matSuffix class="search-icon" (click)="onSearch()"
            >search</mat-icon
          >
        </mat-form-field>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Carregando fatores de risco...</p>
        </div>
      } @else {
        <!-- Checklist -->
        <div class="checklist-container">
          @if (factors.length === 0) {
            <div class="empty-state">
              <mat-icon>info_outline</mat-icon>
              <p>Nenhum fator de risco encontrado</p>
              <button
                mat-stroked-button
                class="empty-add-btn"
                (click)="openFactorDialog(null)"
              >
                <mat-icon>add</mat-icon>
                Adicionar Fator
              </button>
            </div>
          } @else {
            @for (factor of factors; track factor.id; let i = $index) {
              <div class="checklist-item" [class.even]="i % 2 === 0">
                <div class="item-number">
                  <div class="number-circle">{{ getDisplayNumber(i) }}</div>
                </div>
                <div class="item-checkbox">
                  <mat-icon class="check-icon">check_circle</mat-icon>
                </div>
                <div class="item-content">
                  <div class="item-header">
                    <span class="item-name">{{ factor.name }}</span>
                    @if (factor.category) {
                      <span class="item-category">{{ factor.category }}</span>
                    }
                  </div>
                  @if (factor.description) {
                    <p class="item-description">{{ factor.description }}</p>
                  }
                  <div class="item-meta">
                    <mat-icon class="meta-icon">link</mat-icon>
                    <span class="meta-text">
                      Risco: {{ factor.risk_name || 'N/A' }}
                    </span>
                  </div>
                </div>
                <div class="item-actions">
                  <button
                    mat-icon-button
                    matTooltip="Editar"
                    (click)="openFactorDialog(factor)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    matTooltip="Excluir"
                    class="delete-btn"
                    (click)="deleteFactor(factor)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </div>
              </div>
            }
          }
        </div>

        @if (factors.length > 0) {
          <mat-paginator
            [length]="totalFactors"
            [pageSize]="pageSize"
            [pageIndex]="currentPage - 1"
            [pageSizeOptions]="[10, 20, 50]"
            (page)="onPageChange($event)"
            showFirstLastButtons
          ></mat-paginator>
        }
      }
    </div>
  `,
  styles: [
    `
      .factors-container {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }

      /* Header */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .header-left {
        display: flex;
        align-items: flex-start;
        gap: 12px;
      }

      .back-btn {
        color: #00338d;
        margin-top: 2px;
      }

      .title-block {
        display: flex;
        flex-direction: column;
      }

      .page-title {
        font-size: 22px;
        font-weight: 600;
        color: #00338d;
        margin: 0;
      }

      .page-subtitle {
        font-size: 13px;
        color: #666;
        margin: 4px 0 0 0;
      }

      .header-actions {
        display: flex;
        gap: 8px;
      }

      .new-factor-btn {
        background-color: #00338d;
        color: white;
      }

      :host ::ng-deep .new-factor-btn .mat-icon {
        margin-right: 4px;
      }

      /* Search */
      .search-bar {
        margin-bottom: 16px;
      }

      .search-field {
        width: 100%;
        max-width: 420px;
      }

      :host ::ng-deep .search-field .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .search-icon {
        cursor: pointer;
        color: #666;
      }

      /* Checklist */
      .checklist-container {
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
        background: white;
      }

      .checklist-item {
        display: flex;
        align-items: center;
        padding: 16px 20px;
        border-bottom: 1px solid #e8ecf0;
        transition: background-color 0.15s;
        gap: 16px;
      }

      .checklist-item:last-child {
        border-bottom: none;
      }

      .checklist-item:hover {
        background-color: #f0f7ff;
      }

      .checklist-item.even {
        background-color: #fafbfc;
      }

      .checklist-item.even:hover {
        background-color: #f0f7ff;
      }

      /* Number */
      .item-number {
        flex-shrink: 0;
      }

      .number-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #00338d;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
      }

      /* Checkbox */
      .item-checkbox {
        flex-shrink: 0;
      }

      .check-icon {
        color: #00a3a1;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      /* Content */
      .item-content {
        flex: 1;
        min-width: 0;
      }

      .item-header {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
      }

      .item-name {
        font-size: 15px;
        font-weight: 600;
        color: #1a1a2e;
      }

      .item-category {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        background-color: #e3f2fd;
        color: #005eb8;
      }

      .item-description {
        font-size: 13px;
        color: #555;
        margin: 4px 0 0 0;
        line-height: 1.4;
      }

      .item-meta {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 6px;
      }

      .meta-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        color: #0091da;
      }

      .meta-text {
        font-size: 12px;
        color: #0091da;
        font-weight: 500;
      }

      /* Actions */
      .item-actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }

      .item-actions button {
        color: #555;
      }

      .item-actions button:hover {
        color: #00338d;
      }

      .delete-btn:hover {
        color: #bc204b !important;
      }

      /* Empty / Loading */
      .empty-state {
        text-align: center;
        padding: 56px 24px;
        color: #999;
      }

      .empty-state mat-icon {
        font-size: 56px;
        width: 56px;
        height: 56px;
        margin-bottom: 12px;
        color: #ccc;
      }

      .empty-state p {
        font-size: 15px;
        margin-bottom: 16px;
      }

      .empty-add-btn {
        color: #00338d;
        border-color: #00338d;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 56px;
        color: #666;
        gap: 16px;
      }
    `,
  ],
})
export class RiskFactorsComponent implements OnInit {
  factors: RiskFactor[] = [];
  totalFactors = 0;
  currentPage = 1;
  pageSize = 20;
  searchTerm = '';
  loading = false;

  // Cache of all risks for the dropdown
  allRisks: Risk[] = [];

  constructor(
    private api: ApiService,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadFactors();
    this.loadAllRisks();
  }

  loadFactors(): void {
    this.loading = true;
    this.api
      .getRiskFactors({
        page: this.currentPage,
        page_size: this.pageSize,
        search: this.searchTerm || undefined,
      })
      .subscribe({
        next: (response: RiskFactorListResponse) => {
          this.factors = response.items;
          this.totalFactors = response.total;
          this.loading = false;
        },
        error: () => {
          this.factors = [];
          this.totalFactors = 0;
          this.loading = false;
        },
      });
  }

  loadAllRisks(): void {
    this.api
      .getRisks({ page: 1, page_size: 100 })
      .subscribe({
        next: (response: RiskListResponse) => {
          this.allRisks = response.items;
        },
        error: () => {
          this.allRisks = [];
        },
      });
  }

  getDisplayNumber(index: number): number {
    return (this.currentPage - 1) * this.pageSize + index + 1;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadFactors();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadFactors();
  }

  openFactorDialog(factor: RiskFactor | null): void {
    const dialogData: RiskFactorFormDialogData = {
      factor,
      risks: this.allRisks,
    };

    const dialogRef = this.dialog.open(RiskFactorFormDialogComponent, {
      width: '520px',
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (factor) {
          // Update
          this.api.updateRiskFactor(factor.id, result).subscribe({
            next: () => this.loadFactors(),
          });
        } else {
          // Create
          this.api.createRiskFactor(result).subscribe({
            next: () => this.loadFactors(),
          });
        }
      }
    });
  }

  deleteFactor(factor: RiskFactor): void {
    if (confirm(`Deseja excluir o fator "${factor.name}"?`)) {
      this.api.deleteRiskFactor(factor.id).subscribe({
        next: () => this.loadFactors(),
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/risks']);
  }
}
