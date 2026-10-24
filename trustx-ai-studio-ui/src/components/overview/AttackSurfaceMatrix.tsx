import React from 'react';
import { ShieldAlert, CheckCircle2, Lock, ArrowUpRight } from 'lucide-react';

interface AttackSurfaceItem {
  id: string;
  name: string;
  code: string;
  coverage: 'Active Lab' | 'Preview Lab' | 'Planned Roadmap';
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
  challengeRef?: string;
}

const ATTACK_SURFACES: AttackSurfaceItem[] = [
  {
    id: 'llm01',
    name: 'Prompt Injection & Delimiter Escape',
    code: 'LLM01',
    coverage: 'Active Lab',
    riskLevel: 'CRITICAL',
    description: 'Direct & indirect prompt manipulation causing unauthorized execution or system prompt disclosure.',
    challengeRef: 'lab-prompt-injection'
  },
  {
    id: 'llm02',
    name: 'Insecure Output Handling & XSS',
    code: 'LLM02',
    coverage: 'Preview Lab',
    riskLevel: 'HIGH',
    description: 'Downstream unescaped parsing of LLM outputs leading to XSS or client-side execution.'
  },
  {
    id: 'llm03',
    name: 'BOLA on Agent Tool Calling & API Gateways',
    code: 'LLM07',
    coverage: 'Preview Lab',
    riskLevel: 'CRITICAL',
    description: 'Broken Object-Level Authorization when autonomous agents call internal microservices.',
    challengeRef: 'lab-api-authorization-bola'
  },
  {
    id: 'llm04',
    name: 'Excessive Agency & Autonomous Actions',
    code: 'LLM08',
    coverage: 'Preview Lab',
    riskLevel: 'HIGH',
    description: 'AI agents granted excessive permissions dispatching state-changing actions without human confirmation.',
    challengeRef: 'lab-csrf-action-dispatcher'
  },
  {
    id: 'llm05',
    name: 'Cross-Domain Origin Policy (CORS)',
    code: 'WEB01',
    coverage: 'Preview Lab',
    riskLevel: 'HIGH',
    description: 'Wildcard CORS configurations exposing authenticated AI session telemetry across domains.',
    challengeRef: 'lab-cors-misconfiguration'
  },
  {
    id: 'llm06',
    name: 'Clickjacking & UI Redressing on Approvals',
    code: 'WEB02',
    coverage: 'Preview Lab',
    riskLevel: 'MEDIUM',
    description: 'Framing human-in-the-loop authorization modals to trick operators into critical delegations.',
    challengeRef: 'lab-clickjacking-approval'
  }
];

export const AttackSurfaceMatrix: React.FC<{ onSelectChallenge?: (id: string) => void }> = ({
  onSelectChallenge
}) => {
  return (
    <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              AI & Web Attack Surface Coverage (OWASP LLM Matrix)
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized threat taxonomy mapped against TrustX interactive labs and security gateway guardrails.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
            6 SCENARIOS MAPPED
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {ATTACK_SURFACES.map(item => (
          <div
            key={item.id}
            className={`p-4 rounded-lg bg-[#070A11] border transition-all flex flex-col justify-between ${
              item.coverage === 'Active Lab'
                ? 'border-cyan-500/50 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500/30'
                : 'border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {item.code}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    item.coverage === 'Active Lab'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.coverage}
                </span>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">{item.name}</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span
                className={`text-[10px] font-mono font-semibold ${
                  item.riskLevel === 'CRITICAL'
                    ? 'text-rose-400'
                    : item.riskLevel === 'HIGH'
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                RISK: {item.riskLevel}
              </span>

              {item.challengeRef && onSelectChallenge && (
                <button
                  onClick={() => onSelectChallenge(item.challengeRef!)}
                  className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  <span>Launch Lab</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
