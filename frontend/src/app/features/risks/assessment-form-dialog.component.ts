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
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { RiskAssessment } from '../../core/models/interfaces';

export interface AssessmentFormDialogData {
  assessment: RiskAssessment | null;
  riskId: string;
  riskName: string;
}

const IMPACT_LABELS: { [key: number]: string } = {
  1: 'Muito Baixo',
  2: 'Baixo',
  3: 'Moderado',
  4: 'Alto',
  5: 'Muito Alto',
};

const PROBABILITY_LABELS: { [key: number]: string } = {
  1: 'Muito Baixo',
  2: 'Baixo',
  3: 'Moderado',
  4: 'Alto',
  5: 'Muito Alto',
};

function computeSeverity(score: number): string {
  if (score >= 20) return 'Critico';
  if (score >= 12) return 'Alto';
  if (score >= 6) return 'Moderado';
  return 'Baixo';
}

function severityColor(severity: string): string {
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
      return '#999';
  }
}

@Component({
  selector: 'app-assessment-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSliderModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>
      {{ data.assessment ? 'Editar Avaliacao' : 'Nova Avaliacao' }}
    </h2>
    <div class="subtitle">{{ data.riskName }}</div>
    <mat-dialog-content>
      <form [formGroup]="form" class="assessment-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Avaliacao</mat-label>
          <mat-select formControlName="type">
            <mat-option value="inherent">Inerente</mat-option>
            <mat-option value="residual">Residual</mat-option>
          </mat-select>
        </mat-form-field>

        <div class="slider-section">
          <label class="slider-label">
            Impacto: <strong>{{ form.get('impact')?.value }}</strong> -
            {{ getImpactLabel(form.get('impact')?.value) }}
          </label>
          <mat-slider min="1" max="5" step="1" discrete showTickMarks class="full-width">
            <input matSliderThumb formControlName="impact" />
          </mat-slider>
        </div>

        <div class="slider-section">
          <label class="slider-label">
            Probabilidade: <strong>{{ form.get('probability')?.value }}</strong> -
            {{ getProbabilityLabel(form.get('probability')?.value) }}
          </label>
          <mat-slider min="1" max="5" step="1" discrete showTickMarks class="full-width">
            <input matSliderThumb formControlName="probability" />
          </mat-slider>
        </div>

        <div class="score-display">
          <div class="score-label">Score Calculado:</div>
          <div
            class="score-value"
            [style.background-color]="currentSeverityColor"
            [style.color]="currentSeverity === 'Moderado' ? '#333' : '#fff'"
          >
            {{ currentScore }} - {{ currentSeverity }}
          </div>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Avaliado por</mat-label>
          <input
            matInput
            formControlName="assessed_by"
            placeholder="Nome do avaliador"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Observacoes</mat-label>
          <textarea
            matInput
            formControlName="notes"
            rows="3"
            placeholder="Observacoes sobre a avaliacao"
          ></textarea>
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
      .subtitle {
        padding: 0 24px 8px;
        color: #666;
        font-size: 13px;
      }

      .assessment-form {
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

      .slider-section {
        margin-bottom: 16px;
      }

      .slider-label {
        font-size: 14px;
        color: #333;
        display: block;
        margin-bottom: 4px;
      }

      .score-display {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
        padding: 12px;
        background: #f5f5f5;
        border-radius: 8px;
      }

      .score-label {
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      .score-value {
        padding: 6px 16px;
        border-radius: 16px;
        font-weight: 600;
        font-size: 14px;
      }

      :host ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        margin-bottom: 0;
      }
    `,
  ],
})
export class AssessmentFormDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AssessmentFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssessmentFormDialogData
  ) {
    this.form = this.fb.group({
      type: [data.assessment?.type || 'inherent', Validators.required],
      impact: [data.assessment?.impact || 3, Validators.required],
      probability: [data.assessment?.probability || 3, Validators.required],
      notes: [data.assessment?.notes || ''],
      assessed_by: [data.assessment?.assessed_by || ''],
    });
  }

  get currentScore(): number {
    return (
      (this.form.get('impact')?.value || 1) *
      (this.form.get('probability')?.value || 1)
    );
  }

  get currentSeverity(): string {
    return computeSeverity(this.currentScore);
  }

  get currentSeverityColor(): string {
    return severityColor(this.currentSeverity);
  }

  getImpactLabel(value: number): string {
    return IMPACT_LABELS[value] || '';
  }

  getProbabilityLabel(value: number): string {
    return PROBABILITY_LABELS[value] || '';
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
