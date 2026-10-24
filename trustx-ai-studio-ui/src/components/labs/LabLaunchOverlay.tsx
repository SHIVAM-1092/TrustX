import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  RotateCcw,
  Sparkles,
  Server
} from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

interface LabLaunchOverlayProps {
  labId: string;
  labTitle: string;
  category: 'red' | 'gateway' | 'blue';
  onComplete: () => void;
  onCancel: () => void;
}

interface StepItem {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
}

export const LabLaunchOverlay: React.FC<LabLaunchOverlayProps> = ({
  labId,
  labTitle,
  category,
  onComplete,
  onCancel
}) => {
  const [progress, setProgress] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<'Starting' | 'Ready' | 'Failed'>('Starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [steps, setSteps] = useState<StepItem[]>([
    { id: 'sandbox', label: 'Provision disposable container sandbox', completed: false, current: true },
    { id: 'storage', label: 'Seed practice files & exploit fixtures', completed: false, current: false },
    { id: 'worker', label: 'Initialize non-root terminal execution worker', completed: false, current: false },
    { id: 'gateway', label: 'Connect TrustX Security Gateway policy interceptor', completed: false, current: false },
    { id: 'target', label: 'Verify synthetic target endpoint readiness', completed: false, current: false }
  ]);

  useEffect(() => {
    let isCancelled = false;

    const addLog = (msg: string) => {
      const time = new Date().toTimeString().split(' ')[0];
      setLogs(prev => [...prev, `[${time}] ${msg}`]);
    };

    const runLaunchSequence = async () => {
      try {
        addLog(`Initiating launch sequence for [${labId}]...`);
        setProgress(20);

        // Step 1: Sandbox provision
        await new Promise(r => setTimeout(r, 350));
        if (isCancelled) return;
        addLog(`[SANDBOX] Allocating isolated directory: /tmp/trustx-sandbox/${labId}`);
        setSteps(prev =>
          prev.map(s =>
            s.id === 'sandbox' ? { ...s, completed: true, current: false } : s.id === 'storage' ? { ...s, current: true } : s
          )
        );
        setProgress(40);

        // Call real backend API
        const startResult = await ApiClient.startLab(labId);
        if (!startResult.success) {
          throw new Error('Backend failed to initialize sandbox directory.');
        }

        // Step 2: Seed practice files
        await new Promise(r => setTimeout(r, 350));
        if (isCancelled) return;
        addLog(`[STORAGE] Mounted practice fixtures: instructions.md, exploit_poc.py, target_request.http, agent_schema.json`);
        setSteps(prev =>
          prev.map(s =>
            s.id === 'storage' ? { ...s, completed: true, current: false } : s.id === 'worker' ? { ...s, current: true } : s
          )
        );
        setProgress(60);

        // Step 3: Terminal worker
        await new Promise(r => setTimeout(r, 350));
        if (isCancelled) return;
        addLog(`[DAEMON] Terminal worker bound to sandbox. Non-root user: operator@trustx-lab.`);
        setSteps(prev =>
          prev.map(s =>
            s.id === 'worker' ? { ...s, completed: true, current: false } : s.id === 'gateway' ? { ...s, current: true } : s
          )
        );
        setProgress(80);

        // Step 4: Policy Gateway
        await new Promise(r => setTimeout(r, 300));
        if (isCancelled) return;
        addLog(`[GATEWAY] Security interceptor linked. Policy rules RULE-AI-01, RULE-AI-02 active.`);
        setSteps(prev =>
          prev.map(s =>
            s.id === 'gateway' ? { ...s, completed: true, current: false } : s.id === 'target' ? { ...s, current: true } : s
          )
        );
        setProgress(92);

        // Step 5: Synthetic target health check
        await new Promise(r => setTimeout(r, 300));
        if (isCancelled) return;
        addLog(`[HEALTH] Synthetic target endpoint responding (HTTP 200 OK).`);
        setSteps(prev =>
          prev.map(s => (s.id === 'target' ? { ...s, completed: true, current: false } : s))
        );
        setProgress(100);

        addLog(`[READY] Lab workspace initialized and ready for operator.`);
        setStatus('Ready');

        // Transition to workspace
        setTimeout(() => {
          if (!isCancelled) {
            onComplete();
          }
        }, 600);
      } catch (err: any) {
        if (!isCancelled) {
          setStatus('Failed');
          setErrorMessage(err.message || 'Lab initialization failed.');
          addLog(`[ERROR] ${err.message || 'Failed to start lab.'}`);
        }
      }
    };

    runLaunchSequence();

    return () => {
      isCancelled = true;
    };
  }, [labId, onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="launch-modal-title"
    >
      <div className="relative w-full max-w-2xl bg-[#0B0F19] border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden p-6 space-y-6">
        {/* Top Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-xl border ${
                category === 'red'
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-400'
                  : category === 'gateway'
                  ? 'bg-cyan-950/80 border-cyan-500/40 text-cyan-400'
                  : 'bg-blue-950/80 border-blue-500/40 text-blue-400'
              }`}
            >
              <Terminal className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold bg-slate-800 text-slate-300">
                  {category.toUpperCase()} TEAM LAB
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    status === 'Ready'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : status === 'Failed'
                      ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/40'
                  }`}
                >
                  {status}
                </span>
              </div>
              <h2 id="launch-modal-title" className="text-lg font-bold text-white mt-1">
                {labTitle}
              </h2>
            </div>
          </div>

          <button
            onClick={onCancel}
            aria-label="Cancel lab launch"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">LAB ENVIRONMENT INITIALIZATION</span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                status === 'Failed'
                  ? 'bg-rose-500'
                  : status === 'Ready'
                  ? 'bg-emerald-400'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Multi-step Status Check List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
          {steps.map(step => (
            <div
              key={step.id}
              className={`p-2.5 rounded-lg border flex items-center gap-2 transition-all ${
                step.completed
                  ? 'bg-slate-900/60 border-emerald-500/40 text-emerald-300'
                  : step.current
                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-200 animate-pulse'
                  : 'bg-[#070A11] border-slate-800 text-slate-500'
              }`}
            >
              {step.completed ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : step.current ? (
                <span className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className="truncate">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Terminal Startup Log */}
        <div className="space-y-1">
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            CONTAINER STARTUP TELEMETRY LOG
          </span>
          <div className="p-3 bg-[#05070D] rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 max-h-36 overflow-y-auto space-y-1">
            {logs.map((log, i) => (
              <div key={i} className="leading-tight">
                <span className="text-slate-500 select-none">› </span>
                <span className={log.includes('[ERROR]') ? 'text-rose-400' : 'text-slate-300'}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error or Footer Actions */}
        {status === 'Failed' && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/60 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage || 'Lab initialization failed.'}</span>
            </div>
            <button
              onClick={() => {
                setStatus('Starting');
                setProgress(10);
                setLogs([]);
              }}
              className="px-3 py-1 rounded bg-rose-900 text-white font-mono hover:bg-rose-800 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs font-mono text-slate-400">
            Sandbox Path: <code className="text-cyan-400">/tmp/trustx-sandbox/{labId}</code>
          </span>
          <button
            onClick={onCancel}
            className="px-4 py-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
