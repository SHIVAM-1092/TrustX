export interface AuditEvent {
  event_id: string;
  timestamp: number;
  event_type: 'ACCESS_ALLOWED' | 'ACCESS_DENIED' | 'UPSTREAM_ERROR' | 'POLICY_RELOAD';
  source_domain: string;
  destination_domain: string;
  path: string;
  method: string;
  allowed: boolean;
  client_subject?: string;
  status_code?: number;
  details?: Record<string, any>;
  prev_hash: string;
  hash: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  category: string;
  payload: string;
}

export interface TargetState {
  system_prompt: string;
  vulnerabilities: Record<string, boolean>;
  request_count: number;
  compromised: boolean;
  conversation_count: number;
}

export interface AuditVerificationResult {
  valid: boolean;
  errors: string[];
}

export interface Challenge {
  id: string;
  name: string;
  category: string;
  objective: string;
  description: string;
  difficulty: string;
  hints: string[];
  flag_format: string;
  target_endpoint: string;
  target_model: string;
}

export interface ChallengeAttackResponse {
  challenge_id: string;
  success: boolean;
  feedback: string;
  flag?: string;
  target_response?: string;
  gateway_status: number;
  attempt_number: number;
  completed: boolean;
}

// Execution Environment Types
export interface ExecSession {
  session_id: string;
  created_at: string;
  last_used: string;
  working_dir: string;
  command_count: number;
}

export interface ExecRequest {
  command: string[];
  session_id?: string;
  timeout?: number;
  max_output?: number;
}

export interface ExecResponse {
  exit_code: number;
  stdout: string;
  stderr: string;
  timed_out: boolean;
  truncated: boolean;
  session_id: string;
  working_dir: string;
  duration_ms: number;
}

export interface ExecHealth {
  status: string;
  service: string;
  active_sessions: number;
  max_sessions: number;
}