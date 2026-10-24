import { ForensicEvent } from '../types/evidence';

export const INITIAL_EVIDENCE_LOGS: ForensicEvent[] = [
  {
    id: 'evt-audit-10492',
    timestamp: '2026-10-22T06:45:12Z',
    challengeId: 'lab-prompt-injection',
    challengeTitle: 'Prompt Injection — System Prompt Extraction',
    sourceIp: '192.168.1.104',
    userAgent: 'Kali-RedTeam-Workbench/2.4 (X11; Linux x86_64)',
    endpoint: '/api/v1/synthetic/agent/chat',
    method: 'POST',
    origin: 'http://localhost:3000',
    policyDecision: 'ALLOWED',
    severity: 'INFO',
    ruleTriggered: 'RULE-AI-02 [Boundary Demarcation Check]',
    riskScore: 12,
    inspectionSteps: [
      { name: 'Lexical Analysis', passed: true, score: 5, details: 'Standard natural language vocabulary detected.' },
      { name: 'System Boundary Enforcement', passed: true, score: 8, details: 'No delimiter escape or override keywords found.' },
      { name: 'Heuristic Scorer', passed: true, score: 12, details: 'Inquiry corresponds to benign customer FAQ pattern.' }
    ],
    promptPreview: 'Hello, what are standard customer service hours for mortgage assistance?',
    responsePreview: 'Our standard customer service assistance is available Monday through Friday from 8:00 AM to 6:00 PM EST.',
    flagCaptured: false,
    rawHeaders: {
      'content-type': 'application/json',
      'x-request-id': 'req-9882-a7f1',
      'x-demo-identity': 'operator-student@hackinthehills.local'
    },
    rawPayload: {
      model: 'apexfin-synth-v3',
      messages: [{ role: 'user', content: 'Hello, what are standard customer service hours for mortgage assistance?' }]
    },
    rawResponse: {
      status: 'success',
      completion_tokens: 28,
      message: 'Our standard customer service assistance is available Monday through Friday from 8:00 AM to 6:00 PM EST.'
    },
    forensicHash: '8b7f3a91c6e4d022bfe58c1719b88231e6729013c7a840d216f40b28e5ad67c9'
  },
  {
    id: 'evt-audit-10491',
    timestamp: '2026-10-22T06:40:05Z',
    challengeId: 'lab-api-authorization-bola',
    challengeTitle: 'API Authorization Boundaries — BOLA on Agent Tools',
    sourceIp: '10.0.4.15',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Kali-Security-Scan',
    endpoint: '/api/v1/tools/execute',
    method: 'POST',
    origin: 'http://localhost:3000',
    policyDecision: 'FLAGGED',
    severity: 'WARN',
    ruleTriggered: 'RULE-SEC-04 [Tenant BOLA Anomaly]',
    riskScore: 68,
    inspectionSteps: [
      { name: 'Caller Session Validation', passed: true, score: 10, details: 'Caller authenticated as org_current_102' },
      { name: 'Target Parameter Audit', passed: false, score: 68, details: 'Target organizationId mismatched caller profile' }
    ],
    promptPreview: '{"tool": "fetch_org_telemetry", "params": {"organizationId": "org_partner_991"}}',
    responsePreview: '{"error": "Simulated cross-tenant access recorded in telemetry"}',
    flagCaptured: false,
    rawHeaders: {
      'content-type': 'application/json',
      'x-tenant-id': 'org_current_102'
    },
    rawPayload: {
      tool: 'fetch_org_telemetry',
      params: { organizationId: 'org_partner_991' }
    },
    rawResponse: {
      error: 'Simulated cross-tenant access recorded in telemetry'
    },
    forensicHash: '4a1b8c2d9e0f3178229410ea663b15c9078f134591a27e366110cb8975deaf90'
  },
  {
    id: 'evt-audit-10490',
    timestamp: '2026-10-22T06:31:22Z',
    challengeId: 'lab-cors-misconfiguration',
    challengeTitle: 'CORS Misconfiguration — Cross-Domain AI Telemetry Leak',
    sourceIp: '203.0.113.88',
    userAgent: 'HeadlessChrome/124.0.0.0',
    endpoint: '/api/v1/telemetry/session',
    method: 'GET',
    origin: 'https://evil-untrusted-site.com',
    policyDecision: 'FLAGGED',
    severity: 'CRITICAL',
    ruleTriggered: 'RULE-NET-05 [Cross-Origin Wildcard Anomaly]',
    riskScore: 89,
    inspectionSteps: [
      { name: 'Origin Header Check', passed: false, score: 89, details: 'Untrusted origin https://evil-untrusted-site.com requested credentials' }
    ],
    promptPreview: 'GET /api/v1/telemetry/session with Origin: https://evil-untrusted-site.com',
    responsePreview: 'Access-Control-Allow-Origin: *; Access-Control-Allow-Credentials: true (Misconfigured demo endpoint)',
    flagCaptured: false,
    rawHeaders: {
      origin: 'https://evil-untrusted-site.com',
      cookie: 'session_token=demo_sess_9941a'
    },
    rawPayload: {},
    rawResponse: {
      session_active: true,
      user: 'operator_demo'
    },
    forensicHash: '619d08e5c3b1742a19fa628db9405c6e83109a471038bca8792015fa4d588e10'
  }
];
