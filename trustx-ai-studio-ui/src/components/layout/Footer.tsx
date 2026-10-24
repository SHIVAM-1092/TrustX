import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-[#070A11] text-slate-400 py-6 px-4 sm:px-6 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left disclaimer */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
          <div className="p-2 rounded-md bg-slate-900 border border-slate-800 text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-mono font-bold text-slate-200 tracking-wider flex items-center gap-2 justify-center sm:justify-start">
              <span>AUTHORIZED LOCAL LAB ONLY</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                CYBERRANGE_ENV=local
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xl">
              TrustX AI Cybersecurity Range — Hack in the Hills Prototype. All attacks, requests, model outputs, gateway decisions, and flags operate in a local deterministic browser simulation. No external network attacks, automated scanning, or credential harvesting permitted.
            </p>
          </div>
        </div>

        {/* Right compliance notice */}
        <div className="flex flex-col items-center md:items-end text-center md:text-right text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Educational Research Prototype</span>
          </div>
          <div className="font-mono text-slate-400">
            Build v2.4.0 • Standalone Offline Capable
          </div>
        </div>
      </div>
    </footer>
  );
};
