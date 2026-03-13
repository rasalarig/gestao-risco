import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home.component').then(
            (m) => m.HomeComponent
          ),
      },
      {
        path: 'risks',
        loadComponent: () =>
          import('./features/risks/risks.component').then(
            (m) => m.RisksComponent
          ),
      },
      {
        path: 'risks/assessments',
        loadComponent: () =>
          import(
            './features/risks/risk-assessments.component'
          ).then((m) => m.RiskAssessmentsComponent),
      },
      {
        path: 'risks/factors',
        loadComponent: () =>
          import(
            './features/risks/risk-factors/risk-factors.component'
          ).then((m) => m.RiskFactorsComponent),
      },
      {
        path: 'riscos',
        redirectTo: 'risks',
        pathMatch: 'full',
      },
      {
        path: 'avaliacoes',
        redirectTo: 'risks/assessments',
        pathMatch: 'full',
      },
      {
        path: 'controls',
        loadComponent: () =>
          import('./features/controls/controls.component').then(
            (m) => m.ControlsComponent
          ),
      },
      {
        path: 'controles',
        redirectTo: 'controls',
        pathMatch: 'full',
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/analytics/analytics.component').then(
            (m) => m.AnalyticsComponent
          ),
      },
      {
        path: 'analitico',
        redirectTo: 'analytics',
        pathMatch: 'full',
      },
      {
        path: 'compliance',
        loadComponent: () =>
          import('./features/compliance/compliance.component').then(
            (m) => m.ComplianceComponent
          ),
      },
      {
        path: 'planos-acao',
        loadComponent: () =>
          import('./features/action-plans/action-plans.component').then(
            (m) => m.ActionPlansComponent
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
