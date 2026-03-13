import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Control, Risk } from '../../core/models/interfaces';

export interface ControlFormDialogData {
  control: Control | null;
  risks: Risk[];
}

@Component({
  selector: 'app-control-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.control ? 'Editar Controle' : 'Novo Controle' }}</h2>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descricao</mat-label>
          <textarea
            matInput
            [(ngModel)]="form.description"
            rows="3"
            placeholder="Descreva o controle"
            required
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Tipo de Controle</mat-label>
          <mat-select [(ngModel)]="form.type" required>
            @for (t of controlTypes; track t) {
              <mat-option [value]="t">{{ t }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Frequencia</mat-label>
          <mat-select [(ngModel)]="form.frequency">
            @for (f of frequencies; track f) {
              <mat-option [value]="f">{{ f }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Responsavel</mat-label>
          <input
            matInput
            [(ngModel)]="form.responsible"
            placeholder="Nome do responsavel"
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Efetividade</mat-label>
          <mat-select [(ngModel)]="form.effectiveness">
            @for (e of effectivenessOptions; track e) {
              <mat-option [value]="e">{{ e }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Riscos Vinculados</mat-label>
          <mat-select [(ngModel)]="form.risk_ids" multiple>
            @for (risk of data.risks; track risk.id) {
              <mat-option [value]="risk.id">{{ risk.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        @if (form.risk_ids.length > 0) {
          <div class="linked-risks">
            <span class="chip-label">Riscos selecionados:</span>
            <div class="chips-container">
              @for (riskId of form.risk_ids; track riskId) {
                <span class="risk-chip">
                  {{ getRiskName(riskId) }}
                  <mat-icon class="chip-remove" (click)="removeRisk(riskId)">cancel</mat-icon>
                </span>
              }
            </div>
          </div>
        }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button
        mat-raised-button
        color="primary"
        [disabled]="!isValid()"
        (click)="onSave()"
        class="save-btn"
      >
        Salvar
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .form-container {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 400px;
        padding-top: 8px;
      }

      .full-width {
        width: 100%;
      }

      .linked-risks {
        margin-top: 4px;
        margin-bottom: 8px;
      }

      .chip-label {
        font-size: 12px;
        color: #666;
        display: block;
        margin-bottom: 6px;
      }

      .chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .risk-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 10px;
        background-color: #e3f2fd;
        color: #00338d;
        border-radius: 16px;
        font-size: 12px;
        font-weight: 500;
      }

      .chip-remove {
        font-size: 16px;
        width: 16px;
        height: 16px;
        cursor: pointer;
        color: #999;
      }

      .chip-remove:hover {
        color: #c62828;
      }

      .save-btn {
        background-color: #00338d !important;
        color: white !important;
      }

      :host ::ng-deep .mat-mdc-dialog-title {
        color: #00338d;
      }
    `,
  ],
})
export class ControlFormDialogComponent implements OnInit {
  controlTypes = ['Preventivo', 'Detectivo', 'Corretivo'];
  frequencies = ['Diario', 'Semanal', 'Mensal', 'Trimestral', 'Anual'];
  effectivenessOptions = ['Efetivo', 'Parcialmente Efetivo', 'Inefetivo'];

  form = {
    description: '',
    type: '',
    frequency: '' as string | null,
    responsible: '' as string | null,
    effectiveness: '' as string | null,
    risk_ids: [] as string[],
  };

  constructor(
    public dialogRef: MatDialogRef<ControlFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ControlFormDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.control) {
      const c = this.data.control;
      this.form = {
        description: c.description,
        type: c.type,
        frequency: c.frequency,
        responsible: c.responsible,
        effectiveness: c.effectiveness,
        risk_ids: c.risk_ids ? [...c.risk_ids] : [],
      };
    }
  }

  getRiskName(riskId: string): string {
    const risk = this.data.risks.find((r) => r.id === riskId);
    return risk ? risk.name : riskId;
  }

  removeRisk(riskId: string): void {
    this.form.risk_ids = this.form.risk_ids.filter((id) => id !== riskId);
  }

  isValid(): boolean {
    return !!(this.form.description && this.form.type);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (!this.isValid()) return;
    this.dialogRef.close(this.form);
  }
}
