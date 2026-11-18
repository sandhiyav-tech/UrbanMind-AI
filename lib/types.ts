export type UserRole = 'citizen' | 'authority';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: string;
}

export type SafeUser = Omit<User, 'password_hash'>;

export interface ZoneConfig {
  id: string;
  name: string;
  lat: number;
  lng: number;
  population_density: number; // people per sq km
  description: string;
  polygon: [number, number][];
}

export type IssueType = 'road' | 'waste' | 'water' | 'other' | 'invalid';

export type IssueStatus = 'pending_analysis' | 'analyzed' | 'approved' | 'edited' | 'rejected';

export interface SpecialistFinding {
  severity: number;
  confidence: number;
  evidence: string;
  findings: string;
}

export interface GatekeeperResult {
  valid: boolean;
  reason: string;
}

export interface PriorityBreakdown {
  severity_norm: number;
  confidence: number;
  zone_density_norm: number;
  open_issue_count_norm: number;
  raw_score: number;
  formula: string;
}

export interface Issue {
  id: string;
  user_id: string | null;
  user_name?: string;
  zone: string;
  image_url: string;
  note?: string;
  issue_type: IssueType;
  severity: number;
  confidence: number;
  priority_score: number;
  priority_breakdown: PriorityBreakdown;
  reasoning: string;
  recommended_actions: string[];
  needs_human_review: boolean;
  status: IssueStatus;
  decision_notes?: string;
  decided_by?: string;
  decided_at?: string;
  specialist_findings: {
    gatekeeper: GatekeeperResult;
    road: SpecialistFinding;
    waste: SpecialistFinding;
    water: SpecialistFinding;
  };
  is_demo?: boolean;
  created_at: string;
}

export interface AirQualityForecast {
  zone_id: string;
  zone_name: string;
  current_aqi: number;
  predicted_24h_aqi: number;
  risk_level: 'Low' | 'Moderate' | 'Unhealthy' | 'Severe';
  primary_pollutant: string;
  humidity_pct: number;
  temp_c: number;
  wind_speed_kmh: number;
  historical_comparison: string;
  mitigation_recommendation: string;
}

export interface EvaluationItem {
  id: string;
  case_name: string;
  category: string;
  input_summary: string;
  expected_type: string;
  expected_severity: number;
  actual_type: string;
  actual_severity: number;
  gatekeeper_status: 'Pass' | 'Fail';
  specialist_consensus: string;
  status: 'PASS' | 'FAIL';
  latency_ms: number;
  notes: string;
}

export interface EvalResultsData {
  summary: {
    total_test_cases: number;
    passed: number;
    accuracy_pct: number;
    avg_latency_ms: number;
    hallucination_rate_pct: number;
    multi_agent_gain_vs_single_prompt: string;
  };
  single_vs_multi_comparison: {
    metric: string;
    single_prompt: string;
    multi_agent: string;
    advantage: string;
  }[];
  air_quality_backtest: {
    date: string;
    actual_aqi: number;
    predicted_aqi: number;
    zone: string;
    variance: number;
  }[];
  known_limitations: string[];
  test_cases: EvaluationItem[];
}
