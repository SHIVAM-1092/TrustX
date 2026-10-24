import { PolicyRule } from '../types/gateway';

export const POLICY_RULES: PolicyRule[] = [
  {
    id: 'RULE-AI-01',
    name: 'System Prompt Secrecy Guardrail',
    category: 'Prompt Injection Defense',
    description: 'Inspects user prompts for imperative override triggers, system directive disclosures, and role boundary escapes.',
    action: 'BLOCK',
    severity: 'CRITICAL',
    activeInPermissive: false, // In training mode, this rule generates alerts but allows execution so user can test!
    activeInStrict: true,
    regexPattern: '(ignore (all|previous|initial)|reveal (system|hidden|secret)|system prompt|instruction override)',
    mitigation: 'Enforce strict dual-channel message tagging (system role vs user role delimiter isolation).'
  },
  {
    id: 'RULE-AI-02',
    name: 'Delimiter Boundary Demarcation',
    category: 'Boundary Enforcement',
    description: 'Scans for artificial markdown fences and delimiter spoofing attempts (e.g. `--- END USER ---`).',
    action: 'FLAG',
    severity: 'HIGH',
    activeInPermissive: true,
    activeInStrict: true,
    regexPattern: '(---|===|<<<|>>>|BEGIN SYSTEM|END USER|USER CONTEXT)',
    mitigation: 'Sanitize synthetic context tokens and apply structural JSON message schema wrapping.'
  },
  {
    id: 'RULE-AI-03',
    name: 'Agent Maintenance Roleplay Filter',
    category: 'Heuristic Evasion',
    description: 'Detects diagnostic overrides, developer persona switching, and maintenance mode assertions.',
    action: 'BLOCK',
    severity: 'HIGH',
    activeInPermissive: false,
    activeInStrict: true,
    regexPattern: '(maintenance mode|debug mode|level 9|root diagnostic|auth_bypass)',
    mitigation: 'Implement zero-trust prompt intent classification before feeding inputs to model context.'
  },
  {
    id: 'RULE-SEC-04',
    name: 'Tool-Calling Tenant Authorization (BOLA)',
    category: 'API Security',
    description: 'Enforces strict tenant ownership checks before agent tools invoke downstream financial or telemetry services.',
    action: 'BLOCK',
    severity: 'CRITICAL',
    activeInPermissive: false,
    activeInStrict: true,
    regexPattern: 'organizationId!=callerTenantId',
    mitigation: 'Inject authenticated tenant context server-side; ignore tenant IDs specified in tool arguments.'
  },
  {
    id: 'RULE-NET-05',
    name: 'Cross-Origin Resource Sharing Guard',
    category: 'Web Security',
    description: 'Validates Origin header against strict allowlist. Rejects wildcard (*) with credentials.',
    action: 'BLOCK',
    severity: 'HIGH',
    activeInPermissive: false,
    activeInStrict: true,
    regexPattern: 'Origin!=allowed_origins',
    mitigation: 'Configure explicit origin verification and omit credentials when reflecting arbitrary origins.'
  },
  {
    id: 'RULE-OUT-06',
    name: 'Sensitive Secret & Flag Leakage Filter',
    category: 'Output Guardrail',
    description: 'Monitors outbound model tokens for high-entropy secrets, API keys, and internal flag formats.',
    action: 'BLOCK',
    severity: 'CRITICAL',
    activeInPermissive: false,
    activeInStrict: true,
    regexPattern: 'TRUSTX\\{[a-zA-Z0-9_]+\\}',
    mitigation: 'Real-time output stream masking and immediate session quarantine on secret detection.'
  }
];
