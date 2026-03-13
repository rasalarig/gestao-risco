import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-compliance',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <h2 class="page-title">
        <mat-icon class="title-icon">gavel</mat-icon>
        Conformidade
      </h2>
      <div class="placeholder-card">
        <div class="placeholder">
          <div class="placeholder-icon-wrapper">
            <mat-icon>gavel</mat-icon>
          </div>
          <h3>M\u00f3dulo de Conformidade em desenvolvimento</h3>
          <p>Este m\u00f3dulo incluir\u00e1 gest\u00e3o de documentos, engajamentos e controles de conformidade.</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page-container {
        max-width: 1200px;
        margin: 0 auto;
      }

      .page-title {
        font-size: 1.35rem;
        font-weight: 700;
        color: var(--text-primary, #1a1a2e);
        margin: 0 0 24px;
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

      .placeholder-card {
        background: white;
        border-radius: 12px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
        border: 1px solid rgba(0, 0, 0, 0.04);
      }

      .placeholder {
        text-align: center;
        padding: 64px 24px;
        color: var(--text-muted, #94a3b8);
      }

      .placeholder-icon-wrapper {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: linear-gradient(135deg, #059669, #10B981);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 20px;
      }

      .placeholder-icon-wrapper mat-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: white;
      }

      .placeholder h3 {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-secondary, #64748b);
        margin-bottom: 8px;
      }

      .placeholder p {
        font-size: 14px;
        max-width: 400px;
        margin: 0 auto;
        line-height: 1.5;
      }
    `,
  ],
})
export class ComplianceComponent {}
