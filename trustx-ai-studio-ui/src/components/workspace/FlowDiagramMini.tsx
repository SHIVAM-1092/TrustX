import React from 'react';
import { Terminal, Shield, Cpu, FileCheck2, Database, ArrowRight } from 'lucide-react';
import { PolicyDecision } from '../../types/evidence';

interface FlowDiagramMiniProps {
  isExecuting: boolean;
  activeStage: number; // 0: Idle/Client, 1: Gateway, 2: Target, 3: Evaluator, 4: Evidence
  policyDecision?: PolicyDecision;
  flagCaptured?: boolean;
}

export const FlowDiagramMini: React.FC<FlowDiagramMiniProps> = ({
  isExecuting,
  activeStage,
  policyDecision,
  flagCaptured
}) => {
  const stages = [
    { name: 'Red Team', icon: Terminal, stageNum: 0 },
    { name: 'Policy Gateway', icon: Shield, stageNum: 1 },
    { name: 'Synthetic Target', icon: Cpu, stageNum: 2 },
    { name: 'Evaluator', icon: FileCheck2, stageNum: 3 },
    { name: 'Evidence', icon: Database, stageNum: 4 }
  ];

  return (
    <div className="rounded-lg bg-[#070A11] border border-slate-800 p-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2">
        <span className="font-semibold text-slate-300">REQUEST PIPELINE FLOW</span>
        <span className="text-[10px]">
          {isExecuting ? (
            <span className="text-cyan-400 animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              EVALUATING STAGE {activeStage + 1}/5
            </span>
          ) : policyDecision ? (
            <span
              className={
                policyDecision === 'BLOCKED'
                  ? 'text-rose-400 font-bold'
                  : policyDecision === 'FLAGGED'
                  ? 'text-amber-400 font-bold'
                  : 'text-emerald-400 font-bold'
              }
            >
              FLOW COMPLETE: {policyDecision}
            </span>
          ) : (
            <span className="text-slate-400">STANDBY / READY</span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 overflow-x-auto py-1">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isActive = isExecuting && activeStage === st.stageNum;
          const isPassed = !isExecuting && activeStage >= st.stageNum && policyDecision;
          const isBlockedHere = policyDecision === 'BLOCKED' && st.stageNum >= 1;

          return (
            <React.Fragment key={st.name}>
              <div
                className={`flex flex-col items-center p-2 rounded-md transition-all min-w-[68px] ${
                  isActive
                    ? 'bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-md shadow-cyan-950'
                    : isBlockedHere && st.stageNum === 1
                    ? 'bg-rose-950/60 border border-rose-500/60 text-rose-300'
                    : isPassed
                    ? 'bg-slate-900 border border-slate-700/80 text-slate-200'
                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400'
                }`}
              >
                <Icon
                  className={`w-4 h-4 mb-1 ${
                    isActive
                      ? 'text-cyan-400 animate-bounce'
                      : isBlockedHere && st.stageNum === 1
                      ? 'text-rose-400'
                      : isPassed
                      ? flagCaptured && st.stageNum === 3
                        ? 'text-emerald-400'
                        : 'text-cyan-400'
                      : 'text-slate-400'
                  }`}
                />
                <span className="text-[10px] font-mono font-medium text-center leading-tight truncate">
                  {st.name}
                </span>
              </div>

              {idx < stages.length - 1 && (
                <ArrowRight
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isExecuting && activeStage > idx
                      ? 'text-cyan-400 animate-pulse'
                      : isPassed
                      ? 'text-slate-600'
                      : 'text-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
