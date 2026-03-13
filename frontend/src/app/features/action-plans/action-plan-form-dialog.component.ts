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
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ActionPlan, Risk, Control } from '../../core/models/interfaces';

export interface ActionPlanFormDialogData {
  actionPlan: ActionPlan | null;
  risks: Risk[];
  controls: Control[];
}

@Component({
  selector: 'app-action-plan-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.actionPlan ? 'Editar Plano de Acao' : 'Novo Plano de Acao' }}</h2>
    <mat-dialog-content>
      <div class="form-container">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Titulo</mat-label>
          <input
            matInput
            [(ngModel)]="form.title"
            placeholder="Titulo do plano de acao"
            required
          />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Descricao</mat-label>
          <textarea
            matInput
            [(ngModel)]="form.description"
            rows="3"
            placeholder="Descreva o plano de acao"
          ></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Responsavel</mat-label>
          <input
            matInput
            [(ngModel)]="form.responsible"
            placeholder="Nome do responsavel"
          />
        </mat-form-field>

        <div class="date-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Data Inicio</mat-label>
            <input matInput [matDatepicker]="startPicker" [(ngModel)]="form.start_date" />
            <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
            <mat-datepicker #startPicker></mat-datepicker>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Data Limite</mat-label>
            <input matInput [matDatepicker]="duePicker" [(ngModel)]="form.due_date" />
            <mat-datepicker-toggle matIconSuffix [for]="duePicker"></mat-datepicker-toggle>
            <mat-datepicker #duePicker></mat-datepicker>
          </mat-form-field>
        </div>

        <div class="select-row">
          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="form.status" required>
              @for (s of statusOptions; track s.value) {
                <mat-option [value]="s.value">{{ s.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="half-width">
            <mat-label>Prioridade</mat-label>
            <mat-select [(ngModel)]="form.priority" required>
              @for (p of priorityOptions; track p.value) {
                <mat-option [value]="p.value">{{ p.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Risco Vinculado</mat-label>
          <mat-select [(ngModel)]="form.risk_id">
            <mat-option [value]="null">-- Nenhum --</mat-option>
            @for (risk of data.risks; track risk.id) {
              <mat-option [value]="risk.id">{{ risk.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Controle Vinculado</mat-label>
          <mat-select [(ngModel)]="form.control_id">
            <mat-option [value]="null">-- Nenhum --</mat-option>
            @for (ctrl of data.controls; track ctrl.id) {
              <mat-option [value]="ctrl.id">{{ ctrl.description }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
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
        min-width: 480px;
        padding-top: 8px;
      }

      .full-width {
        width: 100%;
      }

      .half-width {
        flex: 1;
      }

      .date-row,
      .select-row {
        display: flex;
        gap: 12px;
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
export class ActionPlanFormDialogComponent implements OnInit {
  statusOptions = [
    { value: 'pendente', label: 'Pendente' },
    { value: 'em_andamento', label: 'Em Andamento' },
    { value: 'concluido', label: 'Concluido' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  priorityOptions = [
    { value: 'alta', label: 'Alta' },
    { value: 'media', label: 'Media' },
    { value: 'baixa', label: 'Baixa' },
  ];

  form: {
    title: string;
    description: string | null;
    responsible: string | null;
    start_date: Date | null;
    due_date: Date | null;
    status: string;
    priority: string;
    risk_id: string | null;
    control_id: string | null;
  } = {
    title: '',
    description: null,
    responsible: null,
    start_date: null,
    due_date: null,
    status: 'pendente',
    priority: 'media',
    risk_id: null,
    control_id: null,
  };

  constructor(
    public dialogRef: MatDialogRef<ActionPlanFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ActionPlanFormDialogData
  ) {}

  ngOnInit(): void {
    if (this.data.actionPlan) {
      const ap = this.data.actionPlan;
      this.form = {
        title: ap.title,
        description: ap.description,
        responsible: ap.responsible,
        start_date: ap.start_date ? new Date(ap.start_date + 'T00:00:00') : null,
        due_date: ap.due_date ? new Date(ap.due_date + 'T00:00:00') : null,
        status: ap.status,
        priority: ap.priority,
        risk_id: ap.risk_id,
        control_id: ap.control_id,
      };
    }
  }

  isValid(): boolean {
    return !!(this.form.title && this.form.status && this.form.priority);
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  onSave(): void {
    if (!this.isValid()) return;

    const result: Record<string, unknown> = {
      title: this.form.title,
      description: this.form.description || null,
      responsible: this.form.responsible || null,
      start_date: this.form.start_date
        ? this.formatDate(this.form.start_date)
        : null,
      due_date: this.form.due_date
        ? this.formatDate(this.form.due_date)
        : null,
      status: this.form.status,
      priority: this.form.priority,
      risk_id: this.form.risk_id || null,
      control_id: this.form.control_id || null,
    };

    this.dialogRef.close(result);
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
