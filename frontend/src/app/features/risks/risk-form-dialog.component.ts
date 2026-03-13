import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Risk, RiskCategoryTree } from '../../core/models/interfaces';

export interface RiskFormDialogData {
  risk: Risk | null;
  categories: RiskCategoryTree[];
}

interface FlatCategory {
  id: string;
  name: string;
  level: number;
}

@Component({
  selector: 'app-risk-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.risk ? 'Editar Risco' : 'Novo Risco' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="risk-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome</mat-label>
          <input matInput formControlName="name" placeholder="Nome do risco" />
          @if (form.get('name')?.hasError('required') && form.get('name')?.touched) {
            <mat-error>Nome e obrigatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descricao</mat-label>
          <textarea
            matInput
            formControlName="description"
            rows="3"
            placeholder="Descricao do risco"
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoria</mat-label>
          <mat-select formControlName="category_id">
            <mat-option [value]="null">-- Sem categoria --</mat-option>
            @for (cat of flatCategories; track cat.id) {
              <mat-option [value]="cat.id">
                {{ cat.level > 0 ? '\u00A0\u00A0\u00A0\u00A0' : '' }}{{ cat.name }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Area</mat-label>
          <input matInput formControlName="area" placeholder="Area responsavel" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Responsavel</mat-label>
          <input
            matInput
            formControlName="responsible"
            placeholder="Nome do responsavel"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option value="ativo">Ativo</mat-option>
            <mat-option value="inativo">Inativo</mat-option>
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        (click)="onSave()"
        [disabled]="form.invalid"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .risk-form {
        display: flex;
        flex-direction: column;
        min-width: 400px;
        gap: 4px;
      }

      .full-width {
        width: 100%;
      }

      mat-dialog-content {
        padding-top: 8px;
      }

      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        margin-bottom: 0;
      }
    `,
  ],
})
export class RiskFormDialogComponent {
  form: FormGroup;
  flatCategories: FlatCategory[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RiskFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RiskFormDialogData
  ) {
    this.flatCategories = this.flattenCategories(data.categories);

    this.form = this.fb.group({
      name: [data.risk?.name || '', Validators.required],
      description: [data.risk?.description || ''],
      category_id: [data.risk?.category_id || null],
      area: [data.risk?.area || ''],
      responsible: [data.risk?.responsible || ''],
      status: [data.risk?.status || 'ativo'],
    });
  }

  private flattenCategories(
    categories: RiskCategoryTree[],
    level = 0
  ): FlatCategory[] {
    const result: FlatCategory[] = [];
    for (const cat of categories) {
      result.push({ id: cat.id, name: cat.name, level });
      if (cat.children && cat.children.length > 0) {
        result.push(...this.flattenCategories(cat.children, level + 1));
      }
    }
    return result;
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }
}
