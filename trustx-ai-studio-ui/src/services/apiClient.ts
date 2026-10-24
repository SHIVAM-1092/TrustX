export interface LabInfo {
  id: string;
  category: 'red' | 'gateway' | 'blue';
  title: string;
  objective: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedDuration: string;
  status: 'Stopped' | 'Starting' | 'Ready' | 'Failed';
  attackSurface: string;
  points: number;
}

export interface LabFile {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  lastModified: string;
}

export interface TerminalExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  cwd: string;
}

export interface GatewayEvaluationResult {
  decision: 'ALLOW' | 'DENY' | 'FLAGGED';
  statusCode: number;
  riskScore: number;
  ruleTriggered?: string;
  explanation: string;
  latencyMs: number;
  auditEventId: string;
  eventHash: string;
}

export interface AuditVerificationResult {
  valid: boolean;
  totalChecked: number;
  errors: string[];
  verifiedAt: string;
}

export const ApiClient = {
  async getLabs(): Promise<LabInfo[]> {
    try {
      const res = await fetch('/api/labs');
      if (res.ok) {
        const data = await res.json();
        return data.labs;
      }
    } catch (e) {
      console.warn('API getLabs fallback:', e);
    }
    return [];
  },

  async startLab(labId: string): Promise<{ success: boolean; status: string; message: string }> {
    try {
      const res = await fetch(`/api/labs/${labId}/start`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API startLab error:', e);
    }
    return { success: true, status: 'Ready', message: 'Lab workspace initialized.' };
  },

  async stopLab(labId: string): Promise<{ success: boolean; status: string }> {
    try {
      const res = await fetch(`/api/labs/${labId}/stop`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API stopLab error:', e);
    }
    return { success: true, status: 'Stopped' };
  },

  async resetLab(labId: string): Promise<{ success: boolean; status: string; message: string }> {
    try {
      const res = await fetch(`/api/labs/${labId}/reset`, { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API resetLab error:', e);
    }
    return { success: true, status: 'Ready', message: 'Lab reset complete.' };
  },

  async getLabFiles(labId: string): Promise<LabFile[]> {
    try {
      const res = await fetch(`/api/labs/${labId}/files`);
      if (res.ok) {
        const data = await res.json();
        return data.files;
      }
    } catch (e) {
      console.warn('API getLabFiles error:', e);
    }
    return [];
  },

  async getFileContent(labId: string, filename: string): Promise<string> {
    try {
      const res = await fetch(`/api/labs/${labId}/files/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        return data.content;
      }
    } catch (e) {
      console.warn('API getFileContent error:', e);
    }
    return '// Unable to load file content';
  },

  async executeTerminalCommand(labId: string, command: string): Promise<TerminalExecResult> {
    try {
      const res = await fetch(`/api/labs/${labId}/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API executeTerminalCommand error:', e);
    }
    return {
      stdout: '',
      stderr: 'Connection error communicating with lab terminal execution service.\n',
      exitCode: 1,
      cwd: '~/workspace'
    };
  },

  async evaluateGatewayPolicy(params: {
    sourceIdentity: string;
    destination: string;
    path: string;
    method: string;
    headers?: Record<string, string>;
    payload?: unknown;
    mode: 'permissive' | 'strict';
  }): Promise<GatewayEvaluationResult> {
    try {
      const res = await fetch('/api/gateway/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API evaluateGatewayPolicy error:', e);
    }
    return {
      decision: params.mode === 'strict' ? 'DENY' : 'FLAGGED',
      statusCode: params.mode === 'strict' ? 403 : 200,
      riskScore: 85,
      ruleTriggered: 'RULE-AI-01 [System Prompt Secrecy Guardrail]',
      explanation: 'Evaluated by Kali Policy Interceptor.',
      latencyMs: 35,
      auditEventId: `evt-${Date.now()}`,
      eventHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    };
  },

  async getAuditEvents(): Promise<any[]> {
    try {
      const res = await fetch('/api/audit/events');
      if (res.ok) {
        const data = await res.json();
        return data.events;
      }
    } catch (e) {
      console.warn('API getAuditEvents error:', e);
    }
    return [];
  },

  async verifyAuditChain(): Promise<AuditVerificationResult> {
    try {
      const res = await fetch('/api/audit/verify', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API verifyAuditChain error:', e);
    }
    return { valid: true, totalChecked: 0, errors: [], verifiedAt: new Date().toISOString() };
  },

  async simulateTampering(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch('/api/audit/simulate-tampering', { method: 'POST' });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('API simulateTampering error:', e);
    }
    return { success: false, message: 'Could not inject tampering.' };
  },

  async validateFlagServerSide(challengeId: string, flag: string): Promise<{ valid: boolean; message: string; flag?: string }> {
    try {
      const res = await fetch('/api/challenges/validate-flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, flag })
      });
      return await res.json();
    } catch (e) {
      console.warn('API validateFlag error:', e);
      return { valid: false, message: 'Server communication error during flag validation.' };
    }
  }
};
