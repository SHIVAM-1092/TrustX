import React, { useState } from 'react';
import {
  Terminal,
  ShieldCheck,
  Cpu,
  FileCheck2,
  Database,
  ArrowRight,
  Info,
  CheckCircle2
} from 'lucide-react';

interface Stage {
  id: string;
  title: string;
  role: string;
  icon: typeof Terminal;
  badge: string;
  badgeColor: 'cyan' | 'emerald' | 'purple' | 'amber';
  description: string;
  technicalDetails: string[];
  sampleLog: string;
}

const STAGES: Stage[] = [
  {
    id: 'redteam',
    title: 'Red Team Client',
    role: 'Simulated Operator / Workstation',
    icon: Terminal,
    badge: 'SOURCE',
    badgeColor: 'amber',
    description: 'Generates structured baseline customer inquiries or adversarial prompt injection payloads.',
    technicalDetails: [
      'Simulated IP: 192.168.1.104',
      'Protocol: HTTP POST over JSON',
      'Interactive custom prompt editor with live payload templates',
      'Header customization: Authorization, X-Request-ID, Demo Identity'
    ],
    sampleLog: 'POST /api/v1/synthetic/agent/chat HTTP/1.1\nContent-Type: application/json\n{"prompt": "Ignore previous instructions..."}'
  },
  {
    id: 'gateway',
    title: 'TrustX Security Gateway',
    role: 'Real-Time Policy & Delimiter Guardrail',
    icon: ShieldCheck,
    badge: 'INSPECTOR',
    badgeColor: 'cyan',
    description: 'Inspects inbound prompts before they enter the language model context window. Performs lexical, semantic, and heuristic boundary analysis.',
    technicalDetails: [
      'Lexical Pattern Matching: Scans for override commands & jailbreak triggers',
      'Delimiter Demarcation: Detects markdown escapes & context spoofing',
      'Dual Operation Mode: Permissive (training alerts) vs Strict (403 block)',
      'Sub-50ms deterministic inspection latency'
    ],
    sampleLog: '[GATEWAY INSPECT] Lexical Score: 95/100 | Delimiter Alert: TRUE\nDecision: PERMISSIVE_ALLOW (TRAINING_MODE) | Risk: 96'
  },
  {
    id: 'target',
    title: 'Synthetic AI Target',
    role: 'Simulated ApexFin Agent (LLM Engine)',
    icon: Cpu,
    badge: 'TARGET',
    badgeColor: 'purple',
    description: 'Deterministic simulated financial customer assistant configured with hidden internal system directives and authorization token.',
    technicalDetails: [
      'Agent Identity: ApexFin Assistant (ID: TRUSTX-AGENT-FIN-09)',
      'Weak Delimiter Vulnerability: Priority inversion on user override',
      'Emits natural customer FAQ on baseline prompts',
      'Leaks internal prompt & secret flag on successful injection'
    ],
    sampleLog: '[SYNTHETIC LLM EXEC] Prompt tokens: 42 | Completion tokens: 128\nStatus: 200 OK | System Directive Leaked'
  },
  {
    id: 'evaluator',
    title: 'Challenge Evaluator',
    role: 'Objective & Flag Verification Engine',
    icon: FileCheck2,
    badge: 'VALIDATOR',
    badgeColor: 'emerald',
    description: 'Evaluates model output against mission success criteria and triggers flag validation.',
    technicalDetails: [
      'Pattern Regex: Extracts TRUSTX{...} flag strings',
      'Task Step Progression: Automatically marks completed checklist items',
      'Anti-Cheat: Flags are kept server-side until output evaluation succeeds',
      'Celebration Event Dispatcher: Unlocks copyable flag modal'
    ],
    sampleLog: '[EVALUATOR] Target Flag Match: TRUE\nCaptured: TRUSTX{pr0mpt_1nj3ct10n_syst3m_unl0ck3d_94a7}'
  },
  {
    id: 'evidence',
    title: 'Evidence & Forensic Ledger',
    role: 'Chronological Audit Telemetry',
    icon: Database,
    badge: 'AUDIT',
    badgeColor: 'cyan',
    description: 'Maintains an immutable browser-local forensic timeline with full request/response snapshots and forensic hashes.',
    technicalDetails: [
      'Persistent LocalStorage Event Sink (max 100 entries)',
      'Forensic SHA-256 hash generation for every request cycle',
      'Structured JSON audit export for laboratory reporting',
      'Search & filtering by severity, decision, and scenario'
    ],
    sampleLog: '[FORENSIC LEDGER] Stored event evt-10492 | Hash: 8b7f3a91... | Severity: CRITICAL'
  }
];

export const ArchitectureVisualizer: React.FC = () => {
  const [selectedStage, setSelectedStage] = useState<Stage>(STAGES[1]); // default Gateway

  return (
    <div className="rounded-xl bg-[#0B0F19] border border-slate-800 p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-wide">
              TrustX AI Defensive Architecture Flow
            </h2>
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-[10px] font-mono text-cyan-400 border border-cyan-800/40">
              INTERACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Click any component in the request pipeline below to inspect its operational role, inspection logic, and telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PIPELINE HEALTHY</span>
        </div>
      </div>

      {/* Flow Nodes Diagram */}
      <div className="py-8 overflow-x-auto">
        <div className="flex items-center justify-between min-w-[760px] gap-2 px-2">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isSelected = selectedStage.id === stage.id;
            return (
              <React.Fragment key={stage.id}>
                <button
                  onClick={() => setSelectedStage(stage)}
                  aria-label={`Select stage ${stage.title}`}
                  className={`flex-1 relative flex flex-col items-center p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'bg-[#070A11] border-slate-800 hover:border-slate-700 hover:bg-slate-900/40'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-lg flex items-center justify-center mb-2.5 transition-colors ${
                      isSelected
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-white tracking-tight line-clamp-1">
                    {stage.title}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {stage.role}
                  </div>
                  <span
                    className={`mt-2 text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      stage.badgeColor === 'amber'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                        : stage.badgeColor === 'cyan'
                        ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/40'
                        : stage.badgeColor === 'purple'
                        ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {stage.badge}
                  </span>
                </button>

                {idx < STAGES.length - 1 && (
                  <div className="flex items-center text-slate-600 px-1 shrink-0">
                    <ArrowRight className="w-4 h-4 text-cyan-500/60 animate-pulse" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Selected Stage Detail Drawer */}
      <div className="rounded-lg bg-[#070A11] border border-slate-800/90 p-5 mt-2">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <selectedStage.icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                {selectedStage.title} — {selectedStage.role}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedStage.description}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
            STAGE {STAGES.findIndex(s => s.id === selectedStage.id) + 1} OF 5
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Technical capabilities */}
          <div className="bg-slate-900/50 rounded-lg p-3.5 border border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <span>Inspection & Operational Specifications</span>
            </div>
            <ul className="space-y-1.5 text-slate-400 text-xs font-mono">
              {selectedStage.technicalDetails.map((detail, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-cyan-400 select-none">›</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sample log telemetry */}
          <div className="bg-slate-900/50 rounded-lg p-3.5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
              <span className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-400" />
                <span>Simulated Node Telemetry</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">RAW LOG</span>
            </div>
            <pre className="font-mono text-[11px] text-slate-300 bg-[#05070D] p-2.5 rounded border border-slate-800/80 overflow-x-auto whitespace-pre leading-relaxed">
              {selectedStage.sampleLog}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
