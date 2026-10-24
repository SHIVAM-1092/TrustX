import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Database,
  Terminal,
  Activity,
  CheckCircle2,
  FileCheck2,
  Zap
} from 'lucide-react';
import { GatewayMode } from '../../types/gateway';
import { CorsSimulatorCard } from './CorsSimulatorCard';

interface AdminDemoViewProps {
  gatewayMode: GatewayMode;
  onToggleGatewayMode: (mode: GatewayMode) => void;
  onResetAll: () => void;
  onPreloadSolved: () => void;
  onSeedLogs: () => void;
}

export const AdminDemoView: React.FC<AdminDemoViewProps> = ({
  gatewayMode,
  onToggleGatewayMode,
  onResetAll,
  onPreloadSolved,
  onSeedLogs
}) => {
  const [notification, setNotification] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleReset = () => {
    onResetAll();
    showNotice('Demo laboratory state restored to pristine default.');
  };

  const handlePreload = () => {
    onPreloadSolved();
    showNotice('Preloaded Solved State for Prompt Injection Lab. Flag unlocked!');
  };

  const handleSeed = () => {
    onSeedLogs();
    showNotice('Seeded 3 new forensic audit telemetry events.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white tracking-wide">
              Lab Admin & Demo Environment Controller
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-[10px] font-mono text-emerald-400 border border-emerald-800/40">
              LOCAL LAB ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Presentation controls, environment configuration, scenario reset tools, and safety assertions.
          </p>
        </div>

        {notification && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs animate-in fade-in">
            {notification}
          </div>
        )}
      </div>

      {/* Safety & Compliance Card */}
      <div className="rounded-xl bg-[#0B0F19] border border-amber-500/30 p-5 space-y-3">
        <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm font-mono">
          <AlertTriangle className="w-5 h-5" />
          <span>AUTHORIZED LOCAL LAB ONLY — SAFETY PROTOCOL ASSERTION</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          This prototype operates exclusively in an authorized local environment (<code>CYBERRANGE_ENV=local</code>). All adversarial requests, prompt injection payloads, gateway policy evaluations, and flags are executed in a deterministic browser-local sandbox. No automated attacks against third-party systems, network scanning, credential harvesting, or destructive malware behaviors are present.
        </p>
        <div className="p-3 rounded-lg bg-[#070A11] border border-slate-800/80 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
          <span>Simulation Boundary: BROWSER_LOCAL_SANDBOX</span>
          <span>External Attacks: DISABLED (FAIL CLOSED)</span>
          <span>Crypto Audit Claim: SIMULATED (EDUCATIONAL USE)</span>
        </div>
      </div>

      {/* Presentation Scenario Controls */}
      <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide">
              Recording & Demo Quick Actions
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            HACK IN THE HILLS CONTROLS
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Preload Solved State */}
          <div className="p-4 rounded-lg bg-[#070A11] border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs font-bold mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Preload Solved State</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Instantly marks the Prompt Injection lab solved and reveals the verified flag. Ideal for recording or demoing the completion screen.
              </p>
            </div>
            <button
              onClick={handlePreload}
              className="w-full py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition-colors cursor-pointer"
            >
              Preload Solved State
            </button>
          </div>

          {/* Action 2: Toggle Gateway Mode */}
          <div className="p-4 rounded-lg bg-[#070A11] border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold mb-1">
                <Activity className="w-4 h-4" />
                <span>Gateway Enforcement Mode</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Currently: <strong className="text-white uppercase">{gatewayMode}</strong>. Toggle to demonstrate how the hardened gateway stops the attack with a 403 Forbidden.
              </p>
            </div>
            <button
              onClick={() => {
                onToggleGatewayMode(gatewayMode === 'strict' ? 'permissive' : 'strict');
                showNotice(`Gateway switched to ${gatewayMode === 'strict' ? 'Permissive' : 'Strict'} mode.`);
              }}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs font-mono transition-colors cursor-pointer"
            >
              Toggle to {gatewayMode === 'strict' ? 'Permissive' : 'Strict'} Mode
            </button>
          </div>

          {/* Action 3: Reset All Demo State */}
          <div className="p-4 rounded-lg bg-[#070A11] border border-slate-800 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-rose-400 font-mono text-xs font-bold mb-1">
                <RotateCcw className="w-4 h-4" />
                <span>Reset Demo State</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Clears all solved flags, completed checklist tasks, and session history to restore pristine initial walkthrough state.
              </p>
            </div>
            <button
              onClick={handleReset}
              className="w-full py-2 px-3 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 font-bold text-xs font-mono transition-colors cursor-pointer"
            >
              Reset All Lab State
            </button>
          </div>
        </div>
      </div>

      {/* Simulated Cross-Domain (CORS) Bench */}
      <CorsSimulatorCard />
    </div>
  );
};
