import { Challenge } from '../types/challenge';
import { ForensicEvent } from '../types/evidence';
import { GatewayMode } from '../types/gateway';
import { INITIAL_EVIDENCE_LOGS } from '../data/initialEvidence';
import { CHALLENGES } from '../data/challengesData';

const STORAGE_KEYS = {
  SOLVED_CHALLENGES: 'trustx_solved_challenges',
  TASKS_COMPLETED: 'trustx_tasks_completed',
  EVIDENCE_LOGS: 'trustx_evidence_logs',
  GATEWAY_MODE: 'trustx_gateway_mode',
  CAPTURED_FLAGS: 'trustx_captured_flags'
};

export const StorageService = {
  getSolvedChallenges(): string[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SOLVED_CHALLENGES);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveSolvedChallenge(challengeId: string): void {
    try {
      const solved = this.getSolvedChallenges();
      if (!solved.includes(challengeId)) {
        solved.push(challengeId);
        localStorage.setItem(STORAGE_KEYS.SOLVED_CHALLENGES, JSON.stringify(solved));
      }
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  getCompletedTasks(): Record<string, boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS_COMPLETED);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveTaskCompleted(taskId: string, completed = true): void {
    try {
      const tasks = this.getCompletedTasks();
      tasks[taskId] = completed;
      localStorage.setItem(STORAGE_KEYS.TASKS_COMPLETED, JSON.stringify(tasks));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  getEvidenceLogs(): ForensicEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVIDENCE_LOGS);
      return data ? JSON.parse(data) : INITIAL_EVIDENCE_LOGS;
    } catch {
      return INITIAL_EVIDENCE_LOGS;
    }
  },

  addEvidenceLog(event: ForensicEvent): ForensicEvent[] {
    try {
      const current = this.getEvidenceLogs();
      const updated = [event, ...current].slice(0, 100); // keep max 100
      localStorage.setItem(STORAGE_KEYS.EVIDENCE_LOGS, JSON.stringify(updated));
      return updated;
    } catch {
      return [event, ...INITIAL_EVIDENCE_LOGS];
    }
  },

  getGatewayMode(): GatewayMode {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.GATEWAY_MODE);
      return (mode === 'strict' ? 'strict' : 'permissive') as GatewayMode;
    } catch {
      return 'permissive';
    }
  },

  saveGatewayMode(mode: GatewayMode): void {
    try {
      localStorage.setItem(STORAGE_KEYS.GATEWAY_MODE, mode);
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  getCapturedFlags(): Record<string, string> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CAPTURED_FLAGS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveCapturedFlag(challengeId: string, flag: string): void {
    try {
      const flags = this.getCapturedFlags();
      flags[challengeId] = flag;
      localStorage.setItem(STORAGE_KEYS.CAPTURED_FLAGS, JSON.stringify(flags));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  },

  resetAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SOLVED_CHALLENGES);
      localStorage.removeItem(STORAGE_KEYS.TASKS_COMPLETED);
      localStorage.removeItem(STORAGE_KEYS.EVIDENCE_LOGS);
      localStorage.removeItem(STORAGE_KEYS.GATEWAY_MODE);
      localStorage.removeItem(STORAGE_KEYS.CAPTURED_FLAGS);
    } catch (e) {
      console.warn('LocalStorage reset failed:', e);
    }
  },

  preloadSolvedState(): void {
    try {
      const solved = ['lab-prompt-injection'];
      localStorage.setItem(STORAGE_KEYS.SOLVED_CHALLENGES, JSON.stringify(solved));
      
      const promptChallenge = CHALLENGES.find(c => c.id === 'lab-prompt-injection');
      if (promptChallenge) {
        const tasks: Record<string, boolean> = {};
        promptChallenge.tasks.forEach(t => {
          tasks[t.id] = true;
        });
        localStorage.setItem(STORAGE_KEYS.TASKS_COMPLETED, JSON.stringify(tasks));
        this.saveCapturedFlag(promptChallenge.id, promptChallenge.flag);
      }
    } catch (e) {
      console.warn('Preload failed:', e);
    }
  }
};
