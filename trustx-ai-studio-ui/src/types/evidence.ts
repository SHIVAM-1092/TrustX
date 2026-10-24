export type PolicyDecision = 'ALLOWED' | 'BLOCKED' | 'FLAGGED';
export type EventSeverity = 'INFO' | 'WARN' | 'CRITICAL';

export interface InspectionStep {
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface ForensicEvent {
  id: string;
  timestamp: string;
  challengeId: string;
  challengeTitle: string;
  sourceIp: string;
  userAgent: string;
  endpoint: string;
  method: string;
  origin: string;
  policyDecision: PolicyDecision;
  severity: EventSeverity;
  ruleTriggered?: string;
  riskScore: number;
  inspectionSteps: InspectionStep[];
  promptPreview: string;
  responsePreview: string;
  flagCaptured: boolean;
  rawHeaders: Record<string, string>;
  rawPayload: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
  forensicHash: string;
}
