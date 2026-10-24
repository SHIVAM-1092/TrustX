import React from 'react';
import { AlertTriangle, Terminal, ShieldAlert } from 'lucide-react';

interface DemoBannerProps {
  gatewayMode: 'permissive' | 'strict';
}

export const DemoBanner: React.FC<DemoBannerProps> = ({ gatewayMode }) => {
  return (
    <aside
      aria-label="Demo environment status"
      className="bg-[#070A11] border-b border-slate-800 text-xs px-4 py-1.5 flex items-center justify-between flex-wrap gap-2 text-slate-400 select-none"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 font-mono font-semibold text-[11px]">
          <Terminal className="w-3 h-3" />
          LOCAL SECURITY SIMULATION
        </span>
        <span className="flex items-center gap-1 text-slate-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-slate-200">DEMO SIMULATION:</span>
          <span>Deterministic local cybersecurity training environment. No external network traffic.</span>
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-mono">
        <span className="text-slate-400 hidden sm:inline">
          GATEWAY:
          <span
            className={`ml-1 font-semibold ${
              gatewayMode === 'strict' ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {gatewayMode === 'strict' ? 'STRICT ENFORCEMENT' : 'PERMISSIVE / TRAINING'}
          </span>
        </span>
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <ShieldAlert className="w-3 h-3 text-emerald-400" />
          LOCAL LAB ONLINE
        </span>
      </div>
    </aside>
  );
};
