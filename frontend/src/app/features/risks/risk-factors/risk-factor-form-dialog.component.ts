import { Component, Inject, OnInit } from '@angular/core';
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
import { Risk, RiskFactor } from '../../../core/models/interfaces';

export interface RiskFactorFormDialogData {
  factor: RiskFactor | null;
  risks: Risk[];
}

@Component({
  selector: 'app-risk-factor-form-dialog',
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
    <h2 mat-dialog-title>
      {{ data.factor ? 'Editar Fator de Risco' : 'Novo Fator de Risco' }}
    </h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="factor-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nome do Fator</mat-label>
          <input
            matInput
            formControlName="name"
            placeholder="Nome do fator de risco"
          />
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
            placeholder="Descricao do fator"
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Risco Vinculado</mat-label>
          <mat-select formControlName="risk_id">
            @for (risk of data.risks; track risk.id) {
              <mat-option [value]="risk.id">{{ risk.name }}</mat-option>
            }
          </mat-select>
          @if (form.get('risk_id')?.hasError('required') && form.get('risk_id')?.touched) {
            <mat-error>Risco vinculado e obrigatorio</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Categoria (opcional)</mat-label>
          <input
            matInput
            formControlName="category"
            placeholder="Ex: Operacional, Financeiro..."
          />
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
        class="save-btn"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .factor-form {
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

      .save-btn {
        background-color: #00338d;
        color: white;
      }
    `,
  ],
})
export class RiskFactorFormDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RiskFactorFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RiskFactorFormDialogData
  ) {
    this.form = this.fb.group({
      name: [data.factor?.name || '', Validators.required],
      description: [data.factor?.description || ''],
      risk_id: [data.factor?.risk_id || '', Validators.required],
      category: [data.factor?.category || ''],
    });
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (this.form.valid) {
      const value = this.form.value;
      // Clean up empty strings
      if (!value.category) {
        value.category = null;
      }
      if (!value.description) {
        value.description = null;
      }
      this.dialogRef.close(value);
    }
  }
}
