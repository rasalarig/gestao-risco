export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  empresa_id: string | null;
  is_active: boolean;
}

export interface Empresa {
  id: string;
  name: string;
  cnpj: string;
  created_at: string;
}

export interface RiskCategory {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface RiskCategoryTree {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  children: RiskCategoryTree[];
}

export interface RiskListResponse {
  items: Risk[];
  total: number;
  page: number;
  page_size: number;
}

export interface Risk {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  area: string | null;
  responsible: string | null;
  status: string;
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  risk_id: string;
  type: string;
  impact: number;
  probability: number;
  score: number;
  severity: string;
  notes: string | null;
  assessed_by: string | null;
  assessed_at: string;
  created_at: string;
}

export interface RiskAssessmentSummaryItem {
  risk_id: string;
  risk_name: string;
  category_name: string | null;
  inherent_impact: number | null;
  inherent_probability: number | null;
  inherent_score: number | null;
  inherent_severity: string | null;
  residual_impact: number | null;
  residual_probability: number | null;
  residual_score: number | null;
  residual_severity: string | null;
}

export interface RiskAssessmentSummaryResponse {
  items: RiskAssessmentSummaryItem[];
  severity_counts: { [key: string]: number };
}

export interface RiskFactor {
  id: string;
  name: string;
  description: string | null;
  risk_id: string;
  category: string | null;
  risk_name: string | null;
  created_at: string;
}

export interface RiskFactorListResponse {
  items: RiskFactor[];
  total: number;
  page: number;
  page_size: number;
}

export interface Control {
  id: string;
  description: string;
  type: string;
  frequency: string | null;
  responsible: string | null;
  effectiveness: string | null;
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
  risk_ids: string[];
}

export interface ControlListResponse {
  items: Control[];
  total: number;
  page: number;
  page_size: number;
}

export interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  responsible: string | null;
  start_date: string | null;
  due_date: string | null;
  status: string;
  priority: string;
  risk_id: string | null;
  control_id: string | null;
  empresa_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActionPlanListResponse {
  items: ActionPlan[];
  total: number;
  page: number;
  page_size: number;
}

export interface ActionPlanSummary {
  pendente: number;
  em_andamento: number;
  concluido: number;
  cancelado: number;
  total: number;
}

export interface MatrixCellRisk {
  id: string;
  name: string;
}

export interface MatrixCell {
  impact: number;
  probability: number;
  count: number;
  risks: MatrixCellRisk[];
}

export interface RiskMatrixResponse {
  inherent: MatrixCell[];
  residual: MatrixCell[];
}

export interface SummaryStats {
  total_risks: number;
  total_controls: number;
  total_action_plans: number;
  risks_with_controls: number;
  risks_without_controls: number;
  controls_with_action_plans: number;
  controls_without_action_plans: number;
  action_plans_pending: number;
  action_plans_in_progress: number;
  action_plans_completed: number;
  risks_by_criticality: { level: string; count: number }[];
  pipeline_flow: {
    risks_total: number;
    risks_with_assessments: number;
    controls_total: number;
    action_plans_total: number;
  };
}

export interface DashboardStats {
  total_riscos: number;
  total_controles: number;
  total_planos_acao: number;
  total_avaliacoes: number;
  risks_by_category: { category_name: string; count: number }[];
  risks_by_severity: { severity: string; count: number }[];
  action_plans_by_status: { status: string; count: number }[];
  controls_by_type: { type: string; count: number }[];
  controls_by_effectiveness: { effectiveness: string; count: number }[];
}
