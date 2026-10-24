export type GatewayMode = 'permissive' | 'strict';

export interface PolicyRule {
  id: string;
  name: string;
  category: string;
  description: string;
  action: 'BLOCK' | 'FLAG' | 'ALLOW';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  activeInPermissive: boolean;
  activeInStrict: boolean;
  regexPattern: string;
  mitigation: string;
}

export interface GatewayMetrics {
  totalRequests: number;
  blockedRequests: number;
  flaggedThreats: number;
  avgLatencyMs: number;
  activeGuardrails: number;
}
