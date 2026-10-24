import {
  AuditEvent,
  Scenario,
  TargetState,
  AuditVerificationResult,
  Challenge,
  ChallengeAttackResponse,
  ExecSession,
  ExecRequest,
  ExecResponse,
  ExecHealth
} from '../types';

// Use Vite proxy path - authentication is injected by Vite dev server proxy (server-side)
const GATEWAY_URL = '/api';

// Execution environment URLs (proxied via Vite in dev, direct in production)
const RED_EXEC_URL = '/api/red-exec';
const BLUE_EXEC_URL = '/api/blue-exec';

const headers = {
  'Content-Type': 'application/json',
};

export type { ChallengeAttackResponse };

export const api = {
  // Gateway status
  async getHealth() {
    const res = await fetch(`${GATEWAY_URL}/health`, { headers });
    return res.json();
  },

  // Audit Log
  async getAuditEvents(limit = 50): Promise<{ events: AuditEvent[]; total: number }> {
    const res = await fetch(`${GATEWAY_URL}/audit/events?limit=${limit}`, { headers });
    return res.json();
  },

  async verifyAuditChain(): Promise<AuditVerificationResult> {
    const res = await fetch(`${GATEWAY_URL}/audit/verify`, { headers });
    return res.json();
  },

  // Red Team Actions (via Gateway proxy)
  async getRedScenarios(): Promise<Scenario[]> {
    const res = await fetch(`${GATEWAY_URL}/red/v1/scenarios`, { headers });
    return res.json();
  },

  async launchAttack(scenarioId: string, customPayload?: string) {
    const res = await fetch(`${GATEWAY_URL}/red/v1/simulate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ scenario_id: scenarioId, custom_payload: customPayload }),
    });
    return res.json();
  },

  // Challenge Actions (via Gateway proxy to Red Team service)
  async getChallenges(): Promise<Challenge[]> {
    const res = await fetch(`${GATEWAY_URL}/red/v1/challenges`, { headers });
    const data = await res.json();
    // The gateway may return either Challenge[] directly or { challenges: Challenge[] }
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && 'challenges' in data) {
      return data.challenges;
    }
    return [];
  },

  async getChallenge(challengeId: string): Promise<Challenge> {
    const res = await fetch(`${GATEWAY_URL}/red/v1/challenges/${challengeId}`, { headers });
    return res.json();
  },

  async challengeAttack(challengeId: string, payload: string): Promise<ChallengeAttackResponse> {
    const res = await fetch(`${GATEWAY_URL}/red/v1/challenges/${challengeId}/attack`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ challenge_id: challengeId, payload, subject: 'learner' }),
    });
    return res.json();
  },

  async challengeReset(challengeId: string) {
    const res = await fetch(`${GATEWAY_URL}/red/v1/challenges/${challengeId}/reset`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ subject: 'learner' }),
    });
    return res.json();
  },

  // Target Actions (via Gateway proxy)
  async getTargetState(): Promise<TargetState> {
    const res = await fetch(`${GATEWAY_URL}/target/v1/state`, { headers });
    return res.json();
  },

  // Blue Team Actions (via Gateway proxy)
  async triggerTargetReset() {
    const res = await fetch(`${GATEWAY_URL}/blue/v1/defend/reset-target`, {
      method: 'POST',
      headers,
    });
    return res.json();
  },

  // Security Boundary Test: Attempt illegal cross-domain request directly
  async testIllegalAccess() {
    const res = await fetch(`${GATEWAY_URL}/blue/health`, {
      headers: {
        'Content-Type': 'application/json',
        'X-TrustX-Domain': 'red',
      },
    });
    return {
      status: res.status,
      body: await res.json().catch(() => ({})),
    };
  },

  // ========================================================================
  // Red Team Execution Environment API
  // ========================================================================
  async redExecHealth(): Promise<ExecHealth> {
    const res = await fetch(`${RED_EXEC_URL}/health`, { headers });
    return res.json();
  },

  async redExecCreateSession(): Promise<ExecSession> {
    const res = await fetch(`${RED_EXEC_URL}/sessions`, {
      method: 'POST',
      headers,
    });
    return res.json();
  },

  async redExecGetSession(sessionId: string): Promise<ExecSession> {
    const res = await fetch(`${RED_EXEC_URL}/sessions/${sessionId}`, { headers });
    return res.json();
  },

  async redExecDeleteSession(sessionId: string) {
    const res = await fetch(`${RED_EXEC_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });
    return res.json();
  },

  async redExecExecute(req: ExecRequest): Promise<ExecResponse> {
    const res = await fetch(`${RED_EXEC_URL}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
    return res.json();
  },

  async redExecListSessions() {
    const res = await fetch(`${RED_EXEC_URL}/sessions`, { headers });
    return res.json();
  },

  // ========================================================================
  // Blue Team Execution Environment API
  // ========================================================================
  async blueExecHealth(): Promise<ExecHealth> {
    const res = await fetch(`${BLUE_EXEC_URL}/health`, { headers });
    return res.json();
  },

  async blueExecCreateSession(): Promise<ExecSession> {
    const res = await fetch(`${BLUE_EXEC_URL}/sessions`, {
      method: 'POST',
      headers,
    });
    return res.json();
  },

  async blueExecGetSession(sessionId: string): Promise<ExecSession> {
    const res = await fetch(`${BLUE_EXEC_URL}/sessions/${sessionId}`, { headers });
    return res.json();
  },

  async blueExecDeleteSession(sessionId: string) {
    const res = await fetch(`${BLUE_EXEC_URL}/sessions/${sessionId}`, {
      method: 'DELETE',
      headers,
    });
    return res.json();
  },

  async blueExecExecute(req: ExecRequest): Promise<ExecResponse> {
    const res = await fetch(`${BLUE_EXEC_URL}/execute`, {
      method: 'POST',
      headers,
      body: JSON.stringify(req),
    });
    return res.json();
  },

  async blueExecListSessions() {
    const res = await fetch(`${BLUE_EXEC_URL}/sessions`, { headers });
    return res.json();
  },

  // Blue Team specialized endpoints
  async blueExecAnalyze(logPath: string, searchTerms: string[]) {
    const res = await fetch(`${BLUE_EXEC_URL}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ log_path: logPath, search_terms: searchTerms }),
    });
    return res.json();
  },

  async blueExecDetect(logPath: string, sessionId?: string) {
    const res = await fetch(`${BLUE_EXEC_URL}/detect`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ log_path: logPath, session_id: sessionId }),
    });
    return res.json();
  },
};