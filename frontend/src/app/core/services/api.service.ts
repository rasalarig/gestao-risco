import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Risk,
  RiskCategory,
  RiskCategoryTree,
  RiskListResponse,
  RiskAssessment,
  RiskAssessmentSummaryResponse,
  RiskFactor,
  RiskFactorListResponse,
  Control,
  ControlListResponse,
  ActionPlan,
  ActionPlanListResponse,
  ActionPlanSummary,
  DashboardStats,
  RiskMatrixResponse,
  SummaryStats,
} from '../models/interfaces';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Risks
  getRisks(params?: {
    category_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Observable<RiskListResponse> {
    let httpParams = new HttpParams();
    if (params?.category_id) {
      httpParams = httpParams.set('category_id', params.category_id);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    return this.http.get<RiskListResponse>(`${this.apiUrl}/risks/`, {
      params: httpParams,
    });
  }

  createRisk(risk: Partial<Risk>): Observable<Risk> {
    return this.http.post<Risk>(`${this.apiUrl}/risks/`, risk);
  }

  getRisk(id: string): Observable<Risk> {
    return this.http.get<Risk>(`${this.apiUrl}/risks/${id}`);
  }

  updateRisk(id: string, risk: Partial<Risk>): Observable<Risk> {
    return this.http.put<Risk>(`${this.apiUrl}/risks/${id}`, risk);
  }

  deleteRisk(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/risks/${id}`);
  }

  // Risk Categories
  getRiskCategories(): Observable<RiskCategory[]> {
    return this.http.get<RiskCategory[]>(`${this.apiUrl}/risks/categories`);
  }

  getRiskCategoriesTree(): Observable<RiskCategoryTree[]> {
    return this.http.get<RiskCategoryTree[]>(`${this.apiUrl}/risks/categories`);
  }

  createRiskCategory(data: {
    name: string;
    parent_id?: string;
  }): Observable<RiskCategory> {
    return this.http.post<RiskCategory>(`${this.apiUrl}/risks/categories`, data);
  }

  // Risk Assessments
  getRiskAssessments(riskId: string): Observable<RiskAssessment[]> {
    return this.http.get<RiskAssessment[]>(
      `${this.apiUrl}/risks/${riskId}/assessments`
    );
  }

  createRiskAssessment(data: {
    risk_id: string;
    type: string;
    impact: number;
    probability: number;
    notes?: string;
    assessed_by?: string;
  }): Observable<RiskAssessment> {
    return this.http.post<RiskAssessment>(
      `${this.apiUrl}/risks/assessments`,
      data
    );
  }

  updateRiskAssessment(
    id: string,
    data: Partial<{
      type: string;
      impact: number;
      probability: number;
      notes: string;
      assessed_by: string;
    }>
  ): Observable<RiskAssessment> {
    return this.http.put<RiskAssessment>(
      `${this.apiUrl}/risks/assessments/${id}`,
      data
    );
  }

  getRiskAssessmentsSummary(): Observable<RiskAssessmentSummaryResponse> {
    return this.http.get<RiskAssessmentSummaryResponse>(
      `${this.apiUrl}/risks/assessments/summary`
    );
  }

  // Risk Factors
  getRiskFactors(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Observable<RiskFactorListResponse> {
    let httpParams = new HttpParams();
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    return this.http.get<RiskFactorListResponse>(
      `${this.apiUrl}/risks/factors/all`,
      { params: httpParams }
    );
  }

  getRiskFactorsForRisk(riskId: string): Observable<RiskFactor[]> {
    return this.http.get<RiskFactor[]>(
      `${this.apiUrl}/risks/${riskId}/factors`
    );
  }

  createRiskFactor(data: {
    name: string;
    description?: string;
    risk_id: string;
    category?: string;
  }): Observable<RiskFactor> {
    return this.http.post<RiskFactor>(
      `${this.apiUrl}/risks/factors`,
      data
    );
  }

  updateRiskFactor(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      risk_id: string;
      category: string;
    }>
  ): Observable<RiskFactor> {
    return this.http.put<RiskFactor>(
      `${this.apiUrl}/risks/factors/${id}`,
      data
    );
  }

  deleteRiskFactor(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/risks/factors/${id}`);
  }

  // Controls
  getControls(params?: {
    risk_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Observable<ControlListResponse> {
    let httpParams = new HttpParams();
    if (params?.risk_id) {
      httpParams = httpParams.set('risk_id', params.risk_id);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    return this.http.get<ControlListResponse>(`${this.apiUrl}/controls/`, {
      params: httpParams,
    });
  }

  getControl(id: string): Observable<Control> {
    return this.http.get<Control>(`${this.apiUrl}/controls/${id}`);
  }

  createControl(control: Partial<Control>): Observable<Control> {
    return this.http.post<Control>(`${this.apiUrl}/controls/`, control);
  }

  updateControl(id: string, control: Partial<Control>): Observable<Control> {
    return this.http.put<Control>(`${this.apiUrl}/controls/${id}`, control);
  }

  deleteControl(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/controls/${id}`);
  }

  // Action Plans
  getActionPlans(params?: {
    status?: string;
    priority?: string;
    risk_id?: string;
    control_id?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Observable<ActionPlanListResponse> {
    let httpParams = new HttpParams();
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.priority) {
      httpParams = httpParams.set('priority', params.priority);
    }
    if (params?.risk_id) {
      httpParams = httpParams.set('risk_id', params.risk_id);
    }
    if (params?.control_id) {
      httpParams = httpParams.set('control_id', params.control_id);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params?.page_size) {
      httpParams = httpParams.set('page_size', params.page_size.toString());
    }
    return this.http.get<ActionPlanListResponse>(`${this.apiUrl}/action-plans/`, {
      params: httpParams,
    });
  }

  getActionPlan(id: string): Observable<ActionPlan> {
    return this.http.get<ActionPlan>(`${this.apiUrl}/action-plans/${id}`);
  }

  createActionPlan(plan: Partial<ActionPlan>): Observable<ActionPlan> {
    return this.http.post<ActionPlan>(`${this.apiUrl}/action-plans/`, plan);
  }

  updateActionPlan(id: string, plan: Partial<ActionPlan>): Observable<ActionPlan> {
    return this.http.put<ActionPlan>(`${this.apiUrl}/action-plans/${id}`, plan);
  }

  deleteActionPlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/action-plans/${id}`);
  }

  getActionPlansSummary(): Observable<ActionPlanSummary> {
    return this.http.get<ActionPlanSummary>(`${this.apiUrl}/action-plans/summary`);
  }

  // Analytics - Risk Matrix
  getRiskMatrix(params?: {
    empresa_id?: string;
    category_id?: string;
  }): Observable<RiskMatrixResponse> {
    let httpParams = new HttpParams();
    if (params?.empresa_id) {
      httpParams = httpParams.set('empresa_id', params.empresa_id);
    }
    if (params?.category_id) {
      httpParams = httpParams.set('category_id', params.category_id);
    }
    return this.http.get<RiskMatrixResponse>(`${this.apiUrl}/analytics/matrix`, {
      params: httpParams,
    });
  }

  // Analytics - Drill Tree
  getDrillTree(params?: { empresa_id?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.empresa_id) {
      httpParams = httpParams.set('empresa_id', params.empresa_id);
    }
    return this.http.get<any>(`${this.apiUrl}/analytics/drill-tree`, {
      params: httpParams,
    });
  }

  // Analytics - Drill Web
  getDrillWeb(params?: { empresa_id?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.empresa_id) {
      httpParams = httpParams.set('empresa_id', params.empresa_id);
    }
    return this.http.get<any>(`${this.apiUrl}/analytics/drill-web`, {
      params: httpParams,
    });
  }

  // Analytics - Summary
  getSummaryStats(params?: {
    empresa_id?: string;
  }): Observable<SummaryStats> {
    let httpParams = new HttpParams();
    if (params?.empresa_id) {
      httpParams = httpParams.set('empresa_id', params.empresa_id);
    }
    return this.http.get<SummaryStats>(`${this.apiUrl}/analytics/summary`, {
      params: httpParams,
    });
  }

  // Analytics - Dashboard
  getDashboardStats(params?: {
    empresa_id?: string;
    category_id?: string;
  }): Observable<DashboardStats> {
    let httpParams = new HttpParams();
    if (params?.empresa_id) {
      httpParams = httpParams.set('empresa_id', params.empresa_id);
    }
    if (params?.category_id) {
      httpParams = httpParams.set('category_id', params.category_id);
    }
    return this.http.get<DashboardStats>(`${this.apiUrl}/analytics/dashboard`, {
      params: httpParams,
    });
  }
}
